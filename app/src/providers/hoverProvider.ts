import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { tokenAt } from './cursorToken';

// Capture the token under/around the cursor for each context.
const SERVICE_HOVER = /->(?:get|has)\(\s*['"]([^'"]+)['"]/;
const ROUTE_HOVER = /->(?:redirectToRoute|generateUrl|forward)\(\s*['"]([^'"]+)['"]/;
const PARAM_HOVER = /->getParameter\(\s*['"]([^'"]+)['"]|%([^%]+)%/;
const YAML_SERVICE = /@([A-Za-z0-9_.\\]+)/;
const YAML_PARAM = /%([^%]+)%/;

export class SymfonyHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.ProviderResult<vscode.Hover> {
        const isYaml = document.languageId === 'yaml';

        // Match the token *under the cursor* (getWordRangeAtPosition), not the line's first match.
        if (isYaml) {
            const service = tokenAt(document, position, YAML_SERVICE);
            if (service) {
                return this.serviceHover(service);
            }
            const param = tokenAt(document, position, YAML_PARAM);
            if (param) {
                return this.paramHover(param);
            }
            return null;
        }

        const service = tokenAt(document, position, SERVICE_HOVER);
        if (service) {
            return this.serviceHover(service);
        }
        const route = tokenAt(document, position, ROUTE_HOVER);
        if (route) {
            return this.routeHover(route);
        }
        const param = tokenAt(document, position, PARAM_HOVER);
        if (param) {
            return this.paramHover(param);
        }
        return null;
    }

    private serviceHover(id: string): vscode.Hover | null {
        const def = symfonyConsole.getServices()[id];
        if (!def) {
            return null;
        }

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### Service: \`${id}\`\n\n`);
        md.appendMarkdown(`**Class:** \`${def.class ?? 'n/a'}\`  \n`);
        md.appendMarkdown(`**Public:** ${def.public ? 'yes' : 'no'}  \n`);
        md.appendMarkdown(`**Shared:** ${def.shared ? 'yes' : 'no'}  \n`);
        md.appendMarkdown(`**Autowire:** ${def.autowire ? 'yes' : 'no'}  \n`);

        const tags = Object.keys(def.tags ?? {});
        if (tags.length > 0) {
            md.appendMarkdown(`\n**Tags:** ${tags.map((tag) => `\`${tag}\``).join(', ')}`);
        }
        return new vscode.Hover(md);
    }

    private routeHover(name: string): vscode.Hover | null {
        const def = symfonyConsole.getRoutes()[name];
        if (!def) {
            return null;
        }

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### Route: \`${name}\`\n\n`);
        md.appendMarkdown(`**Path:** \`${def.path ?? 'n/a'}\`  \n`);
        md.appendMarkdown(`**Method:** ${def.method ?? 'ANY'}  \n`);
        md.appendMarkdown(`**Controller:** \`${def.controller ?? 'n/a'}\`  \n`);
        if (def.host && def.host !== 'ANY') {
            md.appendMarkdown(`**Host:** \`${def.host}\`  \n`);
        }
        return new vscode.Hover(md);
    }

    private paramHover(name: string): vscode.Hover | null {
        const params = symfonyConsole.getParameters();
        if (!(name in params)) {
            return null;
        }

        const value = params[name];
        const display = typeof value === 'object'
            ? '```json\n' + JSON.stringify(value, null, 2) + '\n```'
            : `\`${String(value)}\``;

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### Parameter: \`${name}\`\n\n`);
        md.appendMarkdown(`**Value:** ${display}`);
        return new vscode.Hover(md);
    }
}
