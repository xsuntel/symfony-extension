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
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const CACHE_TTL_MS = 30_000;
const RUN_TIMEOUT_MS = 10_000;
/** Singleton that shells out to Symfony's `bin/console` and caches the JSON output (30s TTL). */
class SymfonyConsole {
    cache = new Map();
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
        const cached = this.cache.get(args);
        if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
            return cached.data;
        }
        try {
            const output = (0, child_process_1.execSync)(`php bin/console ${args}`, {
                cwd: projectRoot,
                timeout: RUN_TIMEOUT_MS,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            });
            const data = JSON.parse(output);
            this.cache.set(args, { data, time: Date.now() });
            return data;
        }
        catch {
            return null; // degrade gracefully — callers return {} on null
        }
    }
    /** Services keyed by service ID (`debug:container` wraps them under `definitions`). */
    getServices() {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        const data = this.run('debug:container --format=json', root);
        if (data && typeof data === 'object' && 'definitions' in data) {
            return data.definitions ?? {};
        }
        return {};
    }
    /** Routes keyed by route name. Symfony 6+ returns an array; older versions an object. */
    getRoutes() {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        const data = this.run('debug:router --format=json', root);
        if (!data) {
            return {};
        }
        if (Array.isArray(data)) {
            const routes = data;
            return Object.fromEntries(routes.map((route) => [route.name ?? '', route]));
        }
        return data;
    }
    /** Parameters keyed by name (`debug:container --parameters` wraps them under `parameters`). */
    getParameters() {
        const root = this.getProjectRoot();
        if (!root) {
            return {};
        }
        const data = this.run('debug:container --parameters --format=json', root);
        if (data && typeof data === 'object' && 'parameters' in data) {
            return data.parameters ?? {};
        }
        return {};
    }
    invalidateCache() {
        this.cache.clear();
    }
}
exports.symfonyConsole = new SymfonyConsole();
//# sourceMappingURL=console.js.map