/**
 * Utility functions for transforming and working with slskd API data
 */

import {
    SlskdFileAttribute,
    SlskdHierarchicalDirectory,
    SlskdHierarchicalFile,
    SlskdHierarchicalSearchResult,
    SlskdSearchResponse,
    SlskdSearchResultFile,
    SlskdUserBrowseResponse,
} from './slskd-types';

/**
 * Extracts the directory path from a full filename
 * @param filename Full path including filename
 * @returns Directory path (without trailing slash)
 */
export function getDirectoryPath(filename: string): string {
    const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
    if (lastSlash === -1) return '';
    return filename.substring(0, lastSlash);
}

/**
 * Extracts just the filename from a full path
 * @param filename Full path including filename
 * @returns Just the filename
 */
export function getFileName(filename: string): string {
    const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
    if (lastSlash === -1) return filename;
    return filename.substring(lastSlash + 1);
}

/**
 * Gets the file extension from a filename
 * @param filename Filename or path
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
    const name = getFileName(filename);
    const lastDot = name.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return '';
    return name.substring(lastDot + 1).toLowerCase();
}

/**
 * Converts a flat file to a hierarchical file structure
 */
function convertFileToHierarchical(file: SlskdSearchResultFile): SlskdHierarchicalFile {
    return {
        filename: file.filename,
        name: getFileName(file.filename),
        size: file.size,
        code: file.code,
        extension: file.extension || getFileExtension(file.filename),
        bitRate: file.bitRate,
        bitDepth: file.bitDepth,
        length: file.length,
        sampleRate: file.sampleRate,
        isLocked: file.isLocked,
    };
}

/**
 * Builds a hierarchical directory structure from a flat list of files
 * @param files Array of files with full paths
 * @returns Array of root directories with nested subdirectories and files
 */
export function buildDirectoryTree(files: SlskdSearchResultFile[]): SlskdHierarchicalDirectory[] {
    // Map to store directories by their full path
    const dirMap = new Map<string, SlskdHierarchicalDirectory>();

    // First pass: create all files and collect unique directory paths
    const filesByDir = new Map<string, SlskdHierarchicalFile[]>();

    for (const file of files) {
        const dirPath = getDirectoryPath(file.filename);
        const hierarchicalFile = convertFileToHierarchical(file);

        if (!filesByDir.has(dirPath)) {
            filesByDir.set(dirPath, []);
        }
        filesByDir.get(dirPath)!.push(hierarchicalFile);
    }

    // Second pass: create all directory objects
    const allPaths = Array.from(filesByDir.keys()).sort();

    for (const path of allPaths) {
        if (!path) continue; // Skip root/empty path

        const parts = path.split(/[/\\]/).filter((p) => p);
        const dirName = parts[parts.length - 1] || path;

        const dir: SlskdHierarchicalDirectory = {
            name: dirName,
            path: path,
            files: filesByDir.get(path) || [],
            subdirectories: [],
            totalFileCount: 0,
            totalSize: 0,
        };

        dirMap.set(path, dir);
    }

    // Third pass: build parent-child relationships
    const rootDirs: SlskdHierarchicalDirectory[] = [];

    for (const [path, dir] of dirMap.entries()) {
        const parentPath = getDirectoryPath(path);

        if (!parentPath || !dirMap.has(parentPath)) {
            // This is a root directory
            rootDirs.push(dir);
        } else {
            // This is a subdirectory
            const parent = dirMap.get(parentPath);
            if (parent) {
                parent.subdirectories.push(dir);
            }
        }
    }

    // Fourth pass: calculate total file counts and sizes (bottom-up)
    function calculateTotals(dir: SlskdHierarchicalDirectory): void {
        // Start with files in this directory
        dir.totalFileCount = dir.files.length;
        dir.totalSize = dir.files.reduce((sum, file) => sum + file.size, 0);

        // Add totals from subdirectories
        for (const subdir of dir.subdirectories) {
            calculateTotals(subdir);
            dir.totalFileCount += subdir.totalFileCount;
            dir.totalSize += subdir.totalSize;
        }
    }

    for (const rootDir of rootDirs) {
        calculateTotals(rootDir);
    }

    // Sort directories and files by name
    function sortDirectory(dir: SlskdHierarchicalDirectory): void {
        dir.files.sort((a, b) => a.name.localeCompare(b.name));
        dir.subdirectories.sort((a, b) => a.name.localeCompare(b.name));
        dir.subdirectories.forEach(sortDirectory);
    }

    rootDirs.forEach(sortDirectory);
    rootDirs.sort((a, b) => a.name.localeCompare(b.name));

    return rootDirs;
}

/**
 * Transforms a flat search response into a hierarchical structure suitable for tree views
 * @param response Flat search response from slskd API
 * @returns Hierarchical search result with nested directories
 */
export function transformSearchResponseToHierarchical(
    response: SlskdSearchResponse,
): SlskdHierarchicalSearchResult {
    const allFiles = [...response.files];
    if (response.lockedFiles && response.lockedFiles.length > 0) {
        // Mark locked files
        const lockedFiles = response.lockedFiles.map((f) => ({ ...f, isLocked: true }));
        allFiles.push(...lockedFiles);
    }

    const directories = buildDirectoryTree(allFiles);

    return {
        username: response.username,
        uploadSpeed: response.uploadSpeed,
        hasFreeUploadSlot: response.hasFreeUploadSlot,
        queueLength: response.queueLength,
        directories,
        totalFileCount: response.fileCount + response.lockedFileCount,
        lockedFileCount: response.lockedFileCount,
        token: response.token,
    };
}

/**
 * Transforms an array of flat search responses into hierarchical structures
 */
export function transformSearchResultsToHierarchical(
    responses: SlskdSearchResponse[],
): SlskdHierarchicalSearchResult[] {
    return responses.map(transformSearchResponseToHierarchical);
}

/**
 * Gets all files in a directory and its subdirectories (flattened)
 * @param directory Directory to get files from
 * @returns Array of all files in directory tree
 */
export function getAllFilesInDirectory(directory: SlskdHierarchicalDirectory): SlskdHierarchicalFile[] {
    const files: SlskdHierarchicalFile[] = [...directory.files];

    for (const subdir of directory.subdirectories) {
        files.push(...getAllFilesInDirectory(subdir));
    }

    return files;
}

/**
 * Formats file size to human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats duration in seconds to human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "3:45" or "1:23:45")
 */
export function formatDuration(seconds?: number): string {
    if (!seconds || seconds < 0) return '--:--';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats bit rate to human-readable string
 * @param bitRate Bit rate in kbps
 * @returns Formatted string (e.g., "320 kbps")
 */
export function formatBitRate(bitRate?: number): string {
    if (!bitRate) return '';
    return `${bitRate} kbps`;
}

/**
 * Formats sample rate to human-readable string
 * @param sampleRate Sample rate in Hz
 * @returns Formatted string (e.g., "44.1 kHz")
 */
export function formatSampleRate(sampleRate?: number): string {
    if (!sampleRate) return '';
    const kHz = sampleRate / 1000;
    return `${kHz} kHz`;
}

/**
 * Transforms a user browse response to a hierarchical structure
 * This converts the flat directory list from the browse API into a nested structure
 * suitable for tree views
 * @param browseResponse Browse response from slskd API
 * @returns Hierarchical browse result with nested directories
 */
export function transformBrowseToHierarchical(
    browseResponse: SlskdUserBrowseResponse,
): SlskdHierarchicalSearchResult {
    // Convert browse directories to search files format for reusing buildDirectoryTree
    const allFiles: SlskdSearchResultFile[] = [];
    
    for (const dir of browseResponse.directories) {
        for (const file of dir.files) {
            // Construct full path: directory/filename
            const fullPath = `${dir.name}/${file.filename}`;
            allFiles.push({
                filename: fullPath,
                size: file.size,
                code: file.code,
                extension: file.extension,
                isLocked: false,
                // Extract attributes if available
                bitRate: extractBitRate(file.attributes),
                bitDepth: extractBitDepth(file.attributes),
                length: extractLength(file.attributes),
                sampleRate: extractSampleRate(file.attributes),
            });
        }
    }
    
    const directories = buildDirectoryTree(allFiles);
    
    return {
        username: browseResponse.username,
        uploadSpeed: 0, // Not available in browse response
        hasFreeUploadSlot: false, // Not available in browse response
        queueLength: 0, // Not available in browse response
        directories,
        totalFileCount: browseResponse.fileCount,
        lockedFileCount: browseResponse.lockedDirectoryCount || 0,
        token: 0, // Not applicable for browse
    };
}

/**
 * Extract bit rate from file attributes
 * Based on slskd attribute type codes
 */
function extractBitRate(attributes?: SlskdFileAttribute[]): number | undefined {
    if (!attributes) return undefined;
    // Attribute type 0 is bit rate for lossy files
    const bitRateAttr = attributes.find((attr) => attr.type === 0);
    return bitRateAttr?.value;
}

/**
 * Extract bit depth from file attributes
 * Based on slskd attribute type codes
 */
function extractBitDepth(attributes?: SlskdFileAttribute[]): number | undefined {
    if (!attributes) return undefined;
    // Attribute type 3 is bit depth for lossless files
    const bitDepthAttr = attributes.find((attr) => attr.type === 3);
    return bitDepthAttr?.value;
}

/**
 * Extract length/duration from file attributes
 * Based on slskd attribute type codes
 */
function extractLength(attributes?: SlskdFileAttribute[]): number | undefined {
    if (!attributes) return undefined;
    // Attribute type 1 is length in seconds
    const lengthAttr = attributes.find((attr) => attr.type === 1);
    return lengthAttr?.value;
}

/**
 * Extract sample rate from file attributes
 * Based on slskd attribute type codes
 */
function extractSampleRate(attributes?: SlskdFileAttribute[]): number | undefined {
    if (!attributes) return undefined;
    // Attribute type 4 is sample rate
    const sampleRateAttr = attributes.find((attr) => attr.type === 4);
    return sampleRateAttr?.value;
}
