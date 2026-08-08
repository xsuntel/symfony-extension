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
exports.SymfonyCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const console_1 = require("../symfony/console");
// PHP patterns that indicate what kind of completion to offer.
const SERVICE_PATTERNS = [
    /->(?:get|has)\(\s*['"]([^'"]*$)/,
    /#\[Autowire\(service:\s*['"]([^'"]*$)/,
];
const ROUTE_PATTERNS = [
    /->(?:redirectToRoute|generateUrl|forward)\(\s*['"]([^'"]*$)/,
    /route\(\s*['"]([^'"]*$)/,
];
const PARAM_PATTERNS = [
    /->getParameter\(\s*['"]([^'"]*$)/,
    /#\[Autowire\(value:\s*'%([^%'"]*$)/,
];
// YAML patterns.
const YAML_SERVICE_REF_PATTERN = /@([^@\s'"]*)$/;
const YAML_PARAM_REF_PATTERN = /'%([^%'"]*)$|"%([^%"]*$)/;
class SymfonyCompletionProvider {
    provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const isYaml = document.languageId === 'yaml';
        if (isYaml) {
            if (YAML_SERVICE_REF_PATTERN.test(linePrefix)) {
                return this.serviceItems();
            }
            if (YAML_PARAM_REF_PATTERN.test(linePrefix)) {
                return this.parameterItems();
            }
            return [];
        }
        if (SERVICE_PATTERNS.some((pattern) => pattern.test(linePrefix))) {
            return this.serviceItems();
        }
        if (ROUTE_PATTERNS.some((pattern) => pattern.test(linePrefix))) {
            return this.routeItems();
        }
        if (PARAM_PATTERNS.some((pattern) => pattern.test(linePrefix))) {
            return this.parameterItems();
        }
        return [];
    }
    serviceItems() {
        const services = console_1.symfonyConsole.getServices();
        return Object.entries(services).map(([id, def]) => {
            const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Class);
            item.detail = def.class ?? '';
            item.documentation = new vscode.MarkdownString(`**Service ID:** \`${id}\`\n\n**Class:** \`${def.class ?? 'n/a'}\`\n\n**Public:** ${def.public ? 'yes' : 'no'}`);
            item.sortText = id;
            return item;
        });
    }
    routeItems() {
        const routes = console_1.symfonyConsole.getRoutes();
        return Object.entries(routes).map(([name, def]) => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Reference);
            item.detail = def.path ?? '';
            item.documentation = new vscode.MarkdownString(`**Route:** \`${name}\`\n\n**Path:** \`${def.path ?? 'n/a'}\`\n\n**Method:** ${def.method ?? 'ANY'}\n\n**Controller:** \`${def.controller ?? 'n/a'}\``);
            item.sortText = name;
            return item;
        });
    }
    parameterItems() {
        const params = console_1.symfonyConsole.getParameters();
        return Object.entries(params).map(([name, value]) => {
            const preview = typeof value === 'object'
                ? JSON.stringify(value).substring(0, 60)
                : String(value).substring(0, 60);
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
            item.detail = preview;
            item.documentation = new vscode.MarkdownString(`**Parameter:** \`${name}\`\n\n**Value:** \`${preview}\``);
            item.sortText = name;
            return item;
        });
    }
}
exports.SymfonyCompletionProvider = SymfonyCompletionProvider;
//# sourceMappingURL=completionProvider.js.map