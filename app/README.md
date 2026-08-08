# Symfony Extensions

Symfony Framework support for Visual Studio Code. Provides autocomplete, hover
documentation, go-to-definition, and sidebar tree views for Symfony **services**,
**routes**, and **parameters** in PHP and YAML files.

Data is read live from your project's `bin/console` (`debug:container`,
`debug:router`) and cached for 30 seconds.

## Features

| Feature | PHP | YAML |
| --- | --- | --- |
| **Autocomplete** services | `->get('`, `->has('`, `#[Autowire(service: '` | `@serviceId` |
| **Autocomplete** routes | `->redirectToRoute('`, `->generateUrl('`, `->forward('`, `route('` | — |
| **Autocomplete** parameters | `->getParameter('`, `#[Autowire(value: '%` | `'%param%'` |
| **Hover** docs | service class/route path/parameter value under the cursor | `@service`, `%param%` |
| **Go-to-definition** | service ID → PHP class file | `@serviceId` → PHP class file |

### Sidebar

An activity-bar **Symfony** container with three tree views — Services, Routes,
Parameters. Each toolbar offers:

- **Filter** (`$(filter)`) — filter the list by ID/name via an input box
- **Clear Filter** (`$(clear-all)`) — reset the filter
- **Refresh** (`$(refresh)`) — invalidate the cache and re-read `bin/console`

## Requirements

- A Symfony project with an executable `bin/console` (the extension activates on
  `workspaceContains:**/bin/console`, or when a PHP/YAML file is opened).
- `php` available on `PATH`.

## Extension Settings

None yet.

## Development

```bash
npm install
npm run watch     # incremental tsc build (src → out)
npm run lint      # eslint
npm test          # compile + lint + @vscode/test-cli integration tests
```

Open `app/` as the workspace root and press **F5** to launch the Extension
Development Host. See [CLAUDE.md](CLAUDE.md) for architecture details.

## Known Limitations

- Results reflect the last `bin/console` run (30s cache); use **Refresh** after
  container changes.
- Go-to-definition resolves by class file name and prefers the closest namespace
  match; ambiguous names in large monorepos may resolve to the first hit.
