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
const completionProvider_1 = require("../providers/completionProvider");
const hoverProvider_1 = require("../providers/hoverProvider");
async function openPhp(content) {
    return vscode.workspace.openTextDocument({ language: 'php', content });
}
// Position of the cursor just after `marker` within the document's single line.
function cursorAfter(document, marker) {
    const index = document.getText().indexOf(marker) + marker.length;
    return document.positionAt(index);
}
suite('Completion provider', () => {
    const provider = new completionProvider_1.SymfonyCompletionProvider();
    test('returns [] on a non-trigger line', async () => {
        const doc = await openPhp('<?php $total = 1 + 2;');
        const items = await provider.provideCompletionItems(doc, cursorAfter(doc, '1 + 2'));
        assert.ok(Array.isArray(items), 'should return an array, never null/throw');
        assert.strictEqual(items.length, 0);
    });
    test('returns an array (no data → empty) on a service trigger', async () => {
        const doc = await openPhp("<?php $this->get('");
        const items = await provider.provideCompletionItems(doc, cursorAfter(doc, "get('"));
        // No Symfony project in the host → getServices() is empty, but the path must not throw.
        assert.ok(Array.isArray(items));
    });
});
suite('Hover provider', () => {
    const provider = new hoverProvider_1.SymfonyHoverProvider();
    test('returns null for an unknown service token', async () => {
        const doc = await openPhp("<?php $this->get('mailer');");
        const hover = await provider.provideHover(doc, cursorAfter(doc, 'mail'));
        assert.strictEqual(hover, null, 'no data → graceful null, not a throw');
    });
    test('returns null on a line with no Symfony token', async () => {
        const doc = await openPhp('<?php $total = 1 + 2;');
        const hover = await provider.provideHover(doc, cursorAfter(doc, 'total'));
        assert.strictEqual(hover, null);
    });
});
//# sourceMappingURL=providers.test.js.map