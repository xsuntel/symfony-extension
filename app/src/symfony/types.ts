// Typed shapes for the JSON payloads emitted by `php bin/console ... --format=json`.
// Parsed data is treated as `unknown` and narrowed against these shapes — never cast raw.
//
// The narrowing helpers below are the single place where CLI version differences are
// reconciled, so providers and tree views consume one stable contract.

export interface ServiceDefinition {
    class?: string;
    public?: boolean;
    shared?: boolean;
    autowire?: boolean;
    /** Tag names only — attribute maps are dropped during normalisation. */
    tags?: string[];
}

export interface RouteDefinition {
    name?: string;
    path?: string;
    method?: string;
    controller?: string;
    host?: string;
}

export type ServiceMap = Record<string, ServiceDefinition>;
export type RouteMap = Record<string, RouteDefinition>;
export type ParameterMap = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
}

/**
 * Tags arrive in more than one shape depending on the Symfony version: an object keyed
 * by tag name, or an array of names / attribute objects carrying a `name`. Collapse all
 * of them to a plain name list so the hover never renders numeric indices.
 */
export function toTagNames(tags: unknown): string[] {
    if (Array.isArray(tags)) {
        return tags
            .map((tag) => (isRecord(tag) ? asString(tag.name) : asString(tag)))
            .filter((name): name is string => name !== undefined);
    }
    if (isRecord(tags)) {
        return Object.keys(tags);
    }
    return [];
}

function toServiceDefinition(value: unknown): ServiceDefinition {
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
function aliasTarget(value: unknown): string | undefined {
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
export function toServiceMap(data: unknown): ServiceMap {
    if (!isRecord(data)) {
        return {};
    }

    const definitions = isRecord(data.definitions) ? data.definitions : {};
    const map: ServiceMap = {};
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

function toRouteDefinition(value: unknown, name: string): RouteDefinition {
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
export function toRouteMap(data: unknown): RouteMap {
    if (Array.isArray(data)) {
        const map: RouteMap = {};
        for (const entry of data) {
            const name = isRecord(entry) ? asString(entry.name) : undefined;
            if (name === undefined) {
                continue;   // a route with no name cannot be referenced from code
            }
            map[name] = toRouteDefinition(entry, name);
        }
        return map;
    }
    if (!isRecord(data)) {
        return {};
    }
    return Object.fromEntries(
        Object.entries(data).map(([name, entry]) => [name, toRouteDefinition(entry, name)]),
    );
}

/** `debug:container --parameters --format=json` wraps the map under `parameters`. */
export function toParameterMap(data: unknown): ParameterMap {
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
