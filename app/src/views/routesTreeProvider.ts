import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { SymfonyTreeProvider } from './baseTreeProvider';
import type { RouteDefinition } from '../symfony/types';

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

export class RoutesTreeProvider extends SymfonyTreeProvider<RouteDefinition> {
    protected readonly noun = 'routes';

    protected fetch(): Promise<Record<string, RouteDefinition>> {
        return symfonyConsole.getRoutes();
    }

    protected createItem(name: string, def: RouteDefinition): vscode.TreeItem {
        return new RouteItem(name, def.path, def.method, def.controller);
    }
}
