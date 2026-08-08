// Typed shapes for the JSON payloads emitted by `php bin/console ... --format=json`.
// Parsed data is treated as `unknown` and narrowed against these shapes — never cast raw.

export interface ServiceDefinition {
    class?: string;
    public?: boolean;
    shared?: boolean;
    autowire?: boolean;
    tags?: Record<string, unknown[]>;
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
