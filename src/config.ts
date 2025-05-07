import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Determine the correct path to the .env file relative to the project root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Determine how to load .env: support override via MCP_DOTENV_PATH or fallback to default search
const dotenvPath = process.env.MCP_DOTENV_PATH;
if (dotenvPath) {
  console.error(`[config.ts Debug] Attempting to load .env from MCP_DOTENV_PATH: ${dotenvPath}`);
  dotenv.config({ path: dotenvPath });
} else {
  console.error(`[config.ts Debug] MCP_DOTENV_PATH not set. Looking for .env in CWD: ${process.cwd()} and its parent directories`);
  dotenv.config();
}

// Allow reading package.json
const requirePkg = createRequire(import.meta.url);
const pkg = requirePkg('../package.json');

// --- Helper Functions ---
function getEnvVariable(key: string, required = true): string | undefined {
    const value = process.env[key];
    if (!value && required) {
        const locationChecked = dotenvPath
            ? `the path specified by MCP_DOTENV_PATH (${dotenvPath})`
            : `the current directory (${process.cwd()}) or its parent directories`;
        const errorMsg = `FATAL: Required environment variable ${key} is not set. Check your .env file exists in ${locationChecked} and the variable is defined.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    return value;
}

function validateAuthType(type: string | undefined): 'cloud' | 'local' {
    if (type === 'cloud' || type === 'local') {
        return type;
    }
    const errorMsg = `FATAL: Invalid CRIBL_AUTH_TYPE specified in .env. Must be 'cloud' or 'local'. Found: ${type}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
}

// --- Configuration Object --- 
interface CriblCloudAuthConfig {
    type: 'cloud';
    clientId: string;
    clientSecret: string;
    authUrl: string;
}

interface CriblLocalAuthConfig {
    type: 'local';
    username: string;
    password: string;
}

interface Config {
    cribl: {
        baseUrl: string;
        auth: CriblCloudAuthConfig | CriblLocalAuthConfig;
    };
    server: {
        name: string;
        version: string;
    };
}

function loadConfig(): Config {
    const authType = validateAuthType(getEnvVariable('CRIBL_AUTH_TYPE'));
    const baseUrl = getEnvVariable('CRIBL_BASE_URL')!;

    let authConfig: CriblCloudAuthConfig | CriblLocalAuthConfig;

    if (authType === 'cloud') {
        authConfig = {
            type: 'cloud',
            clientId: getEnvVariable('CRIBL_CLIENT_ID')!,
            clientSecret: getEnvVariable('CRIBL_CLIENT_SECRET')!,
            authUrl: getEnvVariable('CRIBL_CLOUD_AUTH_URL', false) || 'https://login.cribl.cloud',
        };
    } else { // authType === 'local'
        authConfig = {
            type: 'local',
            username: getEnvVariable('CRIBL_USERNAME')!,
            password: getEnvVariable('CRIBL_PASSWORD')!,
        };
    }

    const serverConfig = {
        name: 'cribl',
        version: pkg.version,
    };

    console.error(`[config.ts] Loaded config: AuthType=${authType}, BaseURL=${baseUrl}`); // Log basic info to stderr

    return {
        cribl: {
            baseUrl: baseUrl,
            auth: authConfig,
        },
        server: serverConfig,
    };
}

// Load and export the configuration
export const config = loadConfig();

// Remove startup logs from config module
// console.log('[config.ts] Config object created successfully.');
// console.log(`[config.ts] Cribl URL: ${config.cribl.baseUrl}`);
// console.log(`[config.ts] Server Name: ${config.server.name}, Version: ${config.server.version}`); 