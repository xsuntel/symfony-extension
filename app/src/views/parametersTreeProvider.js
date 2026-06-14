const vscode = require('vscode');
const symfonyConsole = require('../symfony/console');

class ParameterItem extends vscode.TreeItem {
    /**
     * @param {string} name
     * @param {any} value
     */
    constructor(name, value) {
        super(name, vscode.TreeItemCollapsibleState.None);
        const preview = typeof value === 'object'
            ? JSON.stringify(value).substring(0, 80)
            : String(value).substring(0, 80);
        this.description = preview;
        this.tooltip = new vscode.MarkdownString(
            typeof value === 'object'
                ? `**Parameter:** \`${name}\`\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
                : `**Parameter:** \`${name}\`\n\n**Value:** \`${String(value)}\``
        );
        this.contextValue = 'symfonyParameter';
        this.iconPath = new vscode.ThemeIcon('symbol-variable');
        this.paramName = name;
    }
}

class ParametersTreeProvider {
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

    /** @param {ParameterItem} element */
    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const params = symfonyConsole.getParameters();
        const entries = Object.entries(params);
        if (entries.length === 0) {
            const empty = new vscode.TreeItem('No parameters found (is bin/console available?)');
            empty.iconPath = new vscode.ThemeIcon('warning');
            return [empty];
        }

        return entries
            .filter(([name]) => !this._filter || name.toLowerCase().includes(this._filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, value]) => new ParameterItem(name, value));
    }
}

module.exports = ParametersTreeProvider;
