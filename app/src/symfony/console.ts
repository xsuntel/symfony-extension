import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { toServiceMap, toRouteMap, toParameterMap } from './types';
import type { ServiceMap, RouteMap, ParameterMap } from './types';

const execFileAsync = promisify(execFile);

const CACHE_TTL_MS = 30_000;
// Failures expire sooner than successes so a project that starts working again
// recovers on its own, without the user having to hit Refresh.
const FAILURE_TTL_MS = 5_000;
const RUN_TIMEOUT_MS = 10_000;
// `debug:container` output on a large application exceeds Node's 1 MB default,
// which would otherwise surface as an ENOBUFS failure and an empty tree.
const MAX_BUFFER_BYTES = 16 * 1024 * 1024;

interface CacheEntry {
    data: unknown;
    time: number;
    ttl: number;
}

/**
 * Singleton that shells out to Symfony's `bin/console` and caches the JSON output.
 *
 * Every call is asynchronous: the extension host is single-threaded, so a synchronous
 * spawn here would stall every other extension for the duration of the PHP run.
 */
class SymfonyConsole {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly inflight = new Map<string, Promise<unknown>>();
    private generation = 0;

    getProjectRoot(): string | null {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            return null;
        }
        for (const folder of folders) {
            if (fs.existsSync(path.join(folder.uri.fsPath, 'bin', 'console'))) {
                return folder.uri.fsPath;
            }
        }
        return null;
    }

    private run(args: readonly string[], projectRoot: string): Promise<unknown> {
        const key = args.join(' ');
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.time < cached.ttl) {
            return Promise.resolve(cached.data);
        }

        // Three tree views and a provider can ask for the same command at once —
        // share a single process instead of spawning one per caller.
        const existing = this.inflight.get(key);
        if (existing) {
            return existing;
        }

        const pending = this.spawn(key, args, projectRoot).finally(() => {
            this.inflight.delete(key);
        });
        this.inflight.set(key, pending);
        return pending;
    }

    private async spawn(key: string, args: readonly string[], projectRoot: string): Promise<unknown> {
        const generation = this.generation;
        try {
            // execFile (not exec) — no shell, so nothing here is subject to shell quoting.
            const { stdout } = await execFileAsync('php', ['bin/console', ...args], {
                cwd: projectRoot,
                timeout: RUN_TIMEOUT_MS,
                encoding: 'utf8',
                maxBuffer: MAX_BUFFER_BYTES,
            });
            const data: unknown = JSON.parse(stdout);
            this.store(key, generation, data, CACHE_TTL_MS);
            return data;
        } catch {
            // Cache the failure as well. Without this, a workspace with no working `php`
            // re-spawns a timeout-bounded process on every single keystroke.
            this.store(key, generation, null, FAILURE_TTL_MS);
            return null;   // degrade gracefully — callers normalise null to {}
        }
    }

    /** Drops the result if `invalidateCache()` ran while this command was still going. */
    private store(key: string, generation: number, data: unknown, ttl: number): void {
        if (generation !== this.generation) {
            return;
        }
        this.cache.set(key, { data, time: Date.now(), ttl });
    }

    /** Services keyed by service ID, with `aliases` merged in — see `toServiceMap`. */
    async getServices(): Promise<ServiceMap> {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        return toServiceMap(await this.run(['debug:container', '--format=json'], root));
    }

    /** Routes keyed by route name. Symfony 6+ returns an array; older versions an object. */
    async getRoutes(): Promise<RouteMap> {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        return toRouteMap(await this.run(['debug:router', '--format=json'], root));
    }

    /** Parameters keyed by name (`debug:container --parameters` wraps them under `parameters`). */
    async getParameters(): Promise<ParameterMap> {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        return toParameterMap(await this.run(['debug:container', '--parameters', '--format=json'], root));
    }

    invalidateCache(): void {
        this.cache.clear();
        this.inflight.clear();
        this.generation += 1;
    }
}

export const symfonyConsole = new SymfonyConsole();
