import axios, { AxiosInstance, AxiosError } from 'axios';
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
    error: string;
    message: string;
}

interface ClientResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Create a pre-configured Axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: config.cribl.baseUrl,
    headers: {
        'Authorization': `Bearer ${config.cribl.authToken}`,
        'Content-Type': 'application/json',
    },
});

// Helper function to handle API errors
function handleApiError(error: unknown, context: string): string {
    let errorMessage = `Unknown error occurred during ${context}.`;
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<CriblErrorResponse>;
        console.error(`Axios error during ${context}:`, axiosError.message);
        if (axiosError.response) {
            console.error('Response data:', axiosError.response.data);
            console.error('Response status:', axiosError.response.status);
            const errorData = axiosError.response.data;
            errorMessage = `API Error (${axiosError.response.status}) during ${context}: ${errorData?.message || errorData?.error || axiosError.message}`;
        } else if (axiosError.request) {
            errorMessage = `API Error during ${context}: No response received from server.`;
            console.error('Request data:', axiosError.request);
        } else {
            errorMessage = `API Error during ${context}: ${axiosError.message}`;
        }
    } else if (error instanceof Error) {
        errorMessage = `Error during ${context}: ${error.message}`;
        console.error(`Non-Axios error during ${context}:`, error);
    } else {
        console.error(`Unknown error type during ${context}:`, error);
    }
    return errorMessage;
}

// --- API Client Functions ---

export async function getPipelines(): Promise<ClientResult<CriblPipeline[]>> {
    const context = 'getPipelines';
    try {
        const response = await apiClient.get<CriblApiResponse>('/system/pipelines');
        // Add validation if needed (e.g., using Zod)
        return { success: true, data: response.data.items as CriblPipeline[] };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function getSources(): Promise<ClientResult<CriblSource[]>> {
    const context = 'getSources';
    try {
        const response = await apiClient.get<CriblApiResponse>('/system/sources');
        // Add validation if needed
        return { success: true, data: response.data.items as CriblSource[] };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function setPipelineConfig(pipelineId: string, pipelineConfig: any): Promise<ClientResult<CriblPipeline>> {
    const context = `setPipelineConfig (ID: ${pipelineId})`;
    if (!pipelineId) {
        return { success: false, error: 'Pipeline ID is required for setPipelineConfig.' };
    }
    try {
        // Note: Cribl API might require the full pipeline object for PATCH/PUT
        // Adjust payload as necessary based on API docs.
        // This example assumes sending only the config part might work for a PATCH,
        // but often you need to send the whole modified resource.
        const response = await apiClient.patch<CriblPipeline>(`/system/pipelines/${pipelineId}`, { config: pipelineConfig });
        // Could also be PUT depending on API semantics

        // Consider fetching the updated pipeline again if PATCH doesn't return the full updated object
        return { success: true, data: response.data };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
}

export async function restartWorkerGroup(group: string = 'default'): Promise<ClientResult<{ message: string }>> {
    const context = `restartWorkerGroup (Group: ${group})`;
    if (!group) {
        return { success: false, error: 'Worker group name is required for restartWorkerGroup.' };
    }
    try {
        // Ensure this is the correct endpoint and method (POST)
        const response = await apiClient.post(`/master/groups/${group}/restart`);
        // Check response structure, might just be a 2xx status with no body or a simple message
        return { success: true, data: { message: `Successfully initiated restart for group ${group}. Response status: ${response.status}` } };
    } catch (error) {
        const errorMessage = handleApiError(error, context);
        return { success: false, error: errorMessage };
    }
} 