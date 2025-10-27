import axios, { AxiosError, AxiosResponse } from 'axios';

import {
    SlskdApiResponse,
    SlskdDownloadListResponse,
    SlskdSearchListResponse,
    SlskdSearchResultsResponse,
} from './slskd-types';

// Default slskd server configuration for backward compatibility
const DEFAULT_SLSKD_CONFIG = {
    baseUrl: 'http://192.168.1.31:5030',
    password: 'slskd',
    username: 'slskd',
};

// Get current slskd server configuration from settings
const getSlskdConfig = () => {
    try {
        const settings = JSON.parse(localStorage.getItem('store_settings') || '{}');
        const slskdSettings = settings?.state?.slskd;

        if (slskdSettings?.selectedServerId && slskdSettings?.servers) {
            const selectedServer = slskdSettings.servers.find(
                (server: any) => server.id === slskdSettings.selectedServerId,
            );
            if (selectedServer) {
                return {
                    baseUrl: selectedServer.baseUrl,
                    password: selectedServer.password,
                    username: selectedServer.username,
                };
            }
        }
    } catch (error) {
        console.warn('Failed to load slskd settings from localStorage:', error);
    }

    return DEFAULT_SLSKD_CONFIG;
};

export class SlskdApiClient {
    private baseUrl: string;
    private password: string;
    private token: null | string = null;
    private username: string;

    constructor(config = getSlskdConfig()) {
        this.baseUrl = config.baseUrl;
        this.username = config.username;
        this.password = config.password;
        this.token = null;
    }

    async downloadFile(
        username: string,
        files: Array<{ filename: string; size?: number; token?: number }>,
    ): Promise<void> {
        await this.ensureToken();
        await this.makePostRequest(`transfers/downloads/${encodeURIComponent(username)}`, files);
        console.log('Download enqueued:', { files, username });
    }

    async getRecentDownloads(limit = 50): Promise<SlskdDownloadListResponse> {
        await this.ensureToken();
        const response = await this.makeRequest<SlskdDownloadListResponse>(
            `transfers/downloads?limit=${limit}`,
        );
        console.log('slskd downloads API response:', response);
        console.log('slskd downloads response.data:', response.data);

        // Handle case where API returns data directly vs wrapped in response
        if (Array.isArray(response.data)) {
            return {
                count: response.data.length,
                downloads: response.data,
            };
        }

        // If response.data has downloads property, use it
        if (response.data && typeof response.data === 'object' && 'downloads' in response.data) {
            return response.data as SlskdDownloadListResponse;
        }

        // Otherwise return response.data as is, assuming it's the downloads array
        return {
            count: Array.isArray(response.data) ? (response.data as any[]).length : 0,
            downloads: (response.data as any) || [],
        };
    }

    async getRecentSearches(limit = 50): Promise<SlskdSearchListResponse> {
        await this.ensureToken();
        const response = await this.makeRequest<SlskdSearchListResponse>(`searches?limit=${limit}`);
        console.log('slskd searches API response:', response);
        console.log('slskd searches response.data:', response.data);

        // Handle case where API returns data directly vs wrapped in response
        if (Array.isArray(response.data)) {
            return {
                count: response.data.length,
                searches: response.data,
            };
        }

        // If response.data has searches property, use it
        if (response.data && typeof response.data === 'object' && 'searches' in response.data) {
            return response.data as SlskdSearchListResponse;
        }

        // Otherwise return response.data as is, assuming it's the searches array
        return {
            count: Array.isArray(response.data) ? (response.data as any[]).length : 0,
            searches: (response.data as any) || [],
        };
    }

    async getSearchResults(searchId: string): Promise<SlskdSearchResultsResponse> {
        await this.ensureToken();
        const response = await this.makeRequest<any>(`searches/${searchId}/responses`);
        console.log('slskd search results API response:', response);

        // Handle different response formats from slskd API
        let results: any[] = [];
        if (Array.isArray(response.data)) {
            results = response.data;
        } else if (response.data && response.data.responses) {
            results = response.data.responses;
        } else if (response.data && response.data.results) {
            results = response.data.results;
        }

        return {
            results,
            searchId,
            searchText: '', // Will be filled by the component
        };
    }

    async login(): Promise<void> {
        // POST to /session to get Bearer token
        const url = `${this.baseUrl}/api/v0/session`;
        try {
            const response = await axios.post(
                url,
                {
                    password: this.password,
                    username: this.username,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                },
            );
            this.token = response.data.token;
        } catch (error) {
            throw new Error(
                'Failed to authenticate with slskd API: ' +
                    (error instanceof Error ? error.message : error),
            );
        }
    }

    async removeCompletedDownloads(): Promise<void> {
        await this.ensureToken();
        await this.makeDeleteRequest('transfers/downloads/all/completed');
    }

    async removeDirectory(username: string, directory: string): Promise<void> {
        await this.ensureToken();
        console.log('Directory removal requested:', { directory, username });
        // Get all downloads for the user
        const downloadsResp = await this.getRecentDownloads(200); // Increase limit if needed
        let removedCount = 0;
        for (const group of downloadsResp.downloads) {
            if (group.username !== username) continue;
            console.log('Processing downloads for user:', username);
            if (!group.directories) continue;
            for (const dir of group.directories) {
                if (dir.directory !== directory) continue;
                for (const file of dir.files) {
                    try {
                        await this.removeDownload(username, file.id);
                        removedCount++;
                        console.log('Removed download:', file.id, 'from directory:', directory);
                    } catch (err) {
                        console.warn('Failed to remove download:', file.id, err);
                    }
                }
            }
        }
        console.log(
            `Finished removing ${removedCount} downloads for directory '${directory}' and user '${username}'.`,
        );
    }

    async removeDownload(
        username: string,
        downloadId: string,
        remove: boolean = true,
    ): Promise<void> {
        await this.ensureToken();
        const endpoint = `transfers/downloads/${encodeURIComponent(username)}/${downloadId}`;
        const params = new URLSearchParams({ remove: remove.toString() });

        await this.makeDeleteRequestWithParams(endpoint, params);
        console.log('Download removed:', { downloadId, remove, username });
    }

    async startSearch(
        query: string,
        options?: { limit?: number; timeout?: number },
    ): Promise<string> {
        await this.ensureToken();
        const response = await this.makePostRequest<{ id: string }>('searches', {
            responseLimit: options?.limit || 100,
            searchText: query,
            timeout: options?.timeout || 30000,
        });
        return response.data.id;
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.login();
            return true;
        } catch {
            return false;
        }
    }

    private async ensureToken() {
        if (!this.token) {
            await this.login();
        }
    }

    private async makeDeleteRequest(endpoint: string): Promise<void> {
        if (!this.token) throw new Error('Not authenticated with slskd API');
        console.log(`Making DELETE request to slskd endpoint: ${endpoint}`);
        try {
            await axios.delete(`${this.baseUrl}/api/v0/${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10 second timeout
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                throw new Error(
                    `slskd API Error: ${axiosError.response?.status || 'Network Error'} - ${
                        axiosError.message
                    }`,
                );
            }
            throw new Error(`slskd API Error: ${error}`);
        }
    }

    private async makeDeleteRequestWithParams(
        endpoint: string,
        params: URLSearchParams,
    ): Promise<void> {
        if (!this.token) throw new Error('Not authenticated with slskd API');
        console.log(
            `Making DELETE request to slskd endpoint: ${endpoint} with params: ${params.toString()}`,
        );
        try {
            await axios.delete(`${this.baseUrl}/api/v0/${endpoint}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10 second timeout
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                throw new Error(
                    `slskd API Error: ${axiosError.response?.status || 'Network Error'} - ${
                        axiosError.message
                    }`,
                );
            }
            throw new Error(`slskd API Error: ${error}`);
        }
    }

    private async makePostRequest<T>(endpoint: string, data: any): Promise<SlskdApiResponse<T>> {
        if (!this.token) throw new Error('Not authenticated with slskd API');
        console.log(`Making POST request to slskd endpoint: ${endpoint}`);
        try {
            const response: AxiosResponse<T> = await axios.post(
                `${this.baseUrl}/api/v0/${endpoint}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 second timeout
                },
            );

            return {
                data: response.data,
                status: response.status,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                throw new Error(
                    `slskd API Error: ${axiosError.response?.status || 'Network Error'} - ${
                        axiosError.message
                    }`,
                );
            }
            throw new Error(`slskd API Error: ${error}`);
        }
    }

    private async makeRequest<T>(endpoint: string): Promise<SlskdApiResponse<T>> {
        if (!this.token) throw new Error('Not authenticated with slskd API');
        console.log(`Making request to slskd endpoint: ${endpoint}`);
        try {
            const response: AxiosResponse<T> = await axios.get(
                `${this.baseUrl}/api/v0/${endpoint}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 second timeout
                },
            );

            return {
                data: response.data,
                status: response.status,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                throw new Error(
                    `slskd API Error: ${axiosError.response?.status || 'Network Error'} - ${
                        axiosError.message
                    }`,
                );
            }
            throw new Error(`slskd API Error: ${error}`);
        }
    }
}

// Default instance
export const slskdApi = new SlskdApiClient();

// Function to get a fresh API client with current settings
export const getSlskdApiClient = () => {
    return new SlskdApiClient(getSlskdConfig());
};
