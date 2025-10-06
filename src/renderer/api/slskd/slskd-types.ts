import { z } from 'zod';

export interface SlskdApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

export interface SlskdDownload {
    averageSpeed?: number;
    bytesTransferred: number;
    direction: 'Download' | 'Upload';
    elapsedTime?: number;
    endedAt?: string;
    filename: string;
    id: string;
    percentComplete: number;
    remainingTime?: number;
    size: number;
    startedAt?: string;
    state: 'Cancelled' | 'Completed' | 'Failed' | 'InProgress' | 'Queued';
    username: string;
}

export interface SlskdDownloadListResponse {
    count: number;
    downloads: SlskdDownload[];
}

export interface SlskdSearchListResponse {
    count: number;
    searches: SlskdSearchRequest[];
}

// slskd API response types
export interface SlskdSearchRequest {
    elapsedTime?: number;
    endedAt?: string;
    fileCount: number;
    id: string;
    responseCount: number;
    searchText: string;
    startedAt: string;
    state: 'Cancelled' | 'Completed' | 'Failed' | 'InProgress' | 'Requested' | 'TimedOut';
}

// Validation schemas
export const slskdSearchRequestSchema = z.object({
    elapsedTime: z.number().optional(),
    endedAt: z.string().optional(),
    fileCount: z.number(),
    id: z.string(),
    responseCount: z.number(),
    searchText: z.string(),
    startedAt: z.string(),
    state: z.enum(['Requested', 'InProgress', 'Completed', 'Cancelled', 'Failed', 'TimedOut']),
});

export const slskdDownloadSchema = z.object({
    averageSpeed: z.number().optional(),
    bytesTransferred: z.number(),
    direction: z.enum(['Download', 'Upload']),
    elapsedTime: z.number().optional(),
    endedAt: z.string().optional(),
    filename: z.string(),
    id: z.string(),
    percentComplete: z.number(),
    remainingTime: z.number().optional(),
    size: z.number(),
    startedAt: z.string().optional(),
    state: z.enum(['Queued', 'InProgress', 'Completed', 'Failed', 'Cancelled']),
    username: z.string(),
});

export type SlskdDownloadType = z.infer<typeof slskdDownloadSchema>;
export type SlskdSearchRequestType = z.infer<typeof slskdSearchRequestSchema>;
