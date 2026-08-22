import * as vscode from 'vscode';

/** A non-selectable info row shown when a tree has no data or no filter matches. */
export function placeholder(message: string): vscode.TreeItem {
    const item = new vscode.TreeItem(message);
    item.iconPath = new vscode.ThemeIcon('warning');
    return item;
}
