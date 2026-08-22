import * as assert from 'assert';
import { toRouteMap, toServiceMap, toParameterMap, toTagNames } from '../symfony/types';

// These normalisers are pure: no VSCode host, no Symfony project, no PHP process.
// They are the layer that absorbs `bin/console` version differences, so every shape
// the CLI is known to emit gets a case here.

suite('toTagNames', () => {
    test('reads the keys of an object-shaped tag map', () => {
        assert.deepStrictEqual(toTagNames({ 'kernel.event_listener': [], 'monolog.logger': [] }), [
            'kernel.event_listener',
            'monolog.logger',
        ]);
    });

    test('reads an array of tag names', () => {
        assert.deepStrictEqual(toTagNames(['console.command']), ['console.command']);
    });

    test('reads the name out of an array of attribute objects', () => {
        const tags = [{ name: 'kernel.event_subscriber', priority: 10 }, { priority: 5 }];
        assert.deepStrictEqual(toTagNames(tags), ['kernel.event_subscriber']);
    });

    test('returns [] for absent or unexpected input', () => {
        assert.deepStrictEqual(toTagNames(undefined), []);
        assert.deepStrictEqual(toTagNames('nope'), []);
    });
});

suite('toServiceMap', () => {
    test('unwraps the definitions object', () => {
        const map = toServiceMap({ definitions: { 'app.mailer': { class: 'App\\Mailer', public: true } } });
        assert.strictEqual(map['app.mailer'].class, 'App\\Mailer');
        assert.strictEqual(map['app.mailer'].public, true);
    });

    test('merges aliases so short IDs resolve to their target class', () => {
        const map = toServiceMap({
            definitions: { 'app.mailer': { class: 'App\\Mailer' } },
            aliases: { mailer: { service: 'app.mailer' }, mail: 'app.mailer' },
        });
        // Both alias spellings the CLI uses must land on the target's class.
        assert.strictEqual(map.mailer.class, 'App\\Mailer');
        assert.strictEqual(map.mail.class, 'App\\Mailer');
    });

    test('keeps an unresolvable alias as a completable ID with no class', () => {
        const map = toServiceMap({ definitions: {}, aliases: { orphan: 'missing.target' } });
        assert.ok('orphan' in map);
        assert.strictEqual(map.orphan.class, undefined);
    });

    test('never lets an alias shadow a real definition', () => {
        const map = toServiceMap({
            definitions: { mailer: { class: 'App\\Real' } },
            aliases: { mailer: 'something.else' },
        });
        assert.strictEqual(map.mailer.class, 'App\\Real');
    });

    test('returns {} for a failed run', () => {
        assert.deepStrictEqual(toServiceMap(null), {});
    });
});

suite('toRouteMap', () => {
    test('keys a Symfony 6+ array payload by route name', () => {
        const map = toRouteMap([{ name: 'app_home', path: '/', method: 'GET' }]);
        assert.strictEqual(map.app_home.path, '/');
        assert.strictEqual(map.app_home.method, 'GET');
    });

    test('backfills the name when an older object payload omits it', () => {
        const map = toRouteMap({ app_home: { path: '/' } });
        assert.strictEqual(map.app_home.name, 'app_home');
    });

    test('falls back to defaults._controller for the controller', () => {
        const map = toRouteMap({ app_home: { path: '/', defaults: { _controller: 'App\\HomeController' } } });
        assert.strictEqual(map.app_home.controller, 'App\\HomeController');
    });

    test('skips an array entry with no name — it cannot be referenced from code', () => {
        assert.deepStrictEqual(toRouteMap([{ path: '/orphan' }]), {});
    });

    test('returns {} for a failed run', () => {
        assert.deepStrictEqual(toRouteMap(null), {});
    });
});

suite('toParameterMap', () => {
    test('unwraps the parameters object', () => {
        assert.deepStrictEqual(toParameterMap({ parameters: { 'kernel.debug': true } }), { 'kernel.debug': true });
    });

    test('returns {} for a failed run', () => {
        assert.deepStrictEqual(toParameterMap(null), {});
    });
});
