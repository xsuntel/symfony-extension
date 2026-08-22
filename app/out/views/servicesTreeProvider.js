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
exports.ServicesTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const console_1 = require("../symfony/console");
const baseTreeProvider_1 = require("./baseTreeProvider");
class ServiceItem extends vscode.TreeItem {
    constructor(id, className, isPublic) {
        super(id, vscode.TreeItemCollapsibleState.None);
        this.description = className ?? '';
        this.tooltip = new vscode.MarkdownString(`**Service ID:** \`${id}\`\n\n**Class:** \`${className ?? 'n/a'}\`\n\n**Public:** ${isPublic ? 'yes' : 'no'}`);
        this.contextValue = 'symfonyService';
        this.iconPath = new vscode.ThemeIcon(isPublic ? 'symbol-class' : 'symbol-interface');
    }
}
class ServicesTreeProvider extends baseTreeProvider_1.SymfonyTreeProvider {
    noun = 'services';
    fetch() {
        return console_1.symfonyConsole.getServices();
    }
    createItem(id, def) {
        return new ServiceItem(id, def.class, def.public);
    }
}
exports.ServicesTreeProvider = ServicesTreeProvider;
//# sourceMappingURL=servicesTreeProvider.js.map