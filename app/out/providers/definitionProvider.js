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
exports.SymfonyDefinitionProvider = void 0;
const vscode = __importStar(require("vscode"));
const console_1 = require("../symfony/console");
const cursorToken_1 = require("./cursorToken");
const SERVICE_PATTERN = /->(?:get|has)\(\s*['"]([^'"]+)['"]/;
const YAML_SERVICE_PATTERN = /@([A-Za-z0-9_.\\]+)/;
class SymfonyDefinitionProvider {
    async provideDefinition(document, position) {
        const isYaml = document.languageId === 'yaml';
        // Resolve the service ID from the token under the cursor (not the line's first match).
        const pattern = isYaml ? YAML_SERVICE_PATTERN : SERVICE_PATTERN;
        const serviceId = (0, cursorToken_1.tokenAt)(document, position, pattern);
        if (!serviceId) {
            return null;
        }
        const def = console_1.symfonyConsole.getServices()[serviceId];
        if (!def?.class) {
            return null;
        }
        const uri = await this.findClassFile(def.class);
        if (!uri) {
            return null;
        }
        return new vscode.Location(uri, new vscode.Position(0, 0));
    }
    /**
     * Converts a PHP FQCN to a file URI by searching the workspace.
     * `App\Service\MyService` → glob `**\/MyService.php` (vendor excluded).
     */
    async findClassFile(fqcn) {
        const parts = fqcn.replace(/\\/g, '/').split('/');
        const className = parts.at(-1);
        if (!className) {
            return null;
        }
        const pattern = `**/${className}.php`;
        const files = await vscode.workspace.findFiles(pattern, '**/vendor/**', 5);
        if (files.length === 0) {
            return null;
        }
        // If multiple hits, prefer one whose path contains the last two namespace segments.
        if (files.length === 1) {
            return files[0];
        }
        const namespacePath = parts.slice(-2).join('/');
        const best = files.find((file) => file.fsPath.replace(/\\/g, '/').includes(namespacePath));
        return best ?? files[0];
    }
}
exports.SymfonyDefinitionProvider = SymfonyDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map