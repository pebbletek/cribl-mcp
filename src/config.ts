import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine the correct path to the .env file relative to the project root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Whether running from src or dist, the project root is one level up.
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '.env');

console.log(`[config.ts] Project Root calculated as: ${projectRoot}`);
console.log(`[config.ts] Attempting to load .env file from: ${envPath}`);

dotenv.config({ path: envPath });

function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        console.error(`FATAL: Environment variable ${key} is not set. Looked for .env at ${envPath}. Check your .env file exists in the project root (${projectRoot}) and the variable is defined.`);
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
}

// Define parts separately
const criblConfig = {
    baseUrl: getEnvVariable('CRIBL_BASE_URL'),
    authToken: getEnvVariable('CRIBL_AUTH_TOKEN'),
};

const serverConfig = {
    name: 'cribl-mcp-bridge',
    version: '0.1.0',
};

// Export the combined object
export const config = {
    cribl: criblConfig,
    server: serverConfig,
};

// Add a log to confirm config creation within the module itself
console.log('[config.ts] Config object created successfully.');
// Avoid logging the full config which includes the auth token
console.log(`[config.ts] Cribl URL: ${config.cribl.baseUrl}`);
console.log(`[config.ts] Server Name: ${config.server.name}, Version: ${config.server.version}`); 