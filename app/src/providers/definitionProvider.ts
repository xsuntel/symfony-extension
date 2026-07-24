import * as vscode from 'vscode';
import { symfonyConsole } from '../symfony/console';
import { tokenAt } from './cursorToken';

const SERVICE_PATTERN = /->(?:get|has)\(\s*['"]([^'"]+)['"]/;
const YAML_SERVICE_PATTERN = /@([A-Za-z0-9_.\\]+)/;

export class SymfonyDefinitionProvider implements vscode.DefinitionProvider {
    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<vscode.Location | null> {
        const isYaml = document.languageId === 'yaml';

        // Resolve the service ID from the token under the cursor (not the line's first match).
        const pattern = isYaml ? YAML_SERVICE_PATTERN : SERVICE_PATTERN;
        const serviceId = tokenAt(document, position, pattern);
        if (!serviceId) {
            return null;
        }

        const def = symfonyConsole.getServices()[serviceId];
        if (!def?.class) {
            return null;
        }

        const uri = await this.findClassFile(def.class);
        if (!uri) {
            return null;
        }

        return new vscode.Location(uri, new vscode.Position(0, 0));
    }

    /**
     * Converts a PHP FQCN to a file URI by searching the workspace.
     * `App\Service\MyService` → glob `**\/MyService.php` (vendor excluded).
     */
    private async findClassFile(fqcn: string): Promise<vscode.Uri | null> {
        const parts = fqcn.replace(/\\/g, '/').split('/');
        const className = parts.at(-1);
        if (!className) {
            return null;
        }

        const pattern = `**/${className}.php`;
        const files = await vscode.workspace.findFiles(pattern, '**/vendor/**', 5);
        if (files.length === 0) {
            return null;
        }

        // If multiple hits, prefer one whose path contains the last two namespace segments.
        if (files.length === 1) {
            return files[0];
        }
        const namespacePath = parts.slice(-2).join('/');
        const best = files.find((file) => file.fsPath.replace(/\\/g, '/').includes(namespacePath));
        return best ?? files[0];
    }
}
