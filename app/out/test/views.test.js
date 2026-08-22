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
const baseTreeProvider_1 = require("../views/baseTreeProvider");
const servicesTreeProvider_1 = require("../views/servicesTreeProvider");
const routesTreeProvider_1 = require("../views/routesTreeProvider");
const parametersTreeProvider_1 = require("../views/parametersTreeProvider");
function placeholderIcon(item) {
    return item.iconPath instanceof vscode.ThemeIcon ? item.iconPath.id : undefined;
}
// The test host has no Symfony project on disk, so `bin/console` is never found and
// every getter returns an empty map — the deterministic path these tests exercise.
suite('Tree view empty state', () => {
    const providers = [
        ['services', new servicesTreeProvider_1.ServicesTreeProvider()],
        ['routes', new routesTreeProvider_1.RoutesTreeProvider()],
        ['parameters', new parametersTreeProvider_1.ParametersTreeProvider()],
    ];
    for (const [name, provider] of providers) {
        test(`${name}: shows a single warning item when no data`, async () => {
            const children = await provider.getChildren();
            assert.strictEqual(children.length, 1, 'expected one placeholder item');
            assert.strictEqual(placeholderIcon(children[0]), 'warning', 'placeholder uses the warning ThemeIcon');
        });
    }
    test('providers are disposable so extension.ts can release the EventEmitter', () => {
        const provider = new servicesTreeProvider_1.ServicesTreeProvider();
        assert.strictEqual(typeof provider.dispose, 'function');
        provider.dispose(); // must not throw
    });
});
// Exercises the shared pipeline in SymfonyTreeProvider with data, which the empty-state
// tests above can never reach on a host with no Symfony project.
class StubTree extends baseTreeProvider_1.SymfonyTreeProvider {
    data;
    noun = 'stubs';
    constructor(data) {
        super();
        this.data = data;
    }
    fetch() {
        return Promise.resolve(this.data);
    }
    createItem(key) {
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
//# sourceMappingURL=views.test.js.map