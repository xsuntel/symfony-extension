import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { SymfonyTreeProvider } from './baseTreeProvider';

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

export class ParametersTreeProvider extends SymfonyTreeProvider<unknown> {
    protected readonly noun = 'parameters';

    protected fetch(): Promise<Record<string, unknown>> {
        return symfonyConsole.getParameters();
    }

    protected createItem(name: string, value: unknown): vscode.TreeItem {
        return new ParameterItem(name, value);
    }
}
