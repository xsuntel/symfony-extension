import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Locate the extension under development by manifest name — the publisher prefix
 * is a placeholder and may change, so match on the `symfony-extensions` suffix.
 */
function findExtension(): vscode.Extension<unknown> | undefined {
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
