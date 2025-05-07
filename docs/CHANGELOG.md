# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]


## [0.1.12] - 2025-05-07
### Added
- `cribl_versionControl`: Detects if version control is enabled.
- `cribl_commitPipeline`: Commits staged pipeline config changes.
- `cribl_deployPipeline`: Deploys the latest committed configuration to a worker group.

### Changed
- Restored placeholder description for `groupName` in all Cribl tool schemas by reverting to `z.string().optional()`, removing `nullable()` and default values so the inspector UI shows the description as placeholder.
- Use `z.preprocess` to map `null` to `undefined` for optional `groupName` argument, ensuring Inspector's blank input triggers fallback while showing placeholder text.
- Use `z.preprocess` to map `null`, `undefined`, or empty string to default `'stream'` for `productType` argument in `cribl_listWorkerGroups`, ensuring Inspector's blank input uses the default.

## [0.1.11] - 2025-04-19
### Fixed
- Re-aligned versioning with npm registry to correct earlier tagging inconsistency
- Cleaned up publishing flow to ensure only scoped version (`@pebbletek/cribl-mcp`) is used going forward

### Added
- GitHub release notes
- Deprecation notice for unscoped `cribl-mcp` package

## [0.1.10] - 2025-04-19
### Changed
- Reverted .env loading logic to support MCP_DOTENV_PATH override and fallback to default search
- Added descriptive summaries for all Cribl MCP tools in `src/server.ts`

## [0.1.9] - 2025-04-18
### Added
- Documented support for `MCP_DOTENV_PATH` environment variable in `src/config.ts` to specify a custom `.env` file location. See `docs/configuration.md` and `docs/usage.md` for examples.
- Documented running the server via `node dist/server.js` in `docs/usage.md`.
- Added `cribl_getSystemMetrics` tool and optional parameters (`filter`, `metrics`, `earliest`, `latest`, `buckets`) to allow filtering and scoping of metrics queries.
- Updated `cribl_getSystemMetrics` tool description to strongly recommend using parameters to limit response size and clarify default of `buckets=1`.

### Changed
- Removed `cribl_getPipelineStats` from the "Future Enhancements" section in `docs/overview.md` as `cribl_getSystemMetrics` covers this functionality.
- Renamed `filter` parameter to `filterExpr` and added `wp` parameter to `cribl_getSystemMetrics` tool and documentation for consistency with Cribl API.
- Updated `cribl_getSystemMetrics` tool and documentation to use official Cribl API parameter names: `buckets` is now `numBuckets`, and `metrics` is now `metricNameFilter`.

### Fixed
- Adjusted error messages in `src/config.ts` related to missing environment variables to mention `MCP_DOTENV_PATH`.

## [0.1.5] - 2024-06-21
### Added
- Added shebang (`#!/usr/bin/env node`) to `src/server.ts` to ensure it can be executed directly.

### Changed
- Modified `build` script in `package.json` (`tsc && chmod +x dist/server.js`) to make the compiled `dist/server.js` executable after each build.
- Removed MacOS related files (.DS_Store) and updated .gitignore.
- Updated documentation (`README.md`, `docs/usage.md`) to use the correct `npx` organization name (`@pebbletek/cribl-mcp` instead of `@pebble/cribl-mcp`) and remove outdated references to `fastmcp`.
- Improved cross-linking between documentation files (`README.md`, `docs/overview.md`, `docs/usage.md`, `docs/configuration.md`).
- Updated `README.md` and `docs/usage.md` with clearer instructions on running via `npx` and handling environment variables directly on the command line.
- Updated documentation to reflect that `mcp_Cribl_cribl_restartWorkerGroup` no longer requires a dummy parameter and takes no arguments.


## [0.1.4] - 2025-04-16
### Changed
- Updated `package.json` after it became corrupted.


## [0.1.2] - 2025-04-15
### Added
- Dynamic authentication supporting Cribl.Cloud (Client ID/Secret) and Local (Username/Password) via `.env` settings (`CRIBL_AUTH_TYPE`).
- Automatic token acquisition and refresh using Axios interceptor.
- `cribl_listWorkerGroups` tool to list groups, with optional `productType` filtering (stream, edge, search, all).
- `cribl_getPipelineConfig` tool to fetch configuration for a specific pipeline.
- Automatic Worker Group selection: If `groupName` is omitted for relevant tools, attempts to use the sole 'stream' group if only one exists.
- More robust error handling in API client (`