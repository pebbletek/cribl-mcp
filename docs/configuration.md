# Configuration

This document details the configuration options for the Cribl MCP server, primarily managed through environment variables.

See [`overview.md`](./overview.md) for an overview of the server's capabilities and tool details.
See [`usage.md`](./usage.md) for how to run the server using these configurations.

## Environment Variables

Create a `.env` file in the project root (by copying `.env.example`) and populate the following variables based on your Cribl deployment and chosen authentication method.

### Required

*   `CRIBL_BASE_URL`: The base URL of your Cribl API deployment (e.g., `https://your-instance.cribl.cloud` or `https://leader-hostname:9000`).
*   `CRIBL_AUTH_TYPE`: The authentication mode to use. Must be either `cloud` or `local`.

### Authentication Specific

**If `CRIBL_AUTH_TYPE=cloud`:**

*   `CRIBL_CLIENT_ID`: Your Cribl.Cloud Organization Client ID for API access.
*   `CRIBL_CLIENT_SECRET`: Your Cribl.Cloud Organization Client Secret for API access.

**If `CRIBL_AUTH_TYPE=local`:**

*   `CRIBL_USERNAME`: The username for a local Cribl user with API access permissions.
*   `CRIBL_PASSWORD`: The password for the specified local Cribl user.

## Authentication Modes

*   **`cloud`**: Uses Client ID and Client Secret credentials, typically for Cribl.Cloud deployments. The server will automatically handle fetching and refreshing bearer tokens.
*   **`local`**: Uses Username and Password credentials, typically for self-hosted Cribl Stream/Edge deployments. The server will automatically handle fetching and refreshing login tokens.

## Example `.env` File

```dotenv
# Base URL for Cribl API
CRIBL_BASE_URL=https://<your-instance>.cribl.cloud

# Choose authentication type: 'cloud' or 'local'
CRIBL_AUTH_TYPE=cloud

# Cloud Auth Credentials (only needed if CRIBL_AUTH_TYPE=cloud)
CRIBL_CLIENT_ID=your_client_id
CRIBL_CLIENT_SECRET=your_client_secret

# Local Auth Credentials (only needed if CRIBL_AUTH_TYPE=local)
CRIBL_USERNAME=
CRIBL_PASSWORD=
```

### Optional: MCP_DOTENV_PATH (custom `.env` location)

In some workflows—especially when your MCP server is launched **by** a desktop client (Claude, Cursor, AnythingLLM, etc.)—it is convenient to keep your sensitive credentials in a separate file and simply _point_ the server at it.

Set the environment variable `MCP_DOTENV_PATH` to the absolute path of the desired file and the Model‑Context‑Protocol SDK will load **that** file first, _before_ our own configuration code runs.  There are two common ways to do this:

1.  **Inside an MCP client config** (recommended)
    ```jsonc
    {
      "mcpServers": {
        "cribl": {
          "command": "npx",
          "args": ["@pebbletek/cribl-mcp"],
          "env": {
            "MCP_DOTENV_PATH": "/full/path/to/cribl.env"
          }
        }
      }
    }
    ```
2.  **Via your shell** (if you run the server manually)
    ```bash
    MCP_DOTENV_PATH=/full/path/to/cribl.env npx @pebbletek/cribl-mcp
    # OR, in *sh* shells
    export MCP_DOTENV_PATH=/full/path/to/cribl.env
    npm run dev
    ```

If `MCP_DOTENV_PATH` is **not** set, the server falls back to loading a `.env` file from the project root (as described above). 