# Usage

This document explains how to run the Cribl MCP server, connect clients, and use the available tools.

## Running the Server

Ensure you have configured your environment variables as described in [`configuration.md`](./configuration.md).

### Using `npx` (Recommended for Quick Use)

The easiest way to run the server without cloning is using `npx`:

```bash
npx @pebble/cribl-mcp
```

To provide environment variables directly:

```bash
# Example for Cloud Auth
CRIBL_BASE_URL=https://your.cribl.instance CRIBL_AUTH_TYPE=cloud \
CRIBL_CLIENT_ID=abc123 CRIBL_CLIENT_SECRET=secret npx @pebble/cribl-mcp

# Example for Local Auth
CRIBL_BASE_URL=https://leader:9000 CRIBL_AUTH_TYPE=local \
CRIBL_USERNAME=admin CRIBL_PASSWORD=secret npx @pebble/cribl-mcp
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

By default, the server runs in standard input/output (stdio) mode, suitable for MCP clients that manage the process directly.

## Connecting an MCP Client

This server follows the Model Context Protocol and communicates over stdio by default. Use a compatible MCP client tool (like Cursor, Claude Desktop, or MCP Inspector) to connect.

Configure your client to execute the server. Here's an example configuration snippet for a generic MCP client (adjust based on your specific client's format):

```json
{
  "cribl": {
    // Command to run the server
    "command": "npx", 
    "args": ["@pebble/cribl-mcp"],
    // Or use local command: "command": "npm", "args": ["run", "start"]
    
    // Environment variables passed to the server process
    "env": {
      "CRIBL_BASE_URL": "https://your.cribl.instance",
      "CRIBL_AUTH_TYPE": "cloud", // or "local"
      "CRIBL_CLIENT_ID": "your_client_id", // if cloud
      "CRIBL_CLIENT_SECRET": "your_client_secret", // if cloud
      "CRIBL_USERNAME": "your_username", // if local
      "CRIBL_PASSWORD": "your_password", // if local
      "FASTMCP_LOG_LEVEL": "INFO" // Optional
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

*   **Description**: Restarts the workers within a specific Worker Group/Fleet. *Note: This tool currently takes a dummy parameter due to FastMCP requirements for no-parameter tools.*
*   **Parameters**:
    *   `random_string` (Required, `string`): A dummy string parameter. Its value does not matter.
    *   *Implicit Context*: The restart applies to the default Worker Group/Fleet determined by the client library (needs clarification if it should take `groupName`).
*   **Example Invocation (Conceptual)**: `mcp_Cribl_cribl_restartWorkerGroup(random_string='abc')` 