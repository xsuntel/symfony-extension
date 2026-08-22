import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';

// PHP patterns that indicate what kind of completion to offer.
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

// YAML patterns.
const YAML_SERVICE_REF_PATTERN = /@([^@\s'"]*)$/;
const YAML_PARAM_REF_PATTERN = /['"]%([^%'"]*)$/;

/**
 * Carries the markdown factory instead of the rendered markdown, so a container with
 * thousands of services does not allocate thousands of MarkdownStrings per keystroke.
 * VSCode calls `resolveCompletionItem` only for the entry the user actually highlights.
 */
class SymfonyCompletionItem extends vscode.CompletionItem {
    constructor(
        label: string,
        kind: vscode.CompletionItemKind,
        readonly describe: () => string,
    ) {
        super(label, kind);
    }
}

export class SymfonyCompletionProvider implements vscode.CompletionItemProvider {
    /**
     * Pattern matching runs first and synchronously, so a line that triggers nothing
     * returns without ever touching the (process-spawning) data layer.
     */
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const isYaml = document.languageId === 'yaml';

        if (isYaml) {
            if (YAML_SERVICE_REF_PATTERN.test(linePrefix)) {
                return this.serviceItems();
            }
            if (YAML_PARAM_REF_PATTERN.test(linePrefix)) {
                return this.parameterItems();
            }
            return [];
        }

        if (SERVICE_PATTERNS.some((pattern) => pattern.test(linePrefix))) {
            return this.serviceItems();
        }
        if (ROUTE_PATTERNS.some((pattern) => pattern.test(linePrefix))) {
            return this.routeItems();
        }
        if (PARAM_PATTERNS.some((pattern) => pattern.test(linePrefix))) {
            return this.parameterItems();
        }
        return [];
    }

    resolveCompletionItem(item: vscode.CompletionItem): vscode.CompletionItem {
        if (item instanceof SymfonyCompletionItem) {
            item.documentation = new vscode.MarkdownString(item.describe());
        }
        return item;
    }

    private async serviceItems(): Promise<vscode.CompletionItem[]> {
        const services = await symfonyConsole.getServices();
        return Object.entries(services).map(([id, def]) => {
            const item = new SymfonyCompletionItem(
                id,
                vscode.CompletionItemKind.Class,
                () => `**Service ID:** \`${id}\`\n\n**Class:** \`${def.class ?? 'n/a'}\`\n\n**Public:** ${def.public ? 'yes' : 'no'}`,
            );
            item.detail = def.class ?? '';
            item.sortText = id;
            return item;
        });
    }

    private async routeItems(): Promise<vscode.CompletionItem[]> {
        const routes = await symfonyConsole.getRoutes();
        return Object.entries(routes).map(([name, def]) => {
            const item = new SymfonyCompletionItem(
                name,
                vscode.CompletionItemKind.Reference,
                () => `**Route:** \`${name}\`\n\n**Path:** \`${def.path ?? 'n/a'}\`\n\n**Method:** ${def.method ?? 'ANY'}\n\n**Controller:** \`${def.controller ?? 'n/a'}\``,
            );
            item.detail = def.path ?? '';
            item.sortText = name;
            return item;
        });
    }

    private async parameterItems(): Promise<vscode.CompletionItem[]> {
        const params = await symfonyConsole.getParameters();
        return Object.entries(params).map(([name, value]) => {
            const preview = typeof value === 'object'
                ? JSON.stringify(value).substring(0, 60)
                : String(value).substring(0, 60);
            const item = new SymfonyCompletionItem(
                name,
                vscode.CompletionItemKind.Variable,
                () => `**Parameter:** \`${name}\`\n\n**Value:** \`${preview}\``,
            );
            item.detail = preview;
            item.sortText = name;
            return item;
        });
    }
}
