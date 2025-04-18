# Overview

This server acts as a Model Context Protocol (MCP) bridge to interact with the Cribl REST API.
It allows AI models or other MCP clients to query and manage Cribl configurations.

See [`configuration.md`](./configuration.md) for how to set up environment variables and authentication.
See [`usage.md`](./usage.md) for how to run the server and examples of using the tools.

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
*   `cribl_restartWorkerGroup`: Restarts workers within a specific Worker Group/Fleet.
    *   Arguments: None. This tool does not require any parameters.
    *   Output: Success message or error details.
    *   **Note:** The specific group restarted might depend on the client library's default group context. The underlying API call (`PATCH /api/v1/master/workers/restart`) might affect all workers; verify scope in your environment.
*   `cribl_getSystemMetrics`: Retrieves system metrics from the Cribl deployment.
    *   Arguments:
        *   `filterExpr` (string, optional): A JS expression to filter metrics (e.g., "model.pipeline === 'test'", or "host == 'myhost'").
        *   `metricNameFilter` (string, optional): Regex or array of metric names (e.g., limit to "pipe.*", "total.in_bytes", or "os.cpu.perc,os.mem.*").
        *   `earliest` (string, optional): Start time (e.g., `'-15m'`).
        *   `latest` (string, optional): End time (e.g., `'now'`).
        *   `numBuckets` (number, optional): Number of time buckets for aggregation.
        *   `wp` (string, optional): Worker process filter.
    *   Output: Text string containing the metrics data. Format may vary (e.g., Prometheus exposition format).
    *   **Note**: Use parameters to narrow scope. Defaults to `numBuckets=1` if no parameters are given.

## Future Enhancements

The following tools represent potential future capabilities for this MCP server, based on common Cribl workflows:

*   **`cribl_testPipelineConfig`**
    *   Description: Validates a pipeline config before deployment.
    *   Why: Prevents pushing broken or invalid configurations, especially valuable in automated workflows.

*   **`cribl_versionControl`**
    *   Description: Detects if version control is enabled.
    *   Why: Determines if commit and deploy steps are required.

*   **`cribl_commitPipeline`**
    *   Description: Commits staged configuration changes.
    *   Why: Part of the standard version control workflow.

*   **`cribl_deployPipeline`**
    *   Description: Deploys the latest committed configuration to a specific worker group.
    *   Why: Enables full lifecycle management via MCP.

*   **`cribl_listPacks`