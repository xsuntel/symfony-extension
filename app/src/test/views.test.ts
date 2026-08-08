import * as assert from 'assert';
import * as vscode from 'vscode';
import { ServicesTreeProvider } from '../views/servicesTreeProvider';
import { RoutesTreeProvider } from '../views/routesTreeProvider';
import { ParametersTreeProvider } from '../views/parametersTreeProvider';

// The test host has no Symfony project on disk, so `bin/console` is never found and
// every getter returns an empty map — the deterministic path these tests exercise.
suite('Tree view empty state', () => {
    const providers: Array<[string, { getChildren(): vscode.TreeItem[] }]> = [
        ['services', new ServicesTreeProvider()],
        ['routes', new RoutesTreeProvider()],
        ['parameters', new ParametersTreeProvider()],
    ];

    for (const [name, provider] of providers) {
        test(`${name}: shows a single warning item when no data`, () => {
            const children = provider.getChildren();
            assert.strictEqual(children.length, 1, 'expected one placeholder item');

            const [item] = children;
            const icon = item.iconPath;
            assert.ok(icon instanceof vscode.ThemeIcon, 'placeholder uses a ThemeIcon');
            assert.strictEqual((icon as vscode.ThemeIcon).id, 'warning');
        });
    }
});
