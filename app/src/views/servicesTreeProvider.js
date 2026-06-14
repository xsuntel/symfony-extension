const vscode = require('vscode');
const symfonyConsole = require('../symfony/console');

class ServiceItem extends vscode.TreeItem {
    /**
     * @param {string} id
     * @param {string} [className]
     * @param {boolean} [isPublic]
     */
    constructor(id, className, isPublic) {
        super(id, vscode.TreeItemCollapsibleState.None);
        this.description = className ?? '';
        this.tooltip = new vscode.MarkdownString(
            `**Service ID:** \`${id}\`\n\n**Class:** \`${className ?? 'n/a'}\`\n\n**Public:** ${isPublic ? 'yes' : 'no'}`
        );
        this.contextValue = 'symfonyService';
        this.iconPath = new vscode.ThemeIcon(isPublic ? 'symbol-class' : 'symbol-interface');
        this.serviceId = id;
        this.className = className;
    }
}

class ServicesTreeProvider {
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

    /** @param {ServiceItem} element */
    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const services = symfonyConsole.getServices();
        const entries = Object.entries(services);
        if (entries.length === 0) {
            const empty = new vscode.TreeItem('No services found (is bin/console available?)');
            empty.iconPath = new vscode.ThemeIcon('warning');
            return [empty];
        }

        return entries
            .filter(([id]) => !this._filter || id.toLowerCase().includes(this._filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, def]) => new ServiceItem(id, def.class, def.public));
    }
}

module.exports = ServicesTreeProvider;
