# Overview

This server acts as a Model Context Protocol (MCP) bridge to interact with the Cribl REST API.
It allows AI models or other MCP clients to query and manage Cribl configurations.

## Authentication

The server requires a Cribl API authentication token. This should be provided via the `CRIBL_AUTH_TOKEN` environment variable.
The base URL for the Cribl instance is needed via the `CRIBL_BASE_URL` environment variable.

## Tools

The following tools are exposed by this server:

*   `cribl_getPipelines`: Fetches a list of configured pipelines.
    *   Arguments: None
    *   Output: JSON string containing the list of pipelines.
*   `cribl_getSources`: Fetches a list of configured sources.
    *   Arguments: None
    *   Output: JSON string containing the list of sources.
*   `cribl_setPipelineConfig`: Updates the configuration for a specific pipeline.
    *   Arguments:
        *   `pipelineId` (string, required): The ID of the pipeline to update.
        *   `config` (object, required): The new configuration object for the pipeline.
    *   Output: Success message or error details.
*   `cribl_restartWorkerGroup`: Restarts workers in a specified group.
    *   Arguments:
        *   `group` (string, optional, default: 'default'): The worker group name to restart.
    *   Output: Success message or error details. 