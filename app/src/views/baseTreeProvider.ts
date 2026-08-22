import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { placeholder } from './emptyState';

/**
 * The non-generic surface `extension.ts` drives, so the three differently-typed
 * providers can live in one array without widening to `any`.
 */
export interface FilterableTree extends vscode.Disposable {
    refresh(): void;
    setFilter(text: string): void;
}

/**
 * Shared behaviour for the three Symfony tree views: refresh, filtering, and the
 * fetch → filter → sort → placeholder pipeline. Subclasses supply only a data source
 * and an item factory.
 *
 * Implements `Disposable` so `extension.ts` can register it in `context.subscriptions`
 * — the EventEmitter outlives `activate()` and leaks unless it is disposed.
 */
export abstract class SymfonyTreeProvider<T> implements vscode.TreeDataProvider<vscode.TreeItem>, FilterableTree {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private filter = '';

    /** Plural noun used in the empty-state and no-match placeholder text. */
    protected abstract readonly noun: string;

    protected abstract fetch(): Promise<Record<string, T>>;

    protected abstract createItem(key: string, value: T): vscode.TreeItem;

    refresh(): void {
        symfonyConsole.invalidateCache();
        this._onDidChangeTreeData.fire();
    }

    setFilter(text: string): void {
        this.filter = text.toLowerCase();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(): Promise<vscode.TreeItem[]> {
        const entries = Object.entries(await this.fetch());
        if (entries.length === 0) {
            return [placeholder(`No ${this.noun} found (is bin/console available?)`)];
        }

        const items = entries
            .filter(([key]) => !this.filter || key.toLowerCase().includes(this.filter))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => this.createItem(key, value));
        // Filter matched nothing — show a hint rather than a blank tree.
        if (items.length === 0) {
            return [placeholder(`No ${this.noun} match "${this.filter}"`)];
        }
        return items;
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
    }
}
