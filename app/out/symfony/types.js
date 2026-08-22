"use strict";
// Typed shapes for the JSON payloads emitted by `php bin/console ... --format=json`.
// Parsed data is treated as `unknown` and narrowed against these shapes — never cast raw.
//
// The narrowing helpers below are the single place where CLI version differences are
// reconciled, so providers and tree views consume one stable contract.
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTagNames = toTagNames;
exports.toServiceMap = toServiceMap;
exports.toRouteMap = toRouteMap;
exports.toParameterMap = toParameterMap;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function asString(value) {
    return typeof value === 'string' ? value : undefined;
}
function asBoolean(value) {
    return typeof value === 'boolean' ? value : undefined;
}
/**
 * Tags arrive in more than one shape depending on the Symfony version: an object keyed
 * by tag name, or an array of names / attribute objects carrying a `name`. Collapse all
 * of them to a plain name list so the hover never renders numeric indices.
 */
function toTagNames(tags) {
    if (Array.isArray(tags)) {
        return tags
            .map((tag) => (isRecord(tag) ? asString(tag.name) : asString(tag)))
            .filter((name) => name !== undefined);
    }
    if (isRecord(tags)) {
        return Object.keys(tags);
    }
    return [];
}
function toServiceDefinition(value) {
    if (!isRecord(value)) {
        // `debug:container` sometimes maps an ID straight to its class name.
        return { class: asString(value) };
    }
    return {
        class: asString(value.class),
        public: asBoolean(value.public),
        shared: asBoolean(value.shared),
        autowire: asBoolean(value.autowire),
        tags: toTagNames(value.tags),
    };
}
/**
 * Resolves the alias target ID, which is either a bare string or an object with a
 * `service` key depending on the Symfony version.
 */
function aliasTarget(value) {
    if (typeof value === 'string') {
        return value;
    }
    return isRecord(value) ? asString(value.service) : undefined;
}
/**
 * `debug:container --format=json` nests real services under `definitions` and indirections
 * under `aliases`. Aliases are merged in because the short IDs developers actually type
 * (`mailer`, `logger`) are usually aliases, not definitions.
 */
function toServiceMap(data) {
    if (!isRecord(data)) {
        return {};
    }
    const definitions = isRecord(data.definitions) ? data.definitions : {};
    const map = {};
    for (const [id, definition] of Object.entries(definitions)) {
        map[id] = toServiceDefinition(definition);
    }
    const aliases = isRecord(data.aliases) ? data.aliases : {};
    for (const [id, alias] of Object.entries(aliases)) {
        if (id in map) {
            continue;
        }
        const target = aliasTarget(alias);
        // An unresolvable alias still completes as an ID; it just has no class to jump to.
        map[id] = target !== undefined && target in map ? map[target] : {};
    }
    return map;
}
function toRouteDefinition(value, name) {
    if (!isRecord(value)) {
        return { name };
    }
    // Newer payloads expose the controller only under `defaults._controller`.
    const defaults = isRecord(value.defaults) ? value.defaults : {};
    return {
        name: asString(value.name) ?? name,
        path: asString(value.path),
        method: asString(value.method),
        controller: asString(value.controller) ?? asString(defaults._controller),
        host: asString(value.host),
    };
}
/** `debug:router --format=json` returns an array on Symfony 6+ and an object on older versions. */
function toRouteMap(data) {
    if (Array.isArray(data)) {
        const map = {};
        for (const entry of data) {
            const name = isRecord(entry) ? asString(entry.name) : undefined;
            if (name === undefined) {
                continue; // a route with no name cannot be referenced from code
            }
            map[name] = toRouteDefinition(entry, name);
        }
        return map;
    }
    if (!isRecord(data)) {
        return {};
    }
    return Object.fromEntries(Object.entries(data).map(([name, entry]) => [name, toRouteDefinition(entry, name)]));
}
/** `debug:container --parameters --format=json` wraps the map under `parameters`. */
function toParameterMap(data) {
    if (!isRecord(data)) {
        return {};
    }
    const parameters = data.parameters;
    if (isRecord(parameters)) {
        return parameters;
    }
    // Some versions emit the parameter map at the top level.
    return 'parameters' in data ? {} : data;
}
//# sourceMappingURL=types.js.map