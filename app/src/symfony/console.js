const { execSync } = require('child_process');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const CACHE_TTL_MS = 30_000;

class SymfonyConsole {
    constructor() {
        /** @type {Map<string, {data: any, time: number}>} */
        this._cache = new Map();
    }

    /** @returns {string|null} */
    getProjectRoot() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return null;
        for (const folder of folders) {
            if (fs.existsSync(path.join(folder.uri.fsPath, 'bin', 'console'))) {
                return folder.uri.fsPath;
            }
        }
        return null;
    }

    /**
     * @param {string} args
     * @param {string} projectRoot
     * @returns {any|null}
     */
    _run(args, projectRoot) {
        const cached = this._cache.get(args);
        if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
            return cached.data;
        }
        try {
            const output = execSync(`php bin/console ${args}`, {
                cwd: projectRoot,
                timeout: 10_000,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            });
            const data = JSON.parse(output);
            this._cache.set(args, { data, time: Date.now() });
            return data;
        } catch {
            return null;
        }
    }

    /**
     * Returns services keyed by service ID.
     * @returns {Record<string, {class?: string, public?: boolean, tags?: Record<string, any[]>}>}
     */
    getServices() {
        const root = this.getProjectRoot();
        if (!root) return {};
        const data = this._run('debug:container --format=json', root);
        return data?.definitions ?? {};
    }

    /**
     * Returns routes keyed by route name.
     * @returns {Record<string, {path?: string, method?: string, controller?: string}>}
     */
    getRoutes() {
        const root = this.getProjectRoot();
        if (!root) return {};
        const data = this._run('debug:router --format=json', root);
        if (!data) return {};
        // Symfony 6+ returns an array; earlier versions return an object
        if (Array.isArray(data)) {
            return Object.fromEntries(data.map(r => [r.name, r]));
        }
        return data;
    }

    /**
     * Returns parameters keyed by parameter name.
     * @returns {Record<string, any>}
     */
    getParameters() {
        const root = this.getProjectRoot();
        if (!root) return {};
        const data = this._run('debug:container --parameters --format=json', root);
        return data?.parameters ?? {};
    }

    invalidateCache() {
        this._cache.clear();
    }
}

module.exports = new SymfonyConsole();
