import * as assert from 'assert';
import * as vscode from 'vscode';
import { SymfonyCompletionProvider } from '../providers/completionProvider';
import { SymfonyHoverProvider } from '../providers/hoverProvider';

async function openPhp(content: string): Promise<vscode.TextDocument> {
    return vscode.workspace.openTextDocument({ language: 'php', content });
}

// Position of the cursor just after `marker` within the document's single line.
function cursorAfter(document: vscode.TextDocument, marker: string): vscode.Position {
    const index = document.getText().indexOf(marker) + marker.length;
    return document.positionAt(index);
}

suite('Completion provider', () => {
    const provider = new SymfonyCompletionProvider();

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
    const provider = new SymfonyHoverProvider();

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
