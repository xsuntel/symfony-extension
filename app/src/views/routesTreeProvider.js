const vscode = require('vscode');
const symfonyConsole = require('../symfony/console');

class RouteItem extends vscode.TreeItem {
    /**
     * @param {string} name
     * @param {string} [routePath]
     * @param {string} [method]
     * @param {string} [controller]
     */
    constructor(name, routePath, method, controller) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.description = routePath ?? '';
        this.tooltip = new vscode.MarkdownString(
            `**Route:** \`${name}\`\n\n**Path:** \`${routePath ?? 'n/a'}\`\n\n**Method:** ${method ?? 'ANY'}\n\n**Controller:** \`${controller ?? 'n/a'}\``
        );
        this.contextValue = 'symfonyRoute';
        this.iconPath = new vscode.ThemeIcon('symbol-event');
        this.routeName = name;
    }
}

class RoutesTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._filter = '';
    }

    refresh() {
        symfonyConsole.invalidateCache();
        this._onDidChangeTreeData.fire();
    }

    /** @param {string} text */
    setFilter(text) {
        this._filter = text.toLowerCase();
        this._onDidChangeTreeData.fire();
    }

    /** @param {RouteItem} element */
    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const routes = symfonyConsole.getRoutes();
        const entries = Object.entries(routes);
        if (entries.length === 0) {
            const empty = new vscode.TreeItem('No routes found (is bin/console available?)');
            empty.iconPath = new vscode.ThemeIcon('warning');
            return [empty];
        }

        return entries
            .filter(([name]) => !this._filter || name.toLowerCase().includes(this._filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, def]) => new RouteItem(name, def.path, def.method, def.controller));
    }
}

module.exports = RoutesTreeProvider;
