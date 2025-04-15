# Cribl MCP Server

A Model Context Protocol (MCP) server that enables AI interactions with the Cribl API.

This server allows AI clients to discover and invoke data operations from a Cribl deployment, using standardised MCP tooling.

**For detailed documentation on configuration, usage, and available tools, please see the [`docs/`](./docs/) directory.**

## Getting Started

You can either install and run locally, or execute instantly via `npx`:

### Quick Start with `npx`

```bash
npx @pebble/cribl-mcp
```

**Note:** Running `npx` requires essential environment variables (like `CRIBL_BASE_URL` and authentication details) to be set either in your environment or passed directly on the command line for the server to connect successfully.

See [`docs/usage.md`](./docs/usage.md) for advanced `npx` usage including configuring for your MCP client, and required variables.

### Local Development

1.  Clone the repo:
    ```bash
    git clone https://github.com/yourorg/cribl-mcp.git # Replace with your repo URL
    cd cribl-mcp
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Copy the `.env.example` file and populate the required values:
    ```bash
    cp .env.example .env
    ```

See [`docs/configuration.md`](./docs/configuration.md) for details on environment variables and authentication, and [`docs/usage.md`](./docs/usage.md) for running the server.

## Available Tools

This server provides tools to interact with Cribl, including:

*   Listing Worker Groups/Fleets
*   Getting/Setting Pipeline configurations
*   Getting Source configurations
*   Restarting Worker Groups

For a detailed list and usage instructions, see [`docs/usage.md`](./docs/usage.md).

## Example Usage (Prompts)

Once connected via an MCP client (like Cursor), you can interact with your Cribl instance using natural language prompts that leverage the available tools. Here are some examples:

*   "List all the worker groups for the 'edge' product." (`-> mcp_Cribl_cribl_listWorkerGroups(productType='edge')`)
*   "Show me the pipelines in the 'default' group." (`-> mcp_Cribl_cribl_getPipelines(groupName='default')`)
*   "Get the configuration for the 'main' pipeline in the 'stream-group'." (`-> mcp_Cribl_cribl_getPipelineConfig(pipelineId='main', groupName='stream-group')`)
*   "What sources are configured in the 'prod-edge' fleet?" (`-> mcp_Cribl_cribl_getSources(groupName='prod-edge')`)
*   "Restart the default worker group." (`-> mcp_Cribl_cribl_restartWorkerGroup(random_string='restart')`)

## License

MIT

