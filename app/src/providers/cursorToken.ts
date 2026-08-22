import * as vscode from 'vscode';

/**
 * Extracts the captured token from the regex match located *under the cursor*.
 *
 * `getWordRangeAtPosition` returns the range of the whole-regex match that spans
 * `position`, so multiple tokens on one line resolve to the one being pointed at.
 * The regex is re-run against that range's text to pull the inner capture group.
 *
 * @param regex whole-match pattern with one or more capture groups; the first
 *              defined group is returned. Must not use the global flag.
 */
export function tokenAt(
    document: vscode.TextDocument,
    position: vscode.Position,
    regex: RegExp,
): string | null {
    const range = document.getWordRangeAtPosition(position, regex);
    if (!range) {
        return null;
    }
    const match = regex.exec(document.getText(range));
    if (!match) {
        return null;
    }
    const captured = match.slice(1).find((group) => group !== undefined);
    return captured ?? null;
}
