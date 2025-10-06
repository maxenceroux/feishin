import axios, { AxiosError, AxiosResponse } from 'axios';

import {
    SlskdApiResponse,
    SlskdDownloadListResponse,
    SlskdSearchListResponse,
} from './slskd-types';

// slskd server configuration
const SLSKD_CONFIG = {
    baseUrl: 'http://100.98.104.55:5030',
    password: 'slskd',
    username: 'slskd',
};

export class SlskdApiClient {
    private authHeader: string;
    private baseUrl: string;
    private password: string;
    private username: string;

    constructor(config = SLSKD_CONFIG) {
        this.baseUrl = config.baseUrl;
        this.username = config.username;
        this.password = config.password;
        this.authHeader = `Basic ${btoa(`${this.username}:${this.password}`)}`;
    }

    async getRecentDownloads(limit = 50): Promise<SlskdDownloadListResponse> {
        const response = await this.makeRequest<SlskdDownloadListResponse>(
            `transfers/downloads?limit=${limit}`,
        );
        return response.data;
    }

    async getRecentSearches(limit = 50): Promise<SlskdSearchListResponse> {
        const response = await this.makeRequest<SlskdSearchListResponse>(`searches?limit=${limit}`);
        return response.data;
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.makeRequest('session');
            return true;
        } catch {
            return false;
        }
    }

    private async makeRequest<T>(endpoint: string): Promise<SlskdApiResponse<T>> {
        try {
            const response: AxiosResponse<T> = await axios.get(
                `${this.baseUrl}/api/v0/${endpoint}`,
                {
                    headers: {
                        Authorization: this.authHeader,
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
