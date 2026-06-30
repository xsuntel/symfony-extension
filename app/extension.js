const vscode = require('vscode');
const SymfonyCompletionProvider  = require('./src/providers/completionProvider');
const SymfonyHoverProvider       = require('./src/providers/hoverProvider');
const SymfonyDefinitionProvider  = require('./src/providers/definitionProvider');
const ServicesTreeProvider       = require('./src/views/servicesTreeProvider');
const RoutesTreeProvider         = require('./src/views/routesTreeProvider');
const ParametersTreeProvider     = require('./src/views/parametersTreeProvider');

const PHP_YAML = [{ language: 'php' }, { language: 'yaml' }];

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    const servicesTree   = new ServicesTreeProvider();
    const routesTree     = new RoutesTreeProvider();
    const parametersTree = new ParametersTreeProvider();

    // --- Tree views ---
    vscode.window.createTreeView('symfony.services',   { treeDataProvider: servicesTree,   showCollapseAll: false });
    vscode.window.createTreeView('symfony.routes',     { treeDataProvider: routesTree,     showCollapseAll: false });
    vscode.window.createTreeView('symfony.parameters', { treeDataProvider: parametersTree, showCollapseAll: false });

    // --- Language providers ---
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            PHP_YAML,
            new SymfonyCompletionProvider(),
            "'", '"', '@', '%'
        ),
        vscode.languages.registerHoverProvider(PHP_YAML, new SymfonyHoverProvider()),
        vscode.languages.registerDefinitionProvider(PHP_YAML, new SymfonyDefinitionProvider()),
    );

    // --- Refresh command (toolbar button on all three views) ---
    context.subscriptions.push(
        vscode.commands.registerCommand('symfony.refresh', () => {
            servicesTree.refresh();
            routesTree.refresh();
            parametersTree.refresh();
            vscode.window.showInformationMessage('Symfony: cache refreshed.');
        })
    );
}

function deactivate() {}

module.exports = { activate, deactivate };
