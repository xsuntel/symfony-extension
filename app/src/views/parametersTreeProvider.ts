import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { placeholder } from './emptyState';

class ParameterItem extends vscode.TreeItem {
    constructor(name: string, value: unknown) {
        super(name, vscode.TreeItemCollapsibleState.None);
        const preview = typeof value === 'object'
            ? JSON.stringify(value).substring(0, 80)
            : String(value).substring(0, 80);
        this.description = preview;
        this.tooltip = new vscode.MarkdownString(
            typeof value === 'object'
                ? `**Parameter:** \`${name}\`\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
                : `**Parameter:** \`${name}\`\n\n**Value:** \`${String(value)}\``,
        );
        this.contextValue = 'symfonyParameter';
        this.iconPath = new vscode.ThemeIcon('symbol-variable');
    }
}

export class ParametersTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private filter = '';

    refresh(): void {
        symfonyConsole.invalidateCache();
        this._onDidChangeTreeData.fire();
    }

    setFilter(text: string): void {
        this.filter = text.toLowerCase();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): vscode.TreeItem[] {
        const params = symfonyConsole.getParameters();
        const entries = Object.entries(params);
        if (entries.length === 0) {
            return [placeholder('No parameters found (is bin/console available?)')];
        }

        const items = entries
            .filter(([name]) => !this.filter || name.toLowerCase().includes(this.filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, value]) => new ParameterItem(name, value));
        // Filter matched nothing — show a hint rather than a blank tree.
        if (items.length === 0) {
            return [placeholder(`No parameters match "${this.filter}"`)];
        }
        return items;
    }
}
