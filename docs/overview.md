# Overview

This server acts as a Model Context Protocol (MCP) bridge to interact with the Cribl REST API.
It allows AI models or other MCP clients to query and manage Cribl configurations.

## Authentication

The server automatically acquires and manages API authentication tokens based on environment variables set in the `.env` file.

*   `CRIBL_BASE_URL`: The root URL of your Cribl instance (e.g., `https://<org>-<instance>.cribl.cloud` or `http://<host>:9000`).
*   `CRIBL_AUTH_TYPE`: Set to `cloud` for Cribl.Cloud deployments or `local` for customer-managed deployments.

**If `CRIBL_AUTH_TYPE=cloud`:**
*   `CRIBL_CLIENT_ID`: Your Cribl.Cloud API Credential Client ID.
*   `CRIBL_CLIENT_SECRET`: Your Cribl.Cloud API Credential Client Secret.
*   `CRIBL_CLOUD_AUTH_URL` (Optional): Overrides the default `https://login.cribl.cloud` if necessary.

**If `CRIBL_AUTH_TYPE=local`:**
*   `CRIBL_USERNAME`: Username for a local user on the Cribl instance.
*   `CRIBL_PASSWORD`: Password for the local user.

## Tools

The following tools are exposed by this server:

*   `cribl_listWorkerGroups`: Fetches a list of available Worker Groups/Fleets.
    *   Arguments:
        *   `productType` (enum: 'stream', 'edge', 'search', 'all', optional, default: 'stream'): Filters groups by product type.
    *   Output: JSON string containing the filtered list of groups (e.g., `[{ "id": "default" }, ...]`). Uses `/api/v1/master/groups` (path may need verification).
*   `cribl_getPipelines`: Fetches a list of configured pipelines for a specific Worker Group/Fleet. **Use this first to find the `pipelineId` you need.**
    *   Arguments:
        *   `groupName` (string, optional): The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group.
    *   Output: JSON string containing the list of pipelines (useful for getting `pipelineId` values).
*   `cribl_getSources`: Fetches a list of configured sources (inputs) for a specific Worker Group/Fleet.
    *   Arguments:
        *   `groupName` (string, optional): The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group.
    *   Output: JSON string containing the list of sources.
*   `cribl_getPipelineConfig`: Fetches the full configuration object for a specific pipeline. **Use this to view the current configuration before modifying.**
    *   Arguments:
        *   `groupName` (string, optional): The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group.
        *   `pipelineId` (string, required): The ID of the pipeline to retrieve (obtainable from `cribl_getPipelines`).
    *   Output: JSON string containing the full pipeline object (including `.config`). If the `pipelineId` is not found, the error message will include a list of valid IDs for the group.
*   `cribl_setPipelineConfig`: Updates the configuration for a specific pipeline within a specific Worker Group/Fleet. **Recommend using `cribl_getPipelineConfig` first.**
    *   Arguments:
        *   `groupName` (string, optional): The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group.
        *   `pipelineId` (string, required): The ID of the pipeline to update (obtainable from `cribl_getPipelines`).
        *   `config` (object, required): The pipeline configuration payload expected by the API, typically structured as `{ id: 'pipeline-id', conf: { ... actual config ... } }`. Use `cribl_getPipelineConfig` to see the expected structure.
    *   Output: Success message or error details.
*   `cribl_restartWorkerGroup`: Restarts workers (likely *all* workers managed by the Leader).
    *   Arguments: None
    *   Output: Success message or error details.
    *   **Warning:** Uses the documented path `PATCH /api/v1/master/workers/restart`. Verify its scope (all workers vs. specific group) in your environment. A 200 OK response indicates the request was accepted; verify restart via Cribl UI/logs.

*~~`cribl_restartWorkerGroup`~~*: (Currently disabled - API path needs verification for Cloud/specific deployments)
    *   ~~Arguments:~~~
        *   ~~`groupName` (string, required): The worker group name to restart.~~~
    *   ~~Output: Success message or error details.~~ 