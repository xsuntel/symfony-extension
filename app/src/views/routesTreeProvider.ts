import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { placeholder } from './emptyState';

class RouteItem extends vscode.TreeItem {
    constructor(name: string, routePath?: string, method?: string, controller?: string) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.description = routePath ?? '';
        this.tooltip = new vscode.MarkdownString(
            `**Route:** \`${name}\`\n\n**Path:** \`${routePath ?? 'n/a'}\`\n\n**Method:** ${method ?? 'ANY'}\n\n**Controller:** \`${controller ?? 'n/a'}\``,
        );
        this.contextValue = 'symfonyRoute';
        this.iconPath = new vscode.ThemeIcon('symbol-event');
    }
}

export class RoutesTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
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
        const routes = symfonyConsole.getRoutes();
        const entries = Object.entries(routes);
        if (entries.length === 0) {
            return [placeholder('No routes found (is bin/console available?)')];
        }

        const items = entries
            .filter(([name]) => !this.filter || name.toLowerCase().includes(this.filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, def]) => new RouteItem(name, def.path, def.method, def.controller));
        // Filter matched nothing — show a hint rather than a blank tree.
        if (items.length === 0) {
            return [placeholder(`No routes match "${this.filter}"`)];
        }
        return items;
    }
}
