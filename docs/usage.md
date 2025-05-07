# Usage

This document explains how to run the Cribl MCP server, connect clients, and use the available tools.

See [`overview.md`](./overview.md) for an overview of the server's available tools and capabilities.

Ensure you have configured your environment variables as described in [`configuration.md`](./configuration.md).

By default, the server runs in standard input/output (stdio) mode, suitable for MCP clients that manage the process directly.

## Connecting an MCP Client

This server follows the Model Context Protocol and communicates over stdio by default. Use a compatible MCP client tool (like Cursor, Claude Desktop, or MCP Inspector) to connect.

Configure your client to execute the server. Here's an example configuration snippet for a generic MCP client (adjust based on your specific client's format - depending on the client, you most likely will need to remove the commented lines/sections):

```json
{
  "cribl": {
    "command": "npx", 
    "args": ["@pebbletek/cribl-mcp"],
    "env": {
      "CRIBL_AUTH_TYPE": "cloud",
      "CRIBL_BASE_URL": "https://your.cribl.cloud.instance",
      "CRIBL_CLIENT_ID": "your_client_id",
      "CRIBL_CLIENT_SECRET": "your_client_secret"
//  if local
//      "CRIBL_AUTH_TYPE": "local",
//      "CRIBL_BASE_URL": "https://your.local.cribl.instance:port",
//      "CRIBL_USERNAME": "your_username",
//      "CRIBL_PASSWORD": "your_password"
    }
  }
}
```

### Connecting via MCP_DOTENV_PATH (preferred for secrets)

Instead of hard‑coding credentials inside the client configuration you can store them in a separate file (for example `cribl.env`) and instruct the MCP SDK to load it automatically by setting `MCP_DOTENV_PATH` in the server's environment block:

```jsonc
{
  "cribl": {
    "command": "npx",
    "args": ["@pebbletek/cribl-mcp"],
    "env": {
      "MCP_DOTENV_PATH": "/Users/you/cribl.env"
    }
  }
}
```

All variables defined in that `.env` file (for example `CRIBL_BASE_URL`, `CRIBL_AUTH_TYPE`, etc.) are loaded **before** the server starts, so you don't need to list them individually in the JSON.

Once connected, the client can discover and invoke the tools listed below.

## Standalone or Development ##

### Using `npx` (Recommended for Quick Use)

The easiest way to run the server, without requiring git, cloning a local copy from github, and install all dependencies, is by using `npx`:

```bash
npx @pebbletek/cribl-mcp
```

To provide environment variables directly (one line commands):

```bash
# Example for Cloud Auth
CRIBL_BASE_URL=https://your.cribl.instance CRIBL_AUTH_TYPE=cloud \\\
CRIBL_CLIENT_ID=abc123 CRIBL_CLIENT_SECRET=secret npx @pebbletek/cribl-mcp

# Example for Local Auth
CRIBL_BASE_URL=https://leader:9000 CRIBL_AUTH_TYPE=local \\\
CRIBL_USERNAME=admin CRIBL_PASSWORD=secret npx @pebbletek/cribl-mcp
```

*Note: Environment variables provided directly on the command line like this will take precedence over any values set in a `.env` file.*

As with the MCP Client config above, you can also specify  directly on the command line when launching the server yourself:

```bash
MCP_DOTENV_PATH=/Users/you/cribl.env npx @pebbletek/cribl-mcp
# or
export MCP_DOTENV_PATH=/Users/you/cribl.env
npm run dev
```


### Local Development

After cloning the repository and running `npm install`:

1.  **Development Mode (with hot-reloading):**
    ```bash
    npm run dev
    ```
2.  **Production Mode (using npm script):**
    First, build the project:
    ```bash
    npm run build
    ```
    Then, start the server using the predefined script:
    ```bash
    npm run start
    ```
3.  **Production Mode (direct execution):**
    Alternatively, after building the project with `npm run build`, you can execute the built JavaScript file directly using Node.js:
    ```bash
    node dist/server.js
    ```
    This is essentially what `npm run start` does but allows for more direct control if needed.

## Available Tools

Here are the tools currently exposed by the Cribl MCP server:

### `mcp_Cribl_cribl_listWorkerGroups`

*   **Description**: Lists Worker Groups/Fleets in the Cribl deployment.
*   **Parameters**:
    *   `productType` (Optional, `string`): Filter groups by product type. Allowed values: `stream`, `edge`, `search`, `all`. Defaults to `stream`.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_listWorkerGroups(productType='edge')`

### `mcp_Cribl_cribl_getPipelines`

*   **Description**: Retrieves a list of pipelines for a specific Worker Group/Fleet.
*   **Parameters**:
    *   `groupName` (Optional, `string`): The name of the Worker Group/Fleet. If omitted, defaults to the sole Stream group if only one exists.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_getPipelines(groupName='my-stream-group')`

### `mcp_Cribl_cribl_getSources`

*   **Description**: Retrieves a list of sources for a specific Worker Group/Fleet.
*   **Parameters**:
    *   `groupName` (Optional, `string`): The name of the Worker Group/Fleet. If omitted, defaults to the sole Stream group if only one exists.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_getSources(groupName='my-edge-fleet')`

### `mcp_Cribl_cribl_getPipelineConfig`

*   **Description**: Gets the detailed configuration for a specific pipeline.
*   **Parameters**:
    *   `pipelineId` (Required, `string`): The ID of the pipeline (e.g., `passthru`, `main`).
    *   `groupName` (Optional, `string`): The name of the Worker Group/Fleet. If omitted, defaults to the sole Stream group if only one exists.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_getPipelineConfig(pipelineId='main', groupName='my-stream-group')`

### `mcp_Cribl_cribl_setPipelineConfig`

*   **Description**: Updates the configuration for a specific pipeline.
*   **Parameters**:
    *   `pipelineId` (Required, `string`): The ID of the pipeline to configure.
    *   `config` (Required, `object`): The pipeline configuration payload expected by the Cribl API, typically structured as `{ id: 'pipeline-id', conf: { ... actual config ... } }`.
    *   `groupName` (Optional, `string`): The name of the Worker Group/Fleet. If omitted, defaults to the sole Stream group if only one exists.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_setPipelineConfig(pipelineId='devnull', config={...}, groupName='my-stream-group')`

### `mcp_Cribl_cribl_restartWorkerGroup`

*   **Description**: Restarts the workers within a specific Worker Group/Fleet.
*   **Parameters**: None. This tool does not require any arguments.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_restartWorkerGroup()`

### `mcp_Cribl_cribl_getSystemMetrics`

*   **Description**: Retrieves system metrics from the Cribl deployment. 
    *   **Important**: To avoid excessively large responses, please use the optional parameters (`filterExpr`, `metricNameFilter`, `earliest`, `latest`, `numBuckets`, `wp`) to narrow down your query whenever possible. 
    *   If no parameters are provided, the server will default to fetching only the most recent data bucket (`buckets=1`) to prevent performance issues.
*   **Parameters**:
    *   `filterExpr` (Optional, `string`): A JS expression to filter metrics (e.g., `"model.pipeline === 'test'"` or `"host == 'myhost'"`). 
    *   `metricNameFilter` (Optional, `string`): Regex or array of metric names (e.g.,limit to `"pipe.*"` , `"total.in_bytes"`, or `"os.cpu.perc,os.mem.*"`).
    *   `earliest` (Optional, `string`): Start time for the query (e.g., `'-15m'`, `'2023-10-26T10:00:00Z'`).
    *   `latest` (Optional, `string`): End time for the query (e.g., `'now'`, `'2023-10-26T10:15:00Z'`).
    *   `numBuckets` (Optional, `number`): The number of time buckets for aggregation.
    *   `wp` (Optional, `string`): Worker process filter.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_getSystemMetrics(metricNameFilter='os.cpu.*', earliest='-5m')`

### `mcp_Cribl_cribl_versionControl`
*   **Description**: Detects if version control (git) is enabled on the Cribl instance and whether a remote repository URL is configured. Use this to chekc whether committing and deploying is needed.
*   **Parameters**: None.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_versionControl()`

### `mcp_Cribl_cribl_commitPipeline`
*   **Description**: Commits staged configuration changes to version control. Use the commit ID returned to deploy the changes.
*   **Parameters**:
    *   `message` (Required, string): Commit message describing the changes.
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_commitPipeline(message='Initial pipeline commit')`

### `mcp_Cribl_cribl_deployPipeline`
*   **Description**: Deploys a specific committed configuration version to a Worker Group and returns the list of resulting ConfigGroup objects from Cribl.
*   **Parameters**:
    *   `groupName` (Optional, string): The name of the Worker Group/Fleet. If omitted, defaults to the sole Stream group if only one exists.
    *   `version` (Required, string): The commit ID to deploy (e.g., `7e1e260d...`).
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_deployPipeline(groupName='default', version='7e1e260d7910f3e24ec1074a4df866e783cddf03')` 