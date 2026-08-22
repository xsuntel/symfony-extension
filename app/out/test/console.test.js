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
const types_1 = require("../symfony/types");
// These normalisers are pure: no VSCode host, no Symfony project, no PHP process.
// They are the layer that absorbs `bin/console` version differences, so every shape
// the CLI is known to emit gets a case here.
suite('toTagNames', () => {
    test('reads the keys of an object-shaped tag map', () => {
        assert.deepStrictEqual((0, types_1.toTagNames)({ 'kernel.event_listener': [], 'monolog.logger': [] }), [
            'kernel.event_listener',
            'monolog.logger',
        ]);
    });
    test('reads an array of tag names', () => {
        assert.deepStrictEqual((0, types_1.toTagNames)(['console.command']), ['console.command']);
    });
    test('reads the name out of an array of attribute objects', () => {
        const tags = [{ name: 'kernel.event_subscriber', priority: 10 }, { priority: 5 }];
        assert.deepStrictEqual((0, types_1.toTagNames)(tags), ['kernel.event_subscriber']);
    });
    test('returns [] for absent or unexpected input', () => {
        assert.deepStrictEqual((0, types_1.toTagNames)(undefined), []);
        assert.deepStrictEqual((0, types_1.toTagNames)('nope'), []);
    });
});
suite('toServiceMap', () => {
    test('unwraps the definitions object', () => {
        const map = (0, types_1.toServiceMap)({ definitions: { 'app.mailer': { class: 'App\\Mailer', public: true } } });
        assert.strictEqual(map['app.mailer'].class, 'App\\Mailer');
        assert.strictEqual(map['app.mailer'].public, true);
    });
    test('merges aliases so short IDs resolve to their target class', () => {
        const map = (0, types_1.toServiceMap)({
            definitions: { 'app.mailer': { class: 'App\\Mailer' } },
            aliases: { mailer: { service: 'app.mailer' }, mail: 'app.mailer' },
        });
        // Both alias spellings the CLI uses must land on the target's class.
        assert.strictEqual(map.mailer.class, 'App\\Mailer');
        assert.strictEqual(map.mail.class, 'App\\Mailer');
    });
    test('keeps an unresolvable alias as a completable ID with no class', () => {
        const map = (0, types_1.toServiceMap)({ definitions: {}, aliases: { orphan: 'missing.target' } });
        assert.ok('orphan' in map);
        assert.strictEqual(map.orphan.class, undefined);
    });
    test('never lets an alias shadow a real definition', () => {
        const map = (0, types_1.toServiceMap)({
            definitions: { mailer: { class: 'App\\Real' } },
            aliases: { mailer: 'something.else' },
        });
        assert.strictEqual(map.mailer.class, 'App\\Real');
    });
    test('returns {} for a failed run', () => {
        assert.deepStrictEqual((0, types_1.toServiceMap)(null), {});
    });
});
suite('toRouteMap', () => {
    test('keys a Symfony 6+ array payload by route name', () => {
        const map = (0, types_1.toRouteMap)([{ name: 'app_home', path: '/', method: 'GET' }]);
        assert.strictEqual(map.app_home.path, '/');
        assert.strictEqual(map.app_home.method, 'GET');
    });
    test('backfills the name when an older object payload omits it', () => {
        const map = (0, types_1.toRouteMap)({ app_home: { path: '/' } });
        assert.strictEqual(map.app_home.name, 'app_home');
    });
    test('falls back to defaults._controller for the controller', () => {
        const map = (0, types_1.toRouteMap)({ app_home: { path: '/', defaults: { _controller: 'App\\HomeController' } } });
        assert.strictEqual(map.app_home.controller, 'App\\HomeController');
    });
    test('skips an array entry with no name — it cannot be referenced from code', () => {
        assert.deepStrictEqual((0, types_1.toRouteMap)([{ path: '/orphan' }]), {});
    });
    test('returns {} for a failed run', () => {
        assert.deepStrictEqual((0, types_1.toRouteMap)(null), {});
    });
});
suite('toParameterMap', () => {
    test('unwraps the parameters object', () => {
        assert.deepStrictEqual((0, types_1.toParameterMap)({ parameters: { 'kernel.debug': true } }), { 'kernel.debug': true });
    });
    test('returns {} for a failed run', () => {
        assert.deepStrictEqual((0, types_1.toParameterMap)(null), {});
    });
});
//# sourceMappingURL=console.test.js.map