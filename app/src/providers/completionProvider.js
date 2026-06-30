const vscode = require('vscode');
const console = require('../symfony/console');

// PHP patterns that indicate what kind of completion to offer
const SERVICE_PATTERNS = [
    /->(?:get|has)\(\s*['"]([^'"]*$)/,
    /#\[Autowire\(service:\s*['"]([^'"]*$)/,
];

const ROUTE_PATTERNS = [
    /->(?:redirectToRoute|generateUrl|forward)\(\s*['"]([^'"]*$)/,
    /route\(\s*['"]([^'"]*$)/,
];

const PARAM_PATTERNS = [
    /->getParameter\(\s*['"]([^'"]*$)/,
    /#\[Autowire\(value:\s*'%([^%'"]*$)/,
];

// YAML patterns
const YAML_SERVICE_REF_PATTERN = /@([^@\s'"]*)$/;
const YAML_PARAM_REF_PATTERN = /'%([^%'"]*)$|"%([^%"]*$)/;

class SymfonyCompletionProvider {
    /** @param {vscode.TextDocument} document @param {vscode.Position} position */
    provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const isYaml = document.languageId === 'yaml';

        if (isYaml) {
            if (YAML_SERVICE_REF_PATTERN.test(linePrefix)) return this._serviceItems();
            if (YAML_PARAM_REF_PATTERN.test(linePrefix)) return this._parameterItems();
            return [];
        }

        if (SERVICE_PATTERNS.some(p => p.test(linePrefix))) return this._serviceItems();
        if (ROUTE_PATTERNS.some(p => p.test(linePrefix))) return this._routeItems();
        if (PARAM_PATTERNS.some(p => p.test(linePrefix))) return this._parameterItems();
        return [];
    }

    /** @returns {vscode.CompletionItem[]} */
    _serviceItems() {
        const services = console.getServices();
        return Object.entries(services).map(([id, def]) => {
            const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Class);
            item.detail = def.class ?? '';
            item.documentation = new vscode.MarkdownString(
                `**Service ID:** \`${id}\`\n\n**Class:** \`${def.class ?? 'n/a'}\`\n\n**Public:** ${def.public ? 'yes' : 'no'}`
            );
            item.sortText = id;
            return item;
        });
    }

    /** @returns {vscode.CompletionItem[]} */
    _routeItems() {
        const routes = console.getRoutes();
        return Object.entries(routes).map(([name, def]) => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Reference);
            item.detail = def.path ?? '';
            item.documentation = new vscode.MarkdownString(
                `**Route:** \`${name}\`\n\n**Path:** \`${def.path ?? 'n/a'}\`\n\n**Method:** ${def.method ?? 'ANY'}\n\n**Controller:** \`${def.controller ?? 'n/a'}\``
            );
            item.sortText = name;
            return item;
        });
    }

    /** @returns {vscode.CompletionItem[]} */
    _parameterItems() {
        const params = console.getParameters();
        return Object.entries(params).map(([name, value]) => {
            const preview = typeof value === 'object'
                ? JSON.stringify(value).substring(0, 60)
                : String(value).substring(0, 60);
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
            item.detail = preview;
            item.documentation = new vscode.MarkdownString(
                `**Parameter:** \`${name}\`\n\n**Value:** \`${preview}\``
            );
            item.sortText = name;
            return item;
        });
    }
}

module.exports = SymfonyCompletionProvider;
