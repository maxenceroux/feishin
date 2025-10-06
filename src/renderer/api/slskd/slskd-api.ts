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
    private token: string | null = null;
    private baseUrl: string;
    private password: string;
    private username: string;

    constructor(config = SLSKD_CONFIG) {
        this.baseUrl = config.baseUrl;
        this.username = config.username;
        this.password = config.password;
        this.token = null;
    }

    async login(): Promise<void> {
        // POST to /session to get Bearer token
        const url = `${this.baseUrl}/api/v0/session`;
        try {
            const response = await axios.post(
                url,
                {
                    username: this.username,
                    password: this.password,
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

    async getRecentDownloads(limit = 50): Promise<SlskdDownloadListResponse> {
        await this.ensureToken();
        const response = await this.makeRequest<SlskdDownloadListResponse>(
            `transfers/downloads?limit=${limit}`,
        );
        return response.data;
    }

    async getRecentSearches(limit = 50): Promise<SlskdSearchListResponse> {
        await this.ensureToken();
        const response = await this.makeRequest<SlskdSearchListResponse>(`searches?limit=${limit}`);
        console.log(response);
        return response.data;
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.login();
            return true;
        } catch {
            return false;
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

    private async ensureToken() {
        if (!this.token) {
            await this.login();
        }
    }
}

// Default instance
export const slskdApi = new SlskdApiClient();
