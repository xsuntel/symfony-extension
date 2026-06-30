const vscode = require('vscode');
const symfonyConsole = require('../symfony/console');

// Capture the token under/around the cursor for each context
const SERVICE_HOVER = /->(?:get|has)\(\s*['"]([^'"]+)['"]/;
const ROUTE_HOVER   = /->(?:redirectToRoute|generateUrl|forward)\(\s*['"]([^'"]+)['"]/;
const PARAM_HOVER   = /->getParameter\(\s*['"]([^'"]+)['"]|%([^%]+)%/;
const YAML_SERVICE  = /@([A-Za-z0-9_.\\]+)/;
const YAML_PARAM    = /%([^%]+)%/;

class SymfonyHoverProvider {
    /** @param {vscode.TextDocument} document @param {vscode.Position} position */
    provideHover(document, position) {
        const line = document.lineAt(position).text;
        const isYaml = document.languageId === 'yaml';

        if (isYaml) {
            const serviceMatch = YAML_SERVICE.exec(line);
            if (serviceMatch) return this._serviceHover(serviceMatch[1]);
            const paramMatch = YAML_PARAM.exec(line);
            if (paramMatch) return this._paramHover(paramMatch[1]);
            return null;
        }

        const serviceMatch = SERVICE_HOVER.exec(line);
        if (serviceMatch) return this._serviceHover(serviceMatch[1]);

        const routeMatch = ROUTE_HOVER.exec(line);
        if (routeMatch) return this._routeHover(routeMatch[1]);

        const paramMatch = PARAM_HOVER.exec(line);
        if (paramMatch) return this._paramHover(paramMatch[1] ?? paramMatch[2]);

        return null;
    }

    /** @param {string} id */
    _serviceHover(id) {
        const services = symfonyConsole.getServices();
        const def = services[id];
        if (!def) return null;

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### Service: \`${id}\`\n\n`);
        md.appendMarkdown(`**Class:** \`${def.class ?? 'n/a'}\`  \n`);
        md.appendMarkdown(`**Public:** ${def.public ? 'yes' : 'no'}  \n`);
        md.appendMarkdown(`**Shared:** ${def.shared ? 'yes' : 'no'}  \n`);
        md.appendMarkdown(`**Autowire:** ${def.autowire ? 'yes' : 'no'}  \n`);

        const tags = Object.keys(def.tags ?? {});
        if (tags.length > 0) {
            md.appendMarkdown(`\n**Tags:** ${tags.map(t => `\`${t}\``).join(', ')}`);
        }
        return new vscode.Hover(md);
    }

    /** @param {string} name */
    _routeHover(name) {
        const routes = symfonyConsole.getRoutes();
        const def = routes[name];
        if (!def) return null;

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

    /** @param {string} name */
    _paramHover(name) {
        const params = symfonyConsole.getParameters();
        if (!(name in params)) return null;

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

module.exports = SymfonyHoverProvider;
