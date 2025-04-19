#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z, ZodRawShape } from 'zod';
import { config } from './config.js';
import {
    getPipelines,
    getSources,
    setPipelineConfig,
    getPipelineConfig,
    listWorkerGroups,
    restartWorkerGroup,
    getSystemMetrics
} from './api/criblClient.js';

// Validate config on startup (errors are logged to stderr in config.ts)
try {
    config.cribl.baseUrl; // Check if base URL loaded
    // config.cribl.authToken; // Removed - authToken is no longer static config
    // Removed log: console.log('Configuration loaded successfully.');
} catch (error) {
    // Error is already logged to stderr in config.ts
    // console.error('FATAL: Configuration error:', error); // Redundant
    process.exit(1);
}

const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
});

// --- Tool Definitions ---

// Helper type for validated args based on Zod schema shape
type ValidatedArgs<T extends ZodRawShape> = z.infer<z.ZodObject<T>>;

// Helper function for group name resolution
async function resolveGroupName(providedGroupName: string | undefined, defaultProductType: 'stream' | 'edge' | 'search' = 'stream'): Promise<{ groupName?: string; error?: string }> {
    const listResult = await listWorkerGroups(); // Get all groups first for validation
    if (!listResult.success || !listResult.data) {
        const errorMsg = `Failed to list worker groups: ${listResult.error || 'Unknown error'}`;
        console.error(`[stderr] ${errorMsg}`);
        return { error: errorMsg };
    }
    const allGroups = listResult.data;
    const allGroupIds = allGroups.map(g => g.id);

    if (providedGroupName) {
        // Validate provided group name against *all* fetched groups
        if (!allGroupIds.includes(providedGroupName)) {
            const errorMsg = `Worker group '${providedGroupName}' not found. Available groups are: [${allGroupIds.join(', ')}]`;
            console.error(`[stderr] Error: ${errorMsg}`);
            return { error: errorMsg };
        }
        // Provided name is valid
        console.error(`[stderr] Using provided valid group name: ${providedGroupName}`);
        return { groupName: providedGroupName };
    }

    // No group name provided, try to find a default based on productType
    console.error(`[stderr] Group name not provided, attempting lookup for default product '${defaultProductType}'...`);
    const filteredGroups = allGroups.filter(group => {
         if (defaultProductType === 'stream') return !group.isFleet && !group.isSearch;
         if (defaultProductType === 'edge') return group.isFleet === true;
         if (defaultProductType === 'search') return group.isSearch === true;
         return false;
    });

    if (filteredGroups.length === 1) {
        const resolvedName = filteredGroups[0].id;
        console.error(`[stderr] Found single worker group for product '${defaultProductType}': ${resolvedName}, using it as default.`);
        return { groupName: resolvedName };
    } else if (filteredGroups.length === 0) {
         // Provide list of *all* groups if the default type isn't found
         const errorMsg = `No worker groups found for default product type '${defaultProductType}'. Please specify a groupName. Available groups are: [${allGroupIds.join(', ')}]`; 
         console.error(`[stderr] Error: ${errorMsg}`);
         return { error: errorMsg };
    } else {
        const filteredGroupIds = filteredGroups.map(g => g.id);
        // Provide list of groups matching the default type when ambiguous
        const errorMsg = `Multiple worker groups found for default product type '${defaultProductType}': [${filteredGroupIds.join(', ')}]. Please specify the 'groupName' argument.`; 
        console.error(`[stderr] Error: ${errorMsg}`);
        return { error: errorMsg };
    }
}

// Define schema for listWorkerGroups arguments
const ListWorkerGroupsArgsShape = {
    productType: z.enum(['stream', 'edge', 'search', 'all']).optional().default('stream')
        .describe('Filter groups by product type (stream, edge, search, all). Defaults to stream.'),
};

server.tool(
    'cribl_listWorkerGroups',
    'Lists available worker groups in the Cribl deployment, optionally filtered by product type (stream, edge, search, or all).',
    ListWorkerGroupsArgsShape,
    async (args: ValidatedArgs<typeof ListWorkerGroupsArgsShape>) => {
        const { productType } = args;
        console.error(`[Tool Call] cribl_listWorkerGroups (Filtering for: ${productType})`);
        const result = await listWorkerGroups();

        if (!result.success || !result.data) {
            console.error('[Tool Error] cribl_listWorkerGroups:', result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error listing worker groups: ${result.error || 'Unknown error'}` }],
            };
        }

        // Filter based on productType, skip if 'all'
        const groupsToReturn = productType === 'all' 
            ? result.data 
            : result.data.filter(group => {
                if (productType === 'stream') return !group.isFleet && !group.isSearch;
                if (productType === 'edge') return group.isFleet === true;
                if (productType === 'search') return group.isSearch === true;
                return false; // Should not happen
             });

        console.error(`[Tool Success] cribl_listWorkerGroups: Found ${groupsToReturn.length} groups matching filter '${productType}'.`);
        return {
            content: [{ type: 'text', text: JSON.stringify(groupsToReturn, null, 2) }],
        };
    }
);

// Define schema for getPipelines arguments (groupName optional)
const GetPipelinesArgsShape = {
    groupName: z.string().optional().describe("Optional: The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group."),
};

server.tool(
    'cribl_getPipelines',
    'Fetches pipeline definitions in a specified worker group.',
    GetPipelinesArgsShape,
    async (args: ValidatedArgs<typeof GetPipelinesArgsShape>) => {
        console.error(`[Tool Call] cribl_getPipelines with args:`, args);
        const groupResolution = await resolveGroupName(args.groupName);
        if (groupResolution.error || !groupResolution.groupName) {
            return { isError: true, content: [{ type: 'text', text: groupResolution.error || 'Could not determine group name.' }] };
        }
        const groupName = groupResolution.groupName;

        const result = await getPipelines(groupName);
        if (!result.success) {
            console.error(`[Tool Error] cribl_getPipelines (Group: ${groupName}):`, result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error fetching pipelines for group ${groupName}: ${result.error}` }],
            };
        }
        console.error(`[Tool Success] cribl_getPipelines (Group: ${groupName}): Found ${result.data?.length || 0} pipelines.`);
        return {
            content: [{ type: 'text', text: JSON.stringify(result.data || [], null, 2) }],
        };
    }
);

// Define schema for getSources arguments (groupName optional)
const GetSourcesArgsShape = {
    groupName: z.string().optional().describe("Optional: The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group."),
};

server.tool(
    'cribl_getSources',
    'Fetches source configurations in a specified worker group.',
    GetSourcesArgsShape,
    async (args: ValidatedArgs<typeof GetSourcesArgsShape>) => { 
        console.error(`[Tool Call] cribl_getSources with args:`, args);
        const groupResolution = await resolveGroupName(args.groupName);
        if (groupResolution.error || !groupResolution.groupName) {
            return { isError: true, content: [{ type: 'text', text: groupResolution.error || 'Could not determine group name.' }] };
        }
        const groupName = groupResolution.groupName;

        const result = await getSources(groupName);
        if (!result.success) {
            console.error(`[Tool Error] cribl_getSources (Group: ${groupName}):`, result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error fetching sources for group ${groupName}: ${result.error}` }],
            };
        }
        console.error(`[Tool Success] cribl_getSources (Group: ${groupName}): Found ${result.data?.length || 0} sources.`);
        return {
            content: [{ type: 'text', text: JSON.stringify(result.data || [], null, 2) }],
        };
    }
);

// Define schema for getPipelineConfig arguments (groupName optional)
const GetPipelineConfigArgsShape = {
    groupName: z.string().optional().describe("Optional: The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group."),
    pipelineId: z.string().describe('The ID of the pipeline to retrieve configuration for.'),
};

server.tool(
    'cribl_getPipelineConfig',
    'Retrieves full configuration JSON for a specified pipeline in a worker group.',
    GetPipelineConfigArgsShape,
    async (args: ValidatedArgs<typeof GetPipelineConfigArgsShape>) => {
        console.error(`[Tool Call] cribl_getPipelineConfig with args:`, args);
        const groupResolution = await resolveGroupName(args.groupName);
         if (groupResolution.error || !groupResolution.groupName) {
            return { isError: true, content: [{ type: 'text', text: groupResolution.error || 'Could not determine group name.' }] };
        }
        const groupName = groupResolution.groupName;
        const { pipelineId } = args;

        // Input validation for pipelineId itself (prevent empty strings)
        if (!pipelineId || pipelineId.trim().length === 0) {
            // Fetch valid IDs to include in the error message
            const pipelinesListResult = await getPipelines(groupName);
            const validIdsString = pipelinesListResult.success 
                ? `Valid pipeline IDs are: [${pipelinesListResult.data?.map(p => p.id).join(', ') || 'None found'}]`
                : `Failed to retrieve list of valid IDs: ${pipelinesListResult.error}`;
            return {
                isError: true,
                content: [{ type: 'text', text: `Pipeline ID argument is required and cannot be empty. ${validIdsString}` }],
            };
        }

        const result = await getPipelineConfig(groupName, pipelineId);

        if (!result.success) {
            let errorMessage = result.error || 'Unknown error getting pipeline config.';
            // Check if it's the specific 404 Item not found error
            const isNotFoundError = errorMessage.includes('(404)') && 
                                   (errorMessage.toLowerCase().includes('item not found') || 
                                    errorMessage.toLowerCase().includes('not found'));
                                    
            if (isNotFoundError) {
                console.error(`[stderr] Pipeline ID '${pipelineId}' not found in group '${groupName}', fetching valid IDs...`);
                const pipelinesListResult = await getPipelines(groupName);
                if (pipelinesListResult.success) {
                    const validIds = pipelinesListResult.data?.map(p => p.id) || [];
                    errorMessage = `Pipeline ID '${pipelineId}' not found in group '${groupName}'. Valid pipeline IDs are: [${validIds.join(', ') || 'None found'}]`;
                } else {
                    errorMessage = `Pipeline ID '${pipelineId}' not found in group '${groupName}'. Additionally, failed to retrieve list of valid IDs: ${pipelinesListResult.error}`; 
                }
            }
            
            console.error(`[Tool Error] cribl_getPipelineConfig (Group: ${groupName}, ID: ${pipelineId}):`, errorMessage);
            return {
                isError: true,
                content: [{ type: 'text', text: errorMessage }],
            };
        }

        console.error(`[Tool Success] cribl_getPipelineConfig for Group: ${groupName}, ID: ${pipelineId}`);
        return {
            // Return the full pipeline object which includes the config
            content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }], 
        };
    }
);

// Define schema for setPipelineConfig arguments (groupName optional)
const SetPipelineConfigArgsShape = {
    groupName: z.string().optional().describe("Optional: The name of the Worker Group/Fleet. If omitted, defaults to attempting to use Cribl Stream and if only one group exists for Stream, it will use that sole group."),
    pipelineId: z.string().describe('The ID of the pipeline to configure.'),
    config: z.object({}).passthrough().describe("The pipeline configuration payload expected by the API, typically structured as { id: 'pipeline-id', conf: { ... actual config ... } }. Note: 'pipelineId' argument is used for URL, but API might require it in body too."),
};

server.tool(
    'cribl_setPipelineConfig',
    'Applies a new configuration payload to a specified pipeline in a worker group.',
    SetPipelineConfigArgsShape,
    async (args: ValidatedArgs<typeof SetPipelineConfigArgsShape>) => {
        console.error(`[Tool Call] cribl_setPipelineConfig with args:`, args);
        const groupResolution = await resolveGroupName(args.groupName);
         if (groupResolution.error || !groupResolution.groupName) {
            return { isError: true, content: [{ type: 'text', text: groupResolution.error || 'Could not determine group name.' }] };
        }
        const groupName = groupResolution.groupName;

        const { pipelineId, config: pipelineConfig } = args;
        const result = await setPipelineConfig(groupName, pipelineId, pipelineConfig);

        if (!result.success) {
            console.error(`[Tool Error] cribl_setPipelineConfig (Group: ${groupName}, ID: ${pipelineId}):`, result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error setting pipeline config for ${pipelineId} in group ${groupName}: ${result.error}` }],
            };
        }

        console.error(`[Tool Success] cribl_setPipelineConfig for Group: ${groupName}, ID: ${pipelineId}`);
        return {
            content: [{ type: 'text', text: `Successfully updated config for pipeline ${pipelineId} in group ${groupName}. Response: ${JSON.stringify(result.data, null, 2)}` }],
        };
    }
);

// Reintegrate restartWorkerGroup tool definition (no arguments)
const RestartWorkerGroupArgsShape = {}; // No args needed

server.tool(
    'cribl_restartWorkerGroup',
    'Restarts all workers within the default or specified worker group.',
    RestartWorkerGroupArgsShape,
    async () => { // No args needed
        console.error(`[Tool Call] cribl_restartWorkerGroup`);
        const result = await restartWorkerGroup(); // Call client function without groupName
        if (!result.success) {
            console.error(`[Tool Error] cribl_restartWorkerGroup:`, result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error restarting workers: ${result.error}` }],
            };
        }
        console.error(`[Tool Success] cribl_restartWorkerGroup`);
        return {
            content: [{ type: 'text', text: result.data?.message || `Successfully initiated worker restart.` }],
        };
    }
);

// Define schema for getSystemMetrics with optional filtering parameters
const GetSystemMetricsArgsShape = {
    filterExpr: z.string().optional().nullable().describe('Optional: A JS expression to filter metrics (e.g., "model.pipeline === \'test\'" or "host == \'myhost\'").'),
    metricNameFilter: z.string().optional().nullable().describe('Optional: Regex or array of metric names (e.g.,limit to "pipe.*" , "total.in_bytes", or "os.cpu.perc,os.mem.*").'),
    earliest: z.string().optional().nullable().describe('Optional: Start time for the query (e.g., \'-15m\', \'2023-10-26T10:00:00Z\').'),
    latest: z.string().optional().nullable().describe('Optional: End time for the query (e.g., \'now\', \'2023-10-26T10:15:00Z\').'),
    numBuckets: z.number().int().optional().nullable().describe('Optional: The number of time buckets for aggregation.'),
    wp: z.string().optional().nullable().describe('Optional: Worker process filter.'),
}

server.tool(
    'cribl_getSystemMetrics',
    'Retrieves system metrics from the Cribl deployment. \nIMPORTANT: To avoid excessively large responses, please use the optional parameters (filterExpr, metricNameFilter, earliest, latest, numBuckets, wp) to narrow down your query whenever possible. \nIf no parameters are provided, the server will default to fetching only the most recent data bucket (numBuckets=1) to prevent performance issues.',
    GetSystemMetricsArgsShape,
    async (args: ValidatedArgs<typeof GetSystemMetricsArgsShape>) => {
        console.error(`[Tool Call] cribl_getSystemMetrics with args:`, args)

        // Pass the validated args to the API client function
        const result = await getSystemMetrics(args)

        if (!result.success || typeof result.data !== 'string') {
            console.error(`[Tool Error] cribl_getSystemMetrics for args ${JSON.stringify(args)}:`, result.error || 'Invalid data received')
            return {
                isError: true,
                content: [{ type: 'text', text: `Error fetching system metrics: ${result.error || 'Unknown error'}` }],
            }
        }

        console.error(`[Tool Success] cribl_getSystemMetrics: Fetched ${result.data.length} characters of metrics for args:`, args)
        return {
            content: [{ type: 'text', text: result.data }],
        }
    }
)

// --- Server Connection ---

async function main() {
    try {
        const transport = new StdioServerTransport();
        // Removed log: console.log('Connecting transport...');
        await server.connect(transport);
        // Use stderr for final confirmation log
        console.error('MCP Server is connected and listening via stdio.');
    } catch (error) {
        console.error('Failed to connect MCP server:', error);
        process.exit(1);
    }
}

main(); 