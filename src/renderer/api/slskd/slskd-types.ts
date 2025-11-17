import { z } from 'zod';

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface SlskdApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

// ============================================================================
// Common Types
// ============================================================================

export type TransferDirection = 'Download' | 'Upload';
export type UserPresence = 'Offline' | 'Away' | 'Online';

// ============================================================================
// File and Directory Types
// ============================================================================

/**
 * Represents a file attribute (metadata) from the slskd API
 * Attributes like bitRate, sampleRate, etc. are returned as attributes array
 */
export interface SlskdFileAttribute {
    type: number;
    value: number;
}

/**
 * Represents a file in search results
 * Based on SearchFile from Python wrapper
 */
export interface SlskdSearchResultFile {
    /** Full path and filename */
    filename: string;
    /** File size in bytes */
    size: number;
    /** File code/identifier */
    code: number;
    /** Whether the file is locked */
    isLocked?: boolean;
    /** File extension */
    extension?: string;
    /** Bit rate for lossy audio formats (in kbps) */
    bitRate?: number;
    /** Bit depth for lossless audio formats */
    bitDepth?: number;
    /** Length/duration in seconds */
    length?: number;
    /** Sample rate in Hz */
    sampleRate?: number;
    /** Number of attributes */
    attributeCount?: number;
    /** File attributes array */
    attributes?: SlskdFileAttribute[];
}

/**
 * Represents a file in user browse results
 * Based on UserFile from Python wrapper
 */
export interface SlskdUserFile {
    /** Full path and filename */
    filename: string;
    /** File size in bytes */
    size: number;
    /** File code/identifier */
    code: number;
    /** File extension */
    extension: string;
    /** Number of attributes */
    attributeCount: number;
    /** File attributes array */
    attributes: SlskdFileAttribute[];
}

/**
 * Represents a directory in user browse results
 * Based on UserDirectory from Python wrapper
 */
export interface SlskdUserDirectory {
    /** Directory name/path */
    name: string;
    /** Number of files in directory */
    fileCount: number;
    /** Files in this directory */
    files: SlskdUserFile[];
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Represents a single search response from a user
 * Based on SearchResponseItem from Python wrapper
 */
export interface SlskdSearchResponse {
    /** Username of the responding user */
    username: string;
    /** Number of files in response */
    fileCount: number;
    /** Files matching the search */
    files: SlskdSearchResultFile[];
    /** Whether user has free upload slots */
    hasFreeUploadSlot: boolean;
    /** Number of locked files */
    lockedFileCount: number;
    /** Locked files matching the search */
    lockedFiles: SlskdSearchResultFile[];
    /** User's queue length */
    queueLength: number;
    /** Response token */
    token: number;
    /** User's upload speed in bytes/sec */
    uploadSpeed: number;
}

/**
 * Represents a search request/state
 * Based on SearchState from Python wrapper
 */
export interface SlskdSearchState {
    /** Search unique identifier */
    id: string;
    /** Search query text */
    searchText: string;
    /** When search started (ISO date string) */
    startedAt: string;
    /** When search ended (ISO date string) */
    endedAt?: string;
    /** Search state */
    state: 'Requested' | 'InProgress' | 'Completed' | 'Cancelled' | 'Failed' | 'TimedOut';
    /** Whether search is complete */
    isComplete: boolean;
    /** Total number of files found */
    fileCount: number;
    /** Number of locked files found */
    lockedFileCount: number;
    /** Number of user responses received */
    responseCount: number;
    /** Search token */
    token: number;
    /** Search responses (included when requested) */
    responses?: SlskdSearchResponse[];
}

// Legacy type for backward compatibility
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

export interface SlskdSearchListResponse {
    count: number;
    searches: SlskdSearchRequest[];
}

/**
 * Response from getting search results
 */
export interface SlskdSearchResultsResponse {
    searchId: string;
    searchText: string;
    results: SlskdSearchResponse[];
}

// Legacy type for backward compatibility
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

// ============================================================================
// Transfer/Download Types
// ============================================================================

/**
 * Represents a single transferred file
 * Based on TransferedFile from Python wrapper
 */
export interface SlskdTransferredFile {
    /** Transfer unique identifier */
    id: string;
    /** Username of transfer peer */
    username: string;
    /** Transfer direction */
    direction: TransferDirection;
    /** Full path and filename */
    filename: string;
    /** File size in bytes */
    size: number;
    /** Start offset in bytes */
    startOffset: number;
    /** Transfer state */
    state: string;
    /** When transfer was requested (ISO date string) */
    requestedAt: string;
    /** When transfer was enqueued (ISO date string) */
    enqueuedAt: string;
    /** When transfer started (ISO date string) */
    startedAt?: string;
    /** When transfer ended (ISO date string) */
    endedAt?: string;
    /** Bytes transferred */
    bytesTransferred: number;
    /** Average speed in bytes/sec */
    averageSpeed?: number;
    /** Bytes remaining */
    bytesRemaining?: number;
    /** Elapsed time */
    elapsedTime?: number;
    /** Percent complete (0-100) */
    percentComplete: number;
    /** Remaining time estimate */
    remainingTime?: number;
}

/**
 * Represents a directory of transferred files
 * Based on TransferedDirectory from Python wrapper
 */
export interface SlskdTransferredDirectory {
    /** Remote directory path */
    directory: string;
    /** Number of files in directory */
    fileCount: number;
    /** Files in this directory */
    files: SlskdTransferredFile[];
}

/**
 * Represents all transfers for a given user
 * Based on Transfer from Python wrapper
 */
export interface SlskdTransfer {
    /** Username */
    username: string;
    /** Directories being transferred */
    directories: SlskdTransferredDirectory[];
}

// Legacy type for backward compatibility
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
    state: string;
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

// ============================================================================
// Hierarchical Search Result Types for Tree View
// ============================================================================

/**
 * Represents a file in a hierarchical directory structure
 */
export interface SlskdHierarchicalFile {
    /** Full original filename with path */
    filename: string;
    /** Just the file name without path */
    name: string;
    /** File size in bytes */
    size: number;
    /** File code/identifier */
    code: number;
    /** File extension */
    extension?: string;
    /** Bit rate for lossy audio formats (in kbps) */
    bitRate?: number;
    /** Bit depth for lossless audio formats */
    bitDepth?: number;
    /** Length/duration in seconds */
    length?: number;
    /** Sample rate in Hz */
    sampleRate?: number;
    /** Whether the file is locked */
    isLocked?: boolean;
}

/**
 * Represents a directory in a hierarchical structure
 */
export interface SlskdHierarchicalDirectory {
    /** Directory name (just the last component) */
    name: string;
    /** Full path to this directory */
    path: string;
    /** Files directly in this directory */
    files: SlskdHierarchicalFile[];
    /** Subdirectories */
    subdirectories: SlskdHierarchicalDirectory[];
    /** Total number of files in this directory and subdirectories */
    totalFileCount: number;
    /** Total size of all files in bytes */
    totalSize: number;
}

/**
 * Represents a user's search results organized hierarchically
 */
export interface SlskdHierarchicalSearchResult {
    /** Username */
    username: string;
    /** User's upload speed in bytes/sec */
    uploadSpeed: number;
    /** Whether user has free upload slots */
    hasFreeUploadSlot: boolean;
    /** User's queue length */
    queueLength: number;
    /** Root directories */
    directories: SlskdHierarchicalDirectory[];
    /** Total file count (including locked) */
    totalFileCount: number;
    /** Number of locked files */
    lockedFileCount: number;
    /** Response token */
    token: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

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
