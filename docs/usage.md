# Usage

This document explains how to run the Cribl MCP server, connect clients, and use the available tools.

See [`overview.md`](./overview.md) for an overview of the server's available tools and capabilities.

Ensure you have configured your environment variables as described in [`configuration.md`](./configuration.md).

By default, the server runs in standard input/output (stdio) mode, suitable for MCP clients that manage the process directly.

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

### Local Development

After cloning the repository and running `npm install`:

1.  **Development Mode (with hot-reloading):**
    ```bash
    npm run dev
    ```
2.  **Production Mode:**
    First, build the project:
    ```bash
    npm run build
    ```
    Then, start the server:
    ```bash
    npm run start
    ```

## Connecting an MCP Client

This server follows the Model Context Protocol and communicates over stdio by default. Use a compatible MCP client tool (like Cursor, Claude Desktop, or MCP Inspector) to connect.

Configure your client to execute the server. Here's an example configuration snippet for a generic MCP client (adjust based on your specific client's format - depending on the client, you most likely will need to remove the commented lines/sections):

```json
{
  "cribl": {
    // Command to run the server
    "command": "npx", 
    "args": ["@pebbletek/cribl-mcp"],
    // Or use local command: "command": "node", "args": ["/dist/server.js"]
    
    // Environment variables passed to the server process
    "env": {
      "CRIBL_BASE_URL": "https://your.cribl.instance",
      "CRIBL_AUTH_TYPE": "cloud", // or "local"
      "CRIBL_CLIENT_ID": "your_client_id", // if cloud
      "CRIBL_CLIENT_SECRET": "your_client_secret", // if cloud
      "CRIBL_USERNAME": "your_username", // if local
      "CRIBL_PASSWORD": "your_password" // if local
    }
  }
}
```

Once connected, the client can discover and invoke the tools listed below.

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