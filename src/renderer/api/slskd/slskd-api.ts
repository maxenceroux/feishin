import axios, { AxiosError, AxiosResponse } from 'axios';

import {
    SlskdApiResponse,
    SlskdDownloadListResponse,
    SlskdSearchListResponse,
} from './slskd-types';

// slskd server configuration
const SLSKD_CONFIG = {
    baseUrl: 'http://192.168.1.31:5030',
    password: 'slskd',
    username: 'slskd',
};

export class SlskdApiClient {
    private baseUrl: string;
    private password: string;
    private token: null | string = null;
    private username: string;

    constructor(config = SLSKD_CONFIG) {
        this.baseUrl = config.baseUrl;
        this.username = config.username;
        this.password = config.password;
        this.token = null;
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
        await this.makeDeleteRequest('transfers/downloads/completed');
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
