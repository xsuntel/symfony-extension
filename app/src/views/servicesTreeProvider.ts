import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { placeholder } from './emptyState';

class ServiceItem extends vscode.TreeItem {
    constructor(id: string, className?: string, isPublic?: boolean) {
        super(id, vscode.TreeItemCollapsibleState.None);
        this.description = className ?? '';
        this.tooltip = new vscode.MarkdownString(
            `**Service ID:** \`${id}\`\n\n**Class:** \`${className ?? 'n/a'}\`\n\n**Public:** ${isPublic ? 'yes' : 'no'}`,
        );
        this.contextValue = 'symfonyService';
        this.iconPath = new vscode.ThemeIcon(isPublic ? 'symbol-class' : 'symbol-interface');
    }
}

export class ServicesTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
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
        const services = symfonyConsole.getServices();
        const entries = Object.entries(services);
        if (entries.length === 0) {
            return [placeholder('No services found (is bin/console available?)')];
        }

        const items = entries
            .filter(([id]) => !this.filter || id.toLowerCase().includes(this.filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, def]) => new ServiceItem(id, def.class, def.public));
        // Filter matched nothing — show a hint rather than a blank tree.
        if (items.length === 0) {
            return [placeholder(`No services match "${this.filter}"`)];
        }
        return items;
    }
}
