import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config.js';

// Define interfaces for expected API responses (add more detail as needed)
interface CriblApiResponse {
    items: any[]; // Generic placeholder, refine based on actual Cribl responses
    count?: number;
}

interface CriblPipeline {
    id: string;
    // Add other relevant pipeline fields
    config: any;
}

interface CriblSource {
    id: string;
    // Add other relevant source fields
}

interface CriblErrorResponse {
    error?: string; // Optional as sometimes only message is present
    message?: string; // Optional
    // Cribl sometimes uses a different error structure
    status?: string | number;
    text?: string;
}

interface CriblCloudTokenResponse {
    access_token: string;
    scope: string;
    expires_in: number; // Seconds
    token_type: 'Bearer';
}

interface CriblLocalTokenResponse {
    token: string; // Includes "Bearer " prefix from API
}

interface ClientResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Define interface for Worker Group
interface CriblWorkerGroup {
    id: string;
    name?: string;
    description?: string;
    isFleet?: boolean;
    isSearch?: boolean;
    // Add other relevant fields like tags, etc. if needed based on API response
}

// Define more specific response types for version control
interface VersionControlItem {
    versioning: boolean;       // Whether version control is enabled
    remote: string;            // Remote repository URL, if configured
    branch?: string;           // Current branch name
    status?: {                 // Git status information
        staged: any[];         // Staged files information
        unstaged: any[];       // Unstaged changes
        untracked: any[];      // Untracked files
    };
    lastCommit?: {             // Information about the last commit
        id: string;            // Commit hash
        date: string;          // Commit date
        message: string;       // Commit message
        author: string;        // Author of the commit
    };
    [key: string]: any;        // Allow other properties
}

// Define commit response interface
interface CommitResult {
    branch: string;            // Branch name (e.g., "master")
    commit: string;            // Commit ID (hash)
    root: boolean;             // Whether this is a root commit
    summary: {                 // Commit summary information
        added?: number;        // Number of files added
        deleted?: number;      // Number of files deleted
        modified?: number;     // Number of files modified
        [key: string]: any;    // Allow other summary properties
    };
    files: {                   // Information about changed files
        added?: string[];      // Files added in this commit
        deleted?: string[];    // Files deleted in this commit
        modified?: string[];   // Files modified in this commit
        [key: string]: any;    // Allow other file properties
    };
    message?: string;          // Commit message (if available in response)
    [key: string]: any;        // Allow other properties
}

// Define deployment result interface
interface DeploymentResult {
    deployed: boolean;         // Whether deployment was successful
    workerCount?: number;      // Number of workers the deployment was sent to
    started?: string;          // Timestamp when deployment started
    completed?: string;        // Timestamp when deployment completed
    count?: number;            // Number of items affected
    files?: string[];          // List of files deployed
    version?: string;          // Version/commit that was deployed
    groupName?: string;        // Worker group name
    status?: string;           // Status message (e.g., "success", "in-progress", "failed")
    error?: string;            // Error message if deployment failed
    message?: string;          // Additional status message
    [key: string]: any;        // Allow other properties
}

// Insert new ConfigGroup and DeployResponse interfaces below existing interfaces (after CommitResult interface)
interface ConfigGroup {
    id: string;
    name?: string;
    description?: string;
    configVersion?: string;
    workerCount?: number;
    isFleet?: boolean;
    isSearch?: boolean;
    deployingWorkerCount?: number;
    incompatibleWorkerCount?: number;
    tags?: string;
    streamtags?: string[];
    git?: {
        commit?: string;
        localChanges?: number;
        log?: any[];
    };
    // Allow extra fields from API we haven't modelled yet
    [key: string]: any;
}

interface DeployResponse {
    count: number;
    items: ConfigGroup[];
}

// --- Token Management State ---
let accessToken: string | null = null;
let tokenExpiresAt: number = 0; // Store expiry time as timestamp (milliseconds)
let isRefreshingToken: boolean = false;
let tokenRefreshPromise: Promise<void> | null = null;

// --- Axios Instances ---
// Separate instance for auth calls to avoid circular interceptor calls
const authClient: AxiosInstance = axios.create();

// Main API client instance
const apiClient: AxiosInstance = axios.create({
    baseURL: config.cribl.baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: function (status) {
        return status >= 200 && status < 300;
    },
});

// --- Error Handling ---
function handleApiError(error: unknown, context: string): string {
    console.error(`[stderr] Raw error intercepted during ${context}:`, error);
    let errorMessage = `Unknown error occurred during ${context}.`;
    
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>; 
        errorMessage = `API Error during ${context}: ${axiosError.message}`; // Default if no response

        // Add try-catch around the entire response processing block
        try {
            if (axiosError.response) {
                const status = axiosError.response.status;
                const errorData = axiosError.response.data;
                const statusText = axiosError.response.statusText;
                console.error('[stderr] Response status:', status);
                try {
                    console.error('[stderr] Response data:', typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
                } catch { 
                    console.error('[stderr] Response data: (Could not stringify raw data)'); 
                }

                let detail = '';
                // Inner try-catch for detail extraction is good
                try {
                     if (errorData && typeof errorData === 'object') {
                        const data = errorData as CriblErrorResponse;
                        detail = data.message || data.error || data.text || JSON.stringify(data); 
                     } else if (typeof errorData === 'string' && errorData.length > 0) {
                        detail = errorData;
                     } else if (statusText && statusText.length > 0) {
                        detail = statusText;
                     } else {
                        detail = `Status ${status} received with no useful error details in body.`;
                     }
                } catch (parseError) {
                     console.error(`[stderr] Error attempting to parse response body during ${context}:`, parseError);
                     let rawBody = '(Could not get raw body)';
                     try { rawBody = String(errorData); } catch {} 
                     detail = `Status ${status} received but response body parsing failed. Raw body snippet: ${rawBody.substring(0, 100)}`;
                }
                errorMessage = `API Error (${status}) during ${context}: ${detail}`;

            } else if (axiosError.request) {
                errorMessage = `API Error during ${context}: No response received from server.`;
                console.error('[stderr] Request data:', axiosError.request);
            } 
            // else: Use initial errorMessage based on axiosError.message
        } catch (responseProcessingError) {
            // Catch errors occurring *while trying to process* the response object itself
            console.error(`[stderr] CRITICAL: Error processing the Axios response object during ${context}:`, responseProcessingError);
            errorMessage = `API Error during ${context}: Failed to process the error response (${axiosError.message}).`;
        }
        
    } else if (error instanceof Error) {
        errorMessage = `Error during ${context}: ${error.message}`;
        console.error(`[stderr] Non-Axios error during ${context}:`, error);
    } else {
        errorMessage = `Unknown error type during ${context}: ${String(error)}`;
        console.error(`[stderr] Unknown error type during ${context}:`, error);
    }
    
    console.error(`[stderr] Final formatted error message for ${context}: ${errorMessage}`);
    return errorMessage;
}

// --- Token Acquisition Logic ---
async function acquireToken(): Promise<void> {
    console.error('[stderr] Acquiring/Refreshing Cribl API token...');
    try {
        if (config.cribl.auth.type === 'cloud') {
            const response = await authClient.post<CriblCloudTokenResponse>(
                `${config.cribl.auth.authUrl}/oauth/token`, // Use configured auth URL
                {
                    grant_type: 'client_credentials',
                    client_id: config.cribl.auth.clientId,
                    client_secret: config.cribl.auth.clientSecret,
                    audience: 'https://api.cribl.cloud', // Required audience for Cloud
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            accessToken = response.data.access_token;
            // Refresh token 60 seconds before actual expiry
            tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
            console.error(`[stderr] Cloud token acquired. Expires around: ${new Date(tokenExpiresAt).toISOString()}`);

        } else { // config.cribl.auth.type === 'local'
            const response = await authClient.post<CriblLocalTokenResponse>(
                `${config.cribl.baseUrl}/api/v1/auth/login`,
                {
                    username: config.cribl.auth.username,
                    password: config.cribl.auth.password,
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            // Local API includes "Bearer " prefix, store token without it
            accessToken = response.data.token.replace(/^Bearer\s+/, '');
            // Local tokens don't have expiry in response, refresh periodically (e.g., every hour)
            // Or rely on interceptor to refresh on 401
            tokenExpiresAt = Date.now() + (60 * 60 * 1000); // Refresh in 1 hour
            console.error(`[stderr] Local token acquired. Set to refresh around: ${new Date(tokenExpiresAt).toISOString()}`);
        }
    } catch (error) {
        accessToken = null;
        tokenExpiresAt = 0;
        const context = `acquireToken (Type: ${config.cribl.auth.type})`;
        const errorMessage = handleApiError(error, context);
        console.error(`[stderr] FATAL: Failed to acquire Cribl token: ${errorMessage}`);
        // Throw error to prevent subsequent API calls
        throw new Error(`Failed to acquire Cribl token: ${errorMessage}`);
    }
}

// --- Axios Request Interceptor ---
apiClient.interceptors.request.use(
    async (req: InternalAxiosRequestConfig) => {
        const now = Date.now();
        // Check if token is missing or expired (within buffer)
        if (!accessToken || now >= tokenExpiresAt) {
            // Prevent multiple concurrent refresh attempts
            if (!isRefreshingToken) {
                isRefreshingToken = true;
                // Start the refresh process, store the promise
                tokenRefreshPromise = acquireToken().finally(() => {
                    isRefreshingToken = false;
                    tokenRefreshPromise = null; // Clear promise once done
                });
            }
            // Wait for the ongoing refresh to complete
            if (tokenRefreshPromise) {
                try {
                    await tokenRefreshPromise;
                } catch (refreshError) {
                    // If refresh failed, propagate the error to stop the request
                    console.error('[stderr] Token refresh failed, cannot proceed with request.');
                    // Returning Promise.reject cancels the original request
                    return Promise.reject(refreshError);
                }
            }
        }

        // Set the Authorization header if token is available
        if (accessToken) {
            req.headers.Authorization = `Bearer ${accessToken}`;
        } else {
            // Should not happen if acquireToken throws, but good safety check
            console.error('[stderr] Interceptor: No access token available after check/refresh attempt.');
            return Promise.reject(new Error('No valid API token available.'));
        }

        return req;
    },
    (error) => {
        // Handle request configuration errors
        return Promise.reject(error);
    }
);

// --- API Client Functions (Using /api/v1/ prefix) ---

export async function listWorkerGroups(): Promise<ClientResult<CriblWorkerGroup[]>> {
    const context = 'listWorkerGroups';
    // Using /master/groups path as it reportedly worked previously
    const url = '/api/v1/master/groups'; 
    console.error(`[stderr] Attempting API call: GET ${url}`);
    try {
        // Assuming the response structure has an 'items' array
        const response = await apiClient.get<CriblApiResponse>(url); 
        return { success: true, data: response.data.items as CriblWorkerGroup[] };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function getPipelines(groupName: string): Promise<ClientResult<CriblPipeline[]>> {
    const context = `getPipelines (Group: ${groupName})`;
    if (!groupName) {
        return { success: false, error: 'Group name is required for getPipelines.' };
    }
    // Use group-specific path
    const url = `/api/v1/m/${groupName}/pipelines`;
    console.error(`[stderr] Attempting API call: GET ${url}`);
    try {
        const response = await apiClient.get<CriblApiResponse>(url);
        return { success: true, data: response.data.items as CriblPipeline[] };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function getSources(groupName: string): Promise<ClientResult<CriblSource[]>> {
    const context = `getSources (Group: ${groupName})`;
    if (!groupName) {
        // This check might be redundant if called correctly, but good safety
        return { success: false, error: 'Group name is required for getSources.' };
    }
    // Use group-specific path
    const url = `/api/v1/m/${groupName}/system/inputs`;
    console.error(`[stderr] Attempting API call: GET ${url}`);
    try {
        const response = await apiClient.get<CriblApiResponse>(url);
        // Assuming the response structure still has an 'items' array for inputs
        return { success: true, data: response.data.items as CriblSource[] };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function setPipelineConfig(groupName: string, pipelineId: string, pipelineConfig: any): Promise<ClientResult<CriblPipeline>> {
    const context = `setPipelineConfig (Group: ${groupName}, ID: ${pipelineId})`;
    if (!groupName) {
        return { success: false, error: 'Group name is required for setPipelineConfig.' }; 
    }
    if (!pipelineId) {
        return { success: false, error: 'Pipeline ID is required for setPipelineConfig.' };
    }
    const url = `/api/v1/m/${groupName}/pipelines/${pipelineId}`; 
    console.error(`[stderr] Attempting API call: PATCH ${url}`);
    
    try {
        // Sending ONLY the config object as the payload
        console.error(`[stderr] Sending config payload:`, JSON.stringify(pipelineConfig)); 
        const response = await apiClient.patch<CriblPipeline>(url, pipelineConfig); 
        return { success: true, data: response.data };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        // Explicitly log the message being returned
        console.error(`[stderr] Returning error for ${context}: ${errorMessage}`); 
        return { success: false, error: errorMessage };
    }
}

export async function getPipelineConfig(groupName: string, pipelineId: string): Promise<ClientResult<CriblPipeline>> {
    const context = `getPipelineConfig (Group: ${groupName}, ID: ${pipelineId})`;
     if (!groupName) {
        return { success: false, error: 'Group name is required for getPipelineConfig.' }; 
    }
    if (!pipelineId) {
        return { success: false, error: 'Pipeline ID is required for getPipelineConfig.' };
    }
    // Use group-specific path
    const url = `/api/v1/m/${groupName}/pipelines/${pipelineId}`; 
    console.error(`[stderr] Attempting API call: GET ${url}`);
    try {
        // Assuming the response is the full pipeline object, including its config
        const response = await apiClient.get<CriblPipeline>(url);
        return { success: true, data: response.data };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

// Reintegrating restartWorkerGroup
export async function restartWorkerGroup(): Promise<ClientResult<{ message: string }>> { // Removed groupName parameter
    const context = `restartWorkerGroup`;
    // Using documented PATCH /master/workers/restart endpoint (No group scope)
    const url = `/api/v1/master/workers/restart`; 
    console.error(`[stderr] Attempting API call: PATCH ${url} - WARNING: This likely restarts ALL workers managed by the Leader.`);
    
    try {
        const response = await apiClient.patch(url); // Use PATCH, no body usually needed for restart action
        return { success: true, data: { message: `Successfully initiated worker restart. Response status: ${response.status}` } };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function getSystemMetrics(
    params?: {
        filterExpr?: string | null;
        metricNameFilter?: string | null;
        earliest?: string | null;
        latest?: string | null;
        numBuckets?: number | null;
        wp?: string | null;
    }
): Promise<ClientResult<string>> {
    const context = `getSystemMetrics`;
    const url = `/api/v1/system/metrics`;
    console.error(`[stderr] Attempting API call: GET ${url} with params: ${JSON.stringify(params)}`);

    // Prepare query parameters
    const queryParams: Record<string, any> = {};
    if (params?.filterExpr != null) queryParams.filterExpr = params.filterExpr;
    if (params?.metricNameFilter != null) queryParams.metricNameFilter = params.metricNameFilter;
    if (params?.earliest != null) queryParams.earliest = params.earliest;
    if (params?.latest != null) queryParams.latest = params.latest;
    if (params?.wp != null) queryParams.wp = params.wp;

    // Default to 1 bucket if no parameters are provided to limit response size
    const providedParamKeys = Object.keys(params || {}).filter(k => params?.[k as keyof typeof params] !== undefined && params?.[k as keyof typeof params] !== null);
    if (providedParamKeys.length === 0) {
        queryParams.numBuckets = 1;
        console.error(`[stderr] No specific metrics parameters provided, defaulting to numBuckets=1`);
    } else if (params?.numBuckets != null) {
        queryParams.numBuckets = params.numBuckets;
    }

    try {
        const response = await apiClient.get<string>(url, {
            params: queryParams,
            headers: {
                ...apiClient.defaults.headers.common,
                'Accept': 'text/plain' // Keep requesting plain text for now
            },
            responseType: 'text',
        });
        const responseDataString = typeof response.data === 'string' ? response.data : String(response.data);
        return { success: true, data: responseDataString };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        if (axios.isAxiosError(error) && error.response?.headers?.['content-type']?.includes('text/html')) {
            try {
                const htmlError = error.response.data as string;
                const preMatch = htmlError.match(/<pre>([\s\S]*?)<\/pre>/i);
                if (preMatch && preMatch[1]) {
                    console.error(`[stderr] Extracted HTML error detail for ${context}: ${preMatch[1]}`);
                }
            } catch (htmlParseError) {
                console.error(`[stderr] Failed to parse potential HTML error for ${context}: ${htmlParseError}`);
            }
        }
        return { success: false, error: errorMessage };
    }
}

// Detects if version control is enabled on the Cribl instance, and whether a remote repo is set up.
export async function versionControl(): Promise<ClientResult<VersionControlItem>> {
    const context = 'versionControl';
    const url = '/api/v1/version/info';
    console.error(`[stderr] Attempting API call: GET ${url}`);
    try {
        // API returns items array with version control status details
        const response = await apiClient.get<{ items: VersionControlItem[], count: number }>(url);
        
        if (response.data?.items && Array.isArray(response.data.items) && response.data.items.length > 0) {
            // Return complete information from the first item
            const versionInfo = response.data.items[0];
            console.error(`[stderr] ${context}: Version control enabled=${versionInfo.versioning}, remote=${versionInfo.remote || 'none'}, branch=${versionInfo.branch || 'unknown'}`);
            return { success: true, data: versionInfo };
        } else {
            console.error(`[stderr] ${context}: Unexpected response structure or empty items array:`, response.data);
            return { 
                success: false, 
                error: 'Unexpected response structure from version/info endpoint.' 
            };
        }
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function commitPipeline(
    message: string // Required commit message
): Promise<ClientResult<CommitResult | null>> {
    const context = `commitPipeline`;
    if (!message || message.trim().length === 0) {
        return { success: false, error: 'Commit message is required for commitPipeline.' };
    }
    const url = `/api/v1/version/commit`;
    console.error(`[stderr] Attempting API call: POST ${url} with message: "${message}"`);
    try {
        const payload = { message: message };
        // API returns items array with commit details
        const response = await apiClient.post<{ items: CommitResult[], count: number }>(url, payload);
        
        if (response.data?.items && 
            Array.isArray(response.data.items) && 
            response.data.items.length > 0) {
            
            // Get full commit details from the first item
            const commitResult = response.data.items[0];
            
            // Verify we have at least the commit ID
            if (commitResult.commit) {
                // Log comprehensive commit information
                console.error(`[stderr] ${context}: Commit successful - ID: ${commitResult.commit}, Branch: ${commitResult.branch}`);
                if (commitResult.summary) {
                    console.error(`[stderr] ${context}: Files changed - Added: ${commitResult.summary.added || 0}, Modified: ${commitResult.summary.modified || 0}, Deleted: ${commitResult.summary.deleted || 0}`);
                }
                
                // Return full commit details
                return { success: true, data: commitResult };
            }
        }
        
        // If we get here, we couldn't find valid commit info in the response
        console.error(`[stderr] ${context}: Unable to extract valid commit information from response. Data:`, response.data);
        return { 
            success: false, 
            error: 'Unable to extract valid commit information from response.',
            data: null
        };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage, data: null };
    }
}

export async function deployPipeline(
    groupName: string,
    version: string // Commit ID to deploy
): Promise<ClientResult<DeployResponse>> {
    const context = `deployPipeline (Group: ${groupName}, Version: ${version})`;
    if (!groupName) return { success: false, error: 'Group name is required for deployPipeline.' };
    if (!version) return { success: false, error: 'Version (commit ID) is required for deployPipeline.' };
    
    const url = `/api/v1/master/groups/${groupName}/deploy`;
    console.error(`[stderr] Attempting API call: PATCH ${url} with version: "${version}"`);
    try {
        const payload = { version };
        // Use PATCH per API docs and expect DeployResponse
        const response = await apiClient.patch<DeployResponse>(url, payload);
        const data = response.data;

        if (data && Array.isArray(data.items) && data.items.length > 0) {
            console.error(`[stderr] ${context}: Deployment API returned ${data.items.length} ConfigGroup items (count=${data.count}).`);
            return { success: true, data };
        }
        const msg = 'Deployment API returned empty items array.';
        console.error(`[stderr] ${context}: ${msg}`);
        return { success: false, error: msg };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
} 