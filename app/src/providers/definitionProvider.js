const vscode = require('vscode');
const symfonyConsole = require('../symfony/console');

const SERVICE_PATTERN = /->(?:get|has)\(\s*['"]([^'"]+)['"]/;
const YAML_SERVICE_PATTERN = /@([A-Za-z0-9_.\\]+)/;

class SymfonyDefinitionProvider {
    /** @param {vscode.TextDocument} document @param {vscode.Position} position */
    async provideDefinition(document, position) {
        const line = document.lineAt(position).text;
        const isYaml = document.languageId === 'yaml';

        const pattern = isYaml ? YAML_SERVICE_PATTERN : SERVICE_PATTERN;
        const match = pattern.exec(line);
        if (!match) return null;

        const serviceId = match[1];
        const services = symfonyConsole.getServices();
        const def = services[serviceId];
        if (!def?.class) return null;

        const uri = await this._findClassFile(def.class);
        if (!uri) return null;

        return new vscode.Location(uri, new vscode.Position(0, 0));
    }

    /**
     * Converts a PHP FQCN to a file URI by searching the workspace.
     * App\Service\MyService → **/Service/MyService.php
     * @param {string} fqcn
     * @returns {Promise<vscode.Uri|null>}
     */
    async _findClassFile(fqcn) {
        // Build a glob from the last two namespace segments to keep the search tight
        const parts = fqcn.replace(/\\/g, '/').split('/');
        const className = parts.at(-1);
        if (!className) return null;

        const pattern = `**/${className}.php`;
        const files = await vscode.workspace.findFiles(pattern, '**/vendor/**', 5);
        if (files.length === 0) return null;

        // If multiple hits, prefer one whose path contains the namespace segments
        if (files.length === 1) return files[0];
        const namespacePath = parts.slice(-2).join('/');
        const best = files.find(f => f.fsPath.replace(/\\/g, '/').includes(namespacePath));
        return best ?? files[0];
    }
}

module.exports = SymfonyDefinitionProvider;
