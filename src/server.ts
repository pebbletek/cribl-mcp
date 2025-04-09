import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z, ZodRawShape } from 'zod';
import { config } from './config.js';
import {
    getPipelines,
    getSources,
    setPipelineConfig,
    restartWorkerGroup
} from './api/criblClient.js';

// Validate config on startup (errors are logged to stderr in config.ts)
try {
    config.cribl.baseUrl;
    config.cribl.authToken;
} catch (error) {
    process.exit(1);
}

const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
});

// --- Tool Definitions ---

// Helper type for validated args based on Zod schema shape
type ValidatedArgs<T extends ZodRawShape> = z.infer<z.ZodObject<T>>;

server.tool(
    'cribl_getPipelines',
    // No arguments, provide empty schema object
    {},
    async () => { // No args or extra needed
        const result = await getPipelines();
        if (!result.success) {
            console.error('[Tool Error] cribl_getPipelines:', result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error fetching pipelines: ${result.error}` }],
            };
        }
        return {
            content: [{ type: 'text', text: JSON.stringify(result.data || [], null, 2) }],
        };
    }
);

server.tool(
    'cribl_getSources',
    // No arguments, provide empty schema object
    {},
    async () => { // No args or extra needed
        const result = await getSources();
        if (!result.success) {
            console.error('[Tool Error] cribl_getSources:', result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error fetching sources: ${result.error}` }],
            };
        }
        return {
            content: [{ type: 'text', text: JSON.stringify(result.data || [], null, 2) }],
        };
    }
);

const SetPipelineConfigArgsShape = {
    pipelineId: z.string().describe('The ID of the pipeline to configure.'),
    config: z.any().describe('The new configuration object for the pipeline.'),
};

server.tool(
    'cribl_setPipelineConfig',
    // Pass the schema shape
    SetPipelineConfigArgsShape,
    async (args: ValidatedArgs<typeof SetPipelineConfigArgsShape>) => { // Only validated args are needed
        // Args are validated and passed as the first parameter
        const { pipelineId, config: pipelineConfig } = args;

        const result = await setPipelineConfig(pipelineId, pipelineConfig);

        if (!result.success) {
            console.error('[Tool Error] cribl_setPipelineConfig:', result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error setting pipeline config for ${pipelineId}: ${result.error}` }],
            };
        }

        return {
            content: [{ type: 'text', text: `Successfully updated config for pipeline ${pipelineId}. Response: ${JSON.stringify(result.data, null, 2)}` }],
        };
    }
);

const RestartWorkerGroupArgsShape = {
    group: z.string().default('default').describe('The name of the worker group to restart.'),
};

server.tool(
    'cribl_restartWorkerGroup',
    // Pass the schema shape
    RestartWorkerGroupArgsShape,
    async (args: ValidatedArgs<typeof RestartWorkerGroupArgsShape>) => { // Only validated args are needed
        // Args are validated and passed as the first parameter
        const { group } = args;

        const result = await restartWorkerGroup(group);

        if (!result.success) {
            console.error('[Tool Error] cribl_restartWorkerGroup:', result.error);
            return {
                isError: true,
                content: [{ type: 'text', text: `Error restarting worker group ${group}: ${result.error}` }],
            };
        }

        return {
            content: [{ type: 'text', text: result.data?.message || `Successfully initiated restart for group ${group}.` }],
        };
    }
);

// --- Server Connection ---

async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('MCP Server is connected and listening via stdio.');
    } catch (error) {
        console.error('Failed to connect MCP server:', error);
        process.exit(1);
    }
}

main(); 