"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.symfonyConsole = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const types_1 = require("./types");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const CACHE_TTL_MS = 30_000;
// Failures expire sooner than successes so a project that starts working again
// recovers on its own, without the user having to hit Refresh.
const FAILURE_TTL_MS = 5_000;
const RUN_TIMEOUT_MS = 10_000;
// `debug:container` output on a large application exceeds Node's 1 MB default,
// which would otherwise surface as an ENOBUFS failure and an empty tree.
const MAX_BUFFER_BYTES = 16 * 1024 * 1024;
/**
 * Singleton that shells out to Symfony's `bin/console` and caches the JSON output.
 *
 * Every call is asynchronous: the extension host is single-threaded, so a synchronous
 * spawn here would stall every other extension for the duration of the PHP run.
 */
class SymfonyConsole {
    cache = new Map();
    inflight = new Map();
    generation = 0;
    getProjectRoot() {
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
    run(args, projectRoot) {
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
    async spawn(key, args, projectRoot) {
        const generation = this.generation;
        try {
            // execFile (not exec) — no shell, so nothing here is subject to shell quoting.
            const { stdout } = await execFileAsync('php', ['bin/console', ...args], {
                cwd: projectRoot,
                timeout: RUN_TIMEOUT_MS,
                encoding: 'utf8',
                maxBuffer: MAX_BUFFER_BYTES,
            });
            const data = JSON.parse(stdout);
            this.store(key, generation, data, CACHE_TTL_MS);
            return data;
        }
        catch {
            // Cache the failure as well. Without this, a workspace with no working `php`
            // re-spawns a timeout-bounded process on every single keystroke.
            this.store(key, generation, null, FAILURE_TTL_MS);
            return null; // degrade gracefully — callers normalise null to {}
        }
    }
    /** Drops the result if `invalidateCache()` ran while this command was still going. */
    store(key, generation, data, ttl) {
        if (generation !== this.generation) {
            return;
        }
        this.cache.set(key, { data, time: Date.now(), ttl });
    }
    /** Services keyed by service ID, with `aliases` merged in — see `toServiceMap`. */
    async getServices() {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        return (0, types_1.toServiceMap)(await this.run(['debug:container', '--format=json'], root));
    }
    /** Routes keyed by route name. Symfony 6+ returns an array; older versions an object. */
    async getRoutes() {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        return (0, types_1.toRouteMap)(await this.run(['debug:router', '--format=json'], root));
    }
    /** Parameters keyed by name (`debug:container --parameters` wraps them under `parameters`). */
    async getParameters() {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        return (0, types_1.toParameterMap)(await this.run(['debug:container', '--parameters', '--format=json'], root));
    }
    invalidateCache() {
        this.cache.clear();
        this.inflight.clear();
        this.generation += 1;
    }
}
exports.symfonyConsole = new SymfonyConsole();
//# sourceMappingURL=console.js.map