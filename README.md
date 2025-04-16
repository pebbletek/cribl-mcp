# Cribl MCP Server

A Model Context Protocol (MCP) server that enables AI interactions with the Cribl API.

This server allows AI clients to discover and invoke data operations from a Cribl deployment, using standardised MCP tooling.

**For detailed documentation, please see the [`docs/`](./docs/) directory. Here's a breakdown of the documentation files:**

*   `README.md` (this file): Provides the highest-level introduction, quick start instructions, very basic examples, and links to the docs directory.
*   [`docs/configuration.md`](./docs/configuration.md): Focuses specifically on the environment variables needed for configuration and explains the authentication modes. It's purely about setup.
*   [`docs/usage.md`](./docs/usage.md): Focuses on how to run the server (via npx or local development commands) and how to configure an MCP client to connect to it. It provides conceptual examples of invoking the tools.
*   [`docs/overview.md`](./docs/overview.md): Sits between the README and the specific config/usage docs. It details what the server offers in terms of authentication and, most importantly, provides a detailed reference guide to the available tools and their specific parameters/outputs, and future tools.

## Getting Started

You can either install and run locally, or execute instantly via `npx`. `npx` saves you installing Git, dependencies, or any build tools. Both scenarios require you to have node later than version 16 installed:

### Prerequisites

To run this server ensure the following:

- **Node.js** is installed (version 16 or later recommended)
- **Internet access** is available (to fetch the MCP server package from npm)

You can install Node.js from [https://nodejs.org](https://nodejs.org).

To verify your setup:
```bash
node -v
npx -v
```

### Quick Start with `npx`

```bash
CRIBL_BASE_URL=https://your.cribl.cloud.instance CRIBL_AUTH_TYPE=cloud CRIBL_CLIENT_ID=abc123 CRIBL_CLIENT_SECRET=secret npx @pebbletek/cribl-mcp
```

**Note:** Running `npx` requires essential environment variables (like `CRIBL_BASE_URL` and authentication details) to be set either in your environment or passed directly on the command line for the server to connect successfully.

See [`docs/usage.md`](./docs/usage.md) for advanced `npx` usage configuration, including relevant JSON for your MCP client, and required variables.

### Local Development

1.  Browse to a high-level folder where you'll store the code base (cloning will create the containing folder). Clone the repo:
    ```bash
    git clone https://github.com/pebbletek/cribl-mcp.git
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
4. See usage.md > Local Development for running, building and starting the mcp server

See [`docs/configuration.md`](./docs/configuration.md) for details on environment variables and authentication, and [`docs/usage.md`](./docs/usage.md) for running the server.

## Available Tools

This server provides tools to interact with Cribl, including:

*   Listing Worker Groups/Fleets
*   Getting/Setting Pipeline configurations
*   Getting Source configurations
*   Restarting Worker Groups

For a detailed list and usage instructions, see [`docs/usage.md`](./docs/usage.md).

## Example Usage (Prompts)

Once connected via an MCP client (like [Claude Desktop](https://claude.ai/download)), you can interact with your Cribl instance using natural language prompts that leverage the available tools. Here are some examples:

*   Prompt: `what sources are we ingesting?`  
(you will need to allow the MCP client access to the tool)
    *   Response will be something like:  
    "To answer your question about ingested sources, let me check the available data sources in your Cribl Stream environment.  
    _<View result from cribl_getSources from Cribl (local)>_    

        Let me also check what pipelines are configured in your Cribl Stream environment:  
        _<View result from cribl_getPipelines from Cribl (local)>_
        
        Based on the information I've retrieved from your Cribl Stream environment, here are the sources you are ingesting:  
        **Active Data Sources**  
        Your Cribl Stream instance has several configured data sources, with the following notable ones:  
        1. **HTTP/HTTPS Sources:**  
            HTTP source (port 10080)  
            Cribl HTTP (port 10200)  
            Splunk HEC (port 8088)... 
        2. <etc.>
            
        **Pipeline Configurations**  
        Your environment also has several pipelines configured for processing specific data types:

        1. Cisco ASA events - Filters and samples Cisco ASA security logs
        2. Cisco eStreamer data - Processes Cisco eStreamer data
        3. Palo Alto traffic events - Filters and samples Palo Alto traffic logs
        4. Windows Event Logs - Processes Windows security event logs

        These pipelines suggest you're ingesting network security logs from Cisco ASA firewalls, Cisco eStreamer (likely from Firepower/FTD devices), Palo Alto Networks firewalls, and Windows security events.  
        Would you like more detailed information about any specific source or pipeline configuration?"
*  Prompt: `what functions are processing the palo alto traffic?`
    *   Response:  
        "Let me examine the functions that are processing the Palo Alto traffic in more detail:  
        _<View result from cribl_getPipelineConfig from Cribl (local)>_

        Here's a detailed breakdown of how the Palo Alto traffic data is being processed in your Cribl Stream environment:  
        **Palo Alto Traffic Pipeline Functions**  
        **1. Initial Filter (Eval):**
        *   Filter: sourcetype!='pan:traffic'
        *   Description: Short-circuits (skips) all events that are NOT of sourcetype 'pan'
        *   This is set as a final function, meaning if the condition is true, processing stops for that event

        **2. Field Extraction (Regex Extract):**
        *    Extracts several key fields from the raw event using regex pattern matching:  
             *   __log_subtype: Identifies if the log is a start/end record  
             *   __src_zone and __dest_zone: Source and destination security zones
             *   __transport: Transport protocol
             *   __action: Action taken (allow, deny, etc.)
             *   __bytes_in: Bytes received

        **3. Filtering Events (Drop):**
        *   Filter: __log_subtype=='start'
        *   Description: Drops all events with log subtype of 'start'
        *   Rationale (from comment): "Drop events of log_subtype=start as they often have incorrect app assignment. Log_subtype=end contain better information."  
        *   etc."

*   Prompt: `please update the pipeline to include start events as well as end events.`
    *   Response:  
    "I'll update the Palo Alto traffic pipeline to include both "start" and "end" events by modifying the configuration. Let me make this change for you:  
    _<View result from cribl_getPipelineConfig from Cribl (local)>_

        Now I'll update the pipeline configuration to keep both "start" and "end" events by disabling the drop function and updating the comments:  
        _<View result from cribl_setPipelineConfig from Cribl (local)>_

        Now let's restart the worker group to apply these changes:
        _<View result from cribl_restartWorkerGroup from Cribl (local)>_

        The Palo Alto traffic pipeline has been successfully updated to include both "start" and "end" events. Here's what I modified:

        1. Disabled the Drop Function:

            *   The function that was filtering out __log_subtype=='start' events has been disabled
            *   This means both "start" and "end" session events will now be processed


        2. Updated the Comment:

            *   Changed the comment from explaining why "start" events were being dropped to noting that both event types are now being kept for complete traffic visibility


        3. Restarted the Worker Group:

            *   Applied the changes by restarting the Cribl Stream worker group



        The updated pipeline will now process both "start" and "end" events from your Palo Alto firewalls, giving you complete visibility into traffic sessions from initiation through completion. All other processing functions remain in place, including:

        *   Field extraction for key traffic attributes
        *   Sampling for zero-byte traffic and trusted zone traffic
        *   Removal of unreliable date fields

        Your Palo Alto traffic data will now include the complete lifecycle of network connections while still maintaining the efficiency benefits of the sampling rules."


## License

MIT

