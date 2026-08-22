import * as assert from 'assert';
import * as vscode from 'vscode';
import { SymfonyTreeProvider } from '../views/baseTreeProvider';
import { ServicesTreeProvider } from '../views/servicesTreeProvider';
import { RoutesTreeProvider } from '../views/routesTreeProvider';
import { ParametersTreeProvider } from '../views/parametersTreeProvider';

function placeholderIcon(item: vscode.TreeItem): string | undefined {
    return item.iconPath instanceof vscode.ThemeIcon ? item.iconPath.id : undefined;
}

// The test host has no Symfony project on disk, so `bin/console` is never found and
// every getter returns an empty map — the deterministic path these tests exercise.
suite('Tree view empty state', () => {
    const providers: Array<[string, { getChildren(): Promise<vscode.TreeItem[]> }]> = [
        ['services', new ServicesTreeProvider()],
        ['routes', new RoutesTreeProvider()],
        ['parameters', new ParametersTreeProvider()],
    ];

    for (const [name, provider] of providers) {
        test(`${name}: shows a single warning item when no data`, async () => {
            const children = await provider.getChildren();
            assert.strictEqual(children.length, 1, 'expected one placeholder item');
            assert.strictEqual(placeholderIcon(children[0]), 'warning', 'placeholder uses the warning ThemeIcon');
        });
    }

    test('providers are disposable so extension.ts can release the EventEmitter', () => {
        const provider = new ServicesTreeProvider();
        assert.strictEqual(typeof provider.dispose, 'function');
        provider.dispose();   // must not throw
    });
});

// Exercises the shared pipeline in SymfonyTreeProvider with data, which the empty-state
// tests above can never reach on a host with no Symfony project.
class StubTree extends SymfonyTreeProvider<string> {
    protected readonly noun = 'stubs';

    constructor(private readonly data: Record<string, string>) {
        super();
    }

    protected fetch(): Promise<Record<string, string>> {
        return Promise.resolve(this.data);
    }

    protected createItem(key: string): vscode.TreeItem {
        return new vscode.TreeItem(key);
    }
}

suite('Tree view filtering', () => {
    const data = { zebra: 'z', mailer: 'm', 'app.mailer': 'a' };

    test('sorts entries alphabetically when unfiltered', async () => {
        const children = await new StubTree(data).getChildren();
        assert.deepStrictEqual(children.map((item) => item.label), ['app.mailer', 'mailer', 'zebra']);
    });

    test('setFilter narrows to substring matches, case-insensitively', async () => {
        const tree = new StubTree(data);
        tree.setFilter('MAIL');
        const children = await tree.getChildren();
        assert.deepStrictEqual(children.map((item) => item.label), ['app.mailer', 'mailer']);
    });

    test('a filter matching nothing yields a hint, not a blank tree', async () => {
        const tree = new StubTree(data);
        tree.setFilter('zzz');
        const children = await tree.getChildren();
        assert.strictEqual(children.length, 1);
        assert.strictEqual(placeholderIcon(children[0]), 'warning');
        assert.match(String(children[0].label), /No stubs match "zzz"/);
    });

    test('clearing the filter restores every entry', async () => {
        const tree = new StubTree(data);
        tree.setFilter('zzz');
        tree.setFilter('');
        const children = await tree.getChildren();
        assert.strictEqual(children.length, 3);
    });
});
