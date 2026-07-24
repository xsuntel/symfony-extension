import * as vscode from 'vscode';
import { SymfonyCompletionProvider } from './providers/completionProvider';
import { SymfonyHoverProvider } from './providers/hoverProvider';
import { SymfonyDefinitionProvider } from './providers/definitionProvider';
import { ServicesTreeProvider } from './views/servicesTreeProvider';
import { RoutesTreeProvider } from './views/routesTreeProvider';
import { ParametersTreeProvider } from './views/parametersTreeProvider';

// Shared language selector — reuse this constant, do not inline the array.
const PHP_YAML: vscode.DocumentSelector = [{ language: 'php' }, { language: 'yaml' }];

export function activate(context: vscode.ExtensionContext): void {
    const servicesTree = new ServicesTreeProvider();
    const routesTree = new RoutesTreeProvider();
    const parametersTree = new ParametersTreeProvider();

    // Refresh/filter act on all three views together — group them once.
    const trees = [servicesTree, routesTree, parametersTree];

    // --- Tree views ---
    // createTreeView returns a TreeView disposable; push it so VSCode disposes the view on deactivation.
    context.subscriptions.push(
        vscode.window.createTreeView('symfony.services', { treeDataProvider: servicesTree, showCollapseAll: false }),
        vscode.window.createTreeView('symfony.routes', { treeDataProvider: routesTree, showCollapseAll: false }),
        vscode.window.createTreeView('symfony.parameters', { treeDataProvider: parametersTree, showCollapseAll: false }),
    );

    // --- Language providers ---
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(PHP_YAML, new SymfonyCompletionProvider(), "'", '"', '@', '%'),
        vscode.languages.registerHoverProvider(PHP_YAML, new SymfonyHoverProvider()),
        vscode.languages.registerDefinitionProvider(PHP_YAML, new SymfonyDefinitionProvider()),
    );

    // --- Refresh / filter commands (toolbar buttons on all three views) ---
    context.subscriptions.push(
        vscode.commands.registerCommand('symfony.refresh', () => {
            trees.forEach((tree) => tree.refresh());
            void vscode.window.showInformationMessage('Symfony: cache refreshed.');
        }),
        vscode.commands.registerCommand('symfony.filter', async () => {
            const text = await vscode.window.showInputBox({
                prompt: 'Filter Symfony items by ID / name',
                placeHolder: 'e.g. mailer',
            });
            // Undefined = user cancelled; leave the current filter untouched.
            if (text === undefined) {
                return;
            }
            trees.forEach((tree) => tree.setFilter(text));
        }),
        vscode.commands.registerCommand('symfony.clearFilter', () => {
            trees.forEach((tree) => tree.setFilter(''));
        }),
    );
}

export function deactivate(): void {}
