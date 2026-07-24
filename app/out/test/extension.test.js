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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
/**
 * Locate the extension under development by manifest name — the publisher prefix
 * is a placeholder and may change, so match on the `symfony-extensions` suffix.
 */
function findExtension() {
    return vscode.extensions.all.find((ext) => ext.id.endsWith('.symfony-extensions'));
}
suite('Extension activation', () => {
    test('extension is present in the host', () => {
        assert.ok(findExtension(), 'symfony-extensions extension should be discoverable');
    });
    test('activates and registers all Symfony commands', async () => {
        const ext = findExtension();
        assert.ok(ext, 'extension must be found before activation');
        await ext.activate();
        const commands = await vscode.commands.getCommands(true);
        for (const id of ['symfony.refresh', 'symfony.filter', 'symfony.clearFilter']) {
            assert.ok(commands.includes(id), `command ${id} should be registered`);
        }
    });
});
//# sourceMappingURL=extension.test.js.map