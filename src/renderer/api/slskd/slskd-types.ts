import { z } from 'zod';

export interface SlskdApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

export interface SlskdDownload {
    averageSpeed?: number;
    bytesRemaining?: number;
    bytesTransferred: number;
    direction: 'Download' | 'Upload';
    elapsedTime?: number;
    endedAt?: string;
    enqueuedAt?: string;
    exception?: string;
    filename: string;
    id: string;
    percentComplete: number;
    remainingTime?: number;
    requestedAt?: string;
    size: number;
    startedAt?: string;
    startOffset?: number;
    state: string; // More flexible to handle various states like "Completed, Errored"
    stateDescription?: string;
    username: string;
}

export interface SlskdDownloadGroup {
    directories?: Array<{
        directory: string;
        fileCount: number;
        files: SlskdDownload[];
    }>;
    username: string;
}

export interface SlskdDownloadListResponse {
    count: number;
    downloads: SlskdDownloadGroup[];
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

// Search results types for the expanded tree view
export interface SlskdSearchResultFile {
    album?: string;
    artist?: string;
    bitRate?: number;
    code: number;
    filename: string;
    length?: number;
    sampleRate?: number;
    size: number;
    token: number;
    track?: number;
}

export interface SlskdSearchResultUser {
    averageSpeed?: number;
    clientVersion?: string;
    countryCode?: string;
    downloadCount?: number;
    fileCount: number;
    freeUploadSlots?: number;
    isPrivileged?: boolean;
    queueLength?: number;
    uploadCount?: number;
    username: string;
}

export interface SlskdSearchResult {
    fileCount: number;
    files: SlskdSearchResultFile[];
    hasFreeUploadSlot?: boolean;
    lockedFileCount?: number;
    lockedFiles?: SlskdSearchResultFile[];
    queueLength?: number;
    token?: number;
    uploadSpeed?: number;
    username: string;
}

export interface SlskdSearchResultsResponse {
    results: SlskdSearchResult[];
    searchId: string;
    searchText: string;
}
