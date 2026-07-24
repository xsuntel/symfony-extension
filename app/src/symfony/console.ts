import { execSync } from 'child_process';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { ServiceMap, RouteMap, RouteDefinition, ParameterMap } from './types';

const CACHE_TTL_MS = 30_000;
const RUN_TIMEOUT_MS = 10_000;

interface CacheEntry {
    data: unknown;
    time: number;
}

/** Singleton that shells out to Symfony's `bin/console` and caches the JSON output (30s TTL). */
class SymfonyConsole {
    private readonly cache = new Map<string, CacheEntry>();

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

    private run(args: string, projectRoot: string): unknown {
        const cached = this.cache.get(args);
        if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
            return cached.data;
        }
        try {
            const output = execSync(`php bin/console ${args}`, {
                cwd: projectRoot,
                timeout: RUN_TIMEOUT_MS,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            });
            const data: unknown = JSON.parse(output);
            this.cache.set(args, { data, time: Date.now() });
            return data;
        } catch {
            return null;   // degrade gracefully — callers return {} on null
        }
    }

    /** Services keyed by service ID (`debug:container` wraps them under `definitions`). */
    getServices(): ServiceMap {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        const data = this.run('debug:container --format=json', root);
        if (data && typeof data === 'object' && 'definitions' in data) {
            return (data as { definitions?: ServiceMap }).definitions ?? {};
        }
        return {};
    }

    /** Routes keyed by route name. Symfony 6+ returns an array; older versions an object. */
    getRoutes(): RouteMap {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        const data = this.run('debug:router --format=json', root);
        if (!data) {
            return {};
        }
        if (Array.isArray(data)) {
            const routes = data as RouteDefinition[];
            return Object.fromEntries(routes.map((route) => [route.name ?? '', route]));
        }
        return data as RouteMap;
    }

    /** Parameters keyed by name (`debug:container --parameters` wraps them under `parameters`). */
    getParameters(): ParameterMap {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        const data = this.run('debug:container --parameters --format=json', root);
        if (data && typeof data === 'object' && 'parameters' in data) {
            return (data as { parameters?: ParameterMap }).parameters ?? {};
        }
        return {};
    }

    invalidateCache(): void {
        this.cache.clear();
    }
}

export const symfonyConsole = new SymfonyConsole();
