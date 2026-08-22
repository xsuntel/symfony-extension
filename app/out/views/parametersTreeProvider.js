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
const baseTreeProvider_1 = require("./baseTreeProvider");
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
class ParametersTreeProvider extends baseTreeProvider_1.SymfonyTreeProvider {
    noun = 'parameters';
    fetch() {
        return console_1.symfonyConsole.getParameters();
    }
    createItem(name, value) {
        return new ParameterItem(name, value);
    }
}
exports.ParametersTreeProvider = ParametersTreeProvider;
//# sourceMappingURL=parametersTreeProvider.js.map