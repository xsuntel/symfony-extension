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
exports.SymfonyHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const console_1 = require("../symfony/console");
const cursorToken_1 = require("./cursorToken");
// Capture the token under/around the cursor for each context.
const SERVICE_HOVER = /->(?:get|has)\(\s*['"]([^'"]+)['"]/;
const ROUTE_HOVER = /->(?:redirectToRoute|generateUrl|forward)\(\s*['"]([^'"]+)['"]/;
const PARAM_HOVER = /->getParameter\(\s*['"]([^'"]+)['"]|%([^%]+)%/;
const YAML_SERVICE = /@([A-Za-z0-9_.\\]+)/;
const YAML_PARAM = /%([^%]+)%/;
class SymfonyHoverProvider {
    provideHover(document, position) {
        const isYaml = document.languageId === 'yaml';
        // Match the token *under the cursor* (getWordRangeAtPosition), not the line's first match.
        if (isYaml) {
            const service = (0, cursorToken_1.tokenAt)(document, position, YAML_SERVICE);
            if (service) {
                return this.serviceHover(service);
            }
            const param = (0, cursorToken_1.tokenAt)(document, position, YAML_PARAM);
            if (param) {
                return this.paramHover(param);
            }
            return null;
        }
        const service = (0, cursorToken_1.tokenAt)(document, position, SERVICE_HOVER);
        if (service) {
            return this.serviceHover(service);
        }
        const route = (0, cursorToken_1.tokenAt)(document, position, ROUTE_HOVER);
        if (route) {
            return this.routeHover(route);
        }
        const param = (0, cursorToken_1.tokenAt)(document, position, PARAM_HOVER);
        if (param) {
            return this.paramHover(param);
        }
        return null;
    }
    serviceHover(id) {
        const def = console_1.symfonyConsole.getServices()[id];
        if (!def) {
            return null;
        }
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### Service: \`${id}\`\n\n`);
        md.appendMarkdown(`**Class:** \`${def.class ?? 'n/a'}\`  \n`);
        md.appendMarkdown(`**Public:** ${def.public ? 'yes' : 'no'}  \n`);
        md.appendMarkdown(`**Shared:** ${def.shared ? 'yes' : 'no'}  \n`);
        md.appendMarkdown(`**Autowire:** ${def.autowire ? 'yes' : 'no'}  \n`);
        const tags = Object.keys(def.tags ?? {});
        if (tags.length > 0) {
            md.appendMarkdown(`\n**Tags:** ${tags.map((tag) => `\`${tag}\``).join(', ')}`);
        }
        return new vscode.Hover(md);
    }
    routeHover(name) {
        const def = console_1.symfonyConsole.getRoutes()[name];
        if (!def) {
            return null;
        }
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### Route: \`${name}\`\n\n`);
        md.appendMarkdown(`**Path:** \`${def.path ?? 'n/a'}\`  \n`);
        md.appendMarkdown(`**Method:** ${def.method ?? 'ANY'}  \n`);
        md.appendMarkdown(`**Controller:** \`${def.controller ?? 'n/a'}\`  \n`);
        if (def.host && def.host !== 'ANY') {
            md.appendMarkdown(`**Host:** \`${def.host}\`  \n`);
        }
        return new vscode.Hover(md);
    }
    paramHover(name) {
        const params = console_1.symfonyConsole.getParameters();
        if (!(name in params)) {
            return null;
        }
        const value = params[name];
        const display = typeof value === 'object'
            ? '```json\n' + JSON.stringify(value, null, 2) + '\n```'
            : `\`${String(value)}\``;
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### Parameter: \`${name}\`\n\n`);
        md.appendMarkdown(`**Value:** ${display}`);
        return new vscode.Hover(md);
    }
}
exports.SymfonyHoverProvider = SymfonyHoverProvider;
//# sourceMappingURL=hoverProvider.js.map