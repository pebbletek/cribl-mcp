# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.2] - 2025-04-15
### Added
- Dynamic authentication supporting Cribl.Cloud (Client ID/Secret) and Local (Username/Password) via `.env` settings (`CRIBL_AUTH_TYPE`).
- Automatic token acquisition and refresh using Axios interceptor.
- `cribl_listWorkerGroups` tool to list groups, with optional `productType` filtering (stream, edge, search, all).
- `cribl_getPipelineConfig` tool to fetch configuration for a specific pipeline.
- Automatic Worker Group selection: If `groupName` is omitted for relevant tools, attempts to use the sole 'stream' group if only one exists.
- More robust error handling in API client (`handleApiError`) to better manage non-JSON responses and provide clearer messages.
- Enhanced error messages for missing/invalid `groupName` and `pipelineId`, including listing available options where possible.

### Changed
- Refactored API client (`criblClient.ts`) to use dynamic authentication.
- Modified `getPipelines`, `getSources`, `setPipelineConfig`, `getPipelineConfig` tools to operate within a Worker Group context (`/api/v1/m/{groupName}/...`).
- Made `groupName` argument optional for `getPipelines`, `getSources`, `setPipelineConfig`, `getPipelineConfig`.
- Updated `setPipelineConfig` payload structure and argument description based on testing.
- Updated `restartWorkerGroup` tool to target `PATCH /api/v1/master/workers/restart` (no arguments) based on documentation, with warnings about scope.
- Removed internal `console.log` calls interfering with MCP stdio protocol; routed debug/error logs to `stderr`.
- Updated Zod schema descriptions for clarity.
- Updated README and documentation (`docs/overview.md`) to reflect all changes.

### Fixed
- Resolved various TypeScript errors and MCP SDK signature mismatches during development.
- Corrected API endpoint paths for `getPipelines` and `getSources` based on testing.
- Fixed internal "e is not iterable" error when handling certain 500 responses from `setPipelineConfig`.
- Corrected `.env` path resolution logic for compiled vs. dev modes.
- Fixed `npm run dev` script for ES Modules compatibility (`--loader ts-node/esm`).
- Removed unused `FASTMCP_LOG_LEVEL` and `PORT` variables from `docs/configuration.md`.
- Marked `src/server.ts` as executable in git to ensure correct `npx` execution.