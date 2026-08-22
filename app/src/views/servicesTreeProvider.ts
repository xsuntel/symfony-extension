import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { SymfonyTreeProvider } from './baseTreeProvider';
import type { ServiceDefinition } from '../symfony/types';

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

export class ServicesTreeProvider extends SymfonyTreeProvider<ServiceDefinition> {
    protected readonly noun = 'services';

    protected fetch(): Promise<Record<string, ServiceDefinition>> {
        return symfonyConsole.getServices();
    }

    protected createItem(id: string, def: ServiceDefinition): vscode.TreeItem {
        return new ServiceItem(id, def.class, def.public);
    }
}
