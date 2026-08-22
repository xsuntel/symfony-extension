import * as assert from 'assert';
import * as vscode from 'vscode';
import { SymfonyCompletionProvider } from '../providers/completionProvider';
import { SymfonyHoverProvider } from '../providers/hoverProvider';
import { SymfonyDefinitionProvider } from '../providers/definitionProvider';

// The test host has no Symfony project, so every data-layer getter resolves empty.
// What these tests pin down is the contract REVIEW.md cares about: providers degrade
// to [] / null and never throw, whatever the workspace looks like.

async function openPhp(content: string): Promise<vscode.TextDocument> {
    return vscode.workspace.openTextDocument({ language: 'php', content });
}

async function openYaml(content: string): Promise<vscode.TextDocument> {
    return vscode.workspace.openTextDocument({ language: 'yaml', content });
}

// Position of the cursor just after `marker` within the document's single line.
function cursorAfter(document: vscode.TextDocument, marker: string): vscode.Position {
    const index = document.getText().indexOf(marker) + marker.length;
    return document.positionAt(index);
}

function freshToken(): vscode.CancellationToken {
    return new vscode.CancellationTokenSource().token;
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
        assert.ok(Array.isArray(items));
    });

    test('returns an array on a YAML @service reference', async () => {
        const doc = await openYaml('services:\n    app.thing:\n        arguments: [ @mail');
        const items = await provider.provideCompletionItems(doc, cursorAfter(doc, '@mail'));
        assert.ok(Array.isArray(items));
    });

    test("returns an array on a YAML '%parameter reference", async () => {
        const doc = await openYaml("parameters:\n    copy: '%kernel");
        const items = await provider.provideCompletionItems(doc, cursorAfter(doc, "'%kernel"));
        assert.ok(Array.isArray(items));
    });
});

suite('Hover provider', () => {
    const provider = new SymfonyHoverProvider();

    test('returns null for an unknown service token', async () => {
        const doc = await openPhp("<?php $this->get('mailer');");
        const hover = await provider.provideHover(doc, cursorAfter(doc, 'mail'), freshToken());
        assert.strictEqual(hover, null, 'no data → graceful null, not a throw');
    });

    test('returns null on a line with no Symfony token', async () => {
        const doc = await openPhp('<?php $total = 1 + 2;');
        const hover = await provider.provideHover(doc, cursorAfter(doc, 'total'), freshToken());
        assert.strictEqual(hover, null);
    });
});

suite('Definition provider', () => {
    const provider = new SymfonyDefinitionProvider();

    test('returns null for an unknown service ID', async () => {
        const doc = await openPhp("<?php $this->get('app.nope');");
        const location = await provider.provideDefinition(doc, cursorAfter(doc, 'app.no'), freshToken());
        assert.strictEqual(location, null);
    });

    test('returns null on a YAML line with no service reference', async () => {
        const doc = await openYaml('parameters:\n    locale: en');
        const location = await provider.provideDefinition(doc, cursorAfter(doc, 'locale'), freshToken());
        assert.strictEqual(location, null);
    });
});

// REVIEW.md asks that the wiring be exercised through VSCode's own command APIs, not
// just by calling the classes — this is what catches a provider that is never registered.
suite('Provider registration (via built-in commands)', () => {
    suiteSetup(async () => {
        const ext = vscode.extensions.all.find((candidate) => candidate.id.endsWith('.symfony-extensions'));
        assert.ok(ext, 'extension must be discoverable before its providers can be invoked');
        await ext.activate();
    });

    test('executeHoverProvider resolves without throwing', async () => {
        const doc = await openPhp("<?php $this->get('mailer');");
        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            doc.uri,
            cursorAfter(doc, 'mail'),
        );
        assert.ok(Array.isArray(hovers));
    });

    test('executeCompletionItemProvider resolves without throwing', async () => {
        const doc = await openPhp("<?php $this->get('");
        const list = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            cursorAfter(doc, "get('"),
        );
        assert.ok(list, 'expected a CompletionList');
        assert.ok(Array.isArray(list.items));
    });

    test('executeDefinitionProvider resolves without throwing', async () => {
        const doc = await openPhp("<?php $this->get('app.nope');");
        const locations = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            doc.uri,
            cursorAfter(doc, 'app.no'),
        );
        assert.ok(Array.isArray(locations));
        assert.strictEqual(locations.length, 0, 'unknown service resolves nowhere');
    });
});
