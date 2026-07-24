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
exports.ParametersTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const console_1 = require("../symfony/console");
const emptyState_1 = require("./emptyState");
class ParameterItem extends vscode.TreeItem {
    constructor(name, value) {
        super(name, vscode.TreeItemCollapsibleState.None);
        const preview = typeof value === 'object'
            ? JSON.stringify(value).substring(0, 80)
            : String(value).substring(0, 80);
        this.description = preview;
        this.tooltip = new vscode.MarkdownString(typeof value === 'object'
            ? `**Parameter:** \`${name}\`\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
            : `**Parameter:** \`${name}\`\n\n**Value:** \`${String(value)}\``);
        this.contextValue = 'symfonyParameter';
        this.iconPath = new vscode.ThemeIcon('symbol-variable');
    }
}
class ParametersTreeProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    filter = '';
    refresh() {
        console_1.symfonyConsole.invalidateCache();
        this._onDidChangeTreeData.fire();
    }
    setFilter(text) {
        this.filter = text.toLowerCase();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        const params = console_1.symfonyConsole.getParameters();
        const entries = Object.entries(params);
        if (entries.length === 0) {
            return [(0, emptyState_1.placeholder)('No parameters found (is bin/console available?)')];
        }
        const items = entries
            .filter(([name]) => !this.filter || name.toLowerCase().includes(this.filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, value]) => new ParameterItem(name, value));
        // Filter matched nothing — show a hint rather than a blank tree.
        if (items.length === 0) {
            return [(0, emptyState_1.placeholder)(`No parameters match "${this.filter}"`)];
        }
        return items;
    }
}
exports.ParametersTreeProvider = ParametersTreeProvider;
//# sourceMappingURL=parametersTreeProvider.js.map