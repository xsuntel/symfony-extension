import * as vscode from 'vscode';
import { SymfonyCompletionProvider } from './providers/completionProvider';
import { SymfonyHoverProvider } from './providers/hoverProvider';
import { SymfonyDefinitionProvider } from './providers/definitionProvider';
import { symfonyConsole } from './symfony/console';
import { ServicesTreeProvider } from './views/servicesTreeProvider';
import { RoutesTreeProvider } from './views/routesTreeProvider';
import { ParametersTreeProvider } from './views/parametersTreeProvider';
import type { FilterableTree } from './views/baseTreeProvider';

// Shared language selector — reuse this constant, do not inline the array.
const PHP_YAML: vscode.DocumentSelector = [{ language: 'php' }, { language: 'yaml' }];

// How long the refresh confirmation stays in the status bar.
const STATUS_MESSAGE_MS = 3_000;

export function activate(context: vscode.ExtensionContext): void {
    const servicesTree = new ServicesTreeProvider();
    const routesTree = new RoutesTreeProvider();
    const parametersTree = new ParametersTreeProvider();

    // Refresh/filter act on all three views together — group them once.
    const trees: readonly FilterableTree[] = [servicesTree, routesTree, parametersTree];

    // --- Tree views ---
    // Both halves need disposing: the TreeView itself, and the provider that owns the
    // EventEmitter behind onDidChangeTreeData.
    context.subscriptions.push(
        vscode.window.createTreeView('symfony.services', { treeDataProvider: servicesTree, showCollapseAll: false }),
        vscode.window.createTreeView('symfony.routes', { treeDataProvider: routesTree, showCollapseAll: false }),
        vscode.window.createTreeView('symfony.parameters', { treeDataProvider: parametersTree, showCollapseAll: false }),
        ...trees,
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
            // Status bar rather than a modal-ish toast — this fires from a toolbar button.
            vscode.window.setStatusBarMessage('Symfony: cache refreshed.', STATUS_MESSAGE_MS);
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

export function deactivate(): void {
    // The singleton outlives activate(); drop any cached bin/console output with it.
    symfonyConsole.invalidateCache();
}
