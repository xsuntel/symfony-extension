"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const completionProvider_1 = require("./providers/completionProvider");
const hoverProvider_1 = require("./providers/hoverProvider");
const definitionProvider_1 = require("./providers/definitionProvider");
const servicesTreeProvider_1 = require("./views/servicesTreeProvider");
const routesTreeProvider_1 = require("./views/routesTreeProvider");
const parametersTreeProvider_1 = require("./views/parametersTreeProvider");
// Shared language selector — reuse this constant, do not inline the array.
const PHP_YAML = [{ language: 'php' }, { language: 'yaml' }];
function activate(context) {
    const servicesTree = new servicesTreeProvider_1.ServicesTreeProvider();
    const routesTree = new routesTreeProvider_1.RoutesTreeProvider();
    const parametersTree = new parametersTreeProvider_1.ParametersTreeProvider();
    // Refresh/filter act on all three views together — group them once.
    const trees = [servicesTree, routesTree, parametersTree];
    // --- Tree views ---
    // createTreeView returns a TreeView disposable; push it so VSCode disposes the view on deactivation.
    context.subscriptions.push(vscode.window.createTreeView('symfony.services', { treeDataProvider: servicesTree, showCollapseAll: false }), vscode.window.createTreeView('symfony.routes', { treeDataProvider: routesTree, showCollapseAll: false }), vscode.window.createTreeView('symfony.parameters', { treeDataProvider: parametersTree, showCollapseAll: false }));
    // --- Language providers ---
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(PHP_YAML, new completionProvider_1.SymfonyCompletionProvider(), "'", '"', '@', '%'), vscode.languages.registerHoverProvider(PHP_YAML, new hoverProvider_1.SymfonyHoverProvider()), vscode.languages.registerDefinitionProvider(PHP_YAML, new definitionProvider_1.SymfonyDefinitionProvider()));
    // --- Refresh / filter commands (toolbar buttons on all three views) ---
    context.subscriptions.push(vscode.commands.registerCommand('symfony.refresh', () => {
        trees.forEach((tree) => tree.refresh());
        void vscode.window.showInformationMessage('Symfony: cache refreshed.');
    }), vscode.commands.registerCommand('symfony.filter', async () => {
        const text = await vscode.window.showInputBox({
            prompt: 'Filter Symfony items by ID / name',
            placeHolder: 'e.g. mailer',
        });
        // Undefined = user cancelled; leave the current filter untouched.
        if (text === undefined) {
            return;
        }
        trees.forEach((tree) => tree.setFilter(text));
    }), vscode.commands.registerCommand('symfony.clearFilter', () => {
        trees.forEach((tree) => tree.setFilter(''));
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map