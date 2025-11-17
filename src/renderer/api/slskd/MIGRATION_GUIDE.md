# Migration Guide: Updated slskd API Types

This guide helps you migrate from the old API types to the new improved types.

## Overview

The slskd API types have been significantly improved to provide:
- More accurate type definitions based on the official Python wrapper
- Hierarchical data structures for tree views
- Better support for subfolder downloads
- Full backward compatibility with existing code

## Backward Compatibility

**Good news!** All existing code will continue to work without changes. Legacy types are maintained:
- `SlskdSearchResult` → still available (alias for `SlskdSearchResponse`)
- `SlskdDownload` → still available
- `SlskdSearchRequest` → still available
- All existing API methods work the same way

## New Features

### 1. Hierarchical Search Results

Transform flat search results into a tree structure for displaying in a folder view:

```typescript
// Before: Flat list of files
const results = await slskdApi.getSearchResults(searchId);
results.results.forEach(user => {
    user.files.forEach(file => {
        console.log(file.filename); // Full path
    });
});

// After: Hierarchical tree structure
import { transformSearchResponseToHierarchical } from './slskd-utils';

const results = await slskdApi.getSearchResults(searchId);
const hierarchical = results.results.map(transformSearchResponseToHierarchical);

hierarchical.forEach(user => {
    user.directories.forEach(dir => {
        console.log(`${dir.name} - ${dir.totalFileCount} files`);
        dir.subdirectories.forEach(subdir => {
            console.log(`  ${subdir.name} - ${subdir.totalFileCount} files`);
        });
    });
});
```

### 2. Download Entire Folders

Easily download all files in a directory:

```typescript
// Before: Manual loop through files
const files = user.files.filter(f => f.filename.startsWith('Music/Jazz/'));
for (const file of files) {
    await slskdApi.downloadFile(username, [{
        filename: file.filename,
        size: file.size,
        code: file.code
    }]);
}

// After: Use utility function
import { getAllFilesInDirectory } from './slskd-utils';

const hierarchical = transformSearchResponseToHierarchical(searchResponse);
const jazzDir = hierarchical.directories[0].subdirectories.find(d => d.name === 'Jazz');

if (jazzDir) {
    const allFiles = getAllFilesInDirectory(jazzDir);
    const filesToDownload = allFiles.map(f => ({
        filename: f.filename,
        size: f.size,
        code: f.code
    }));
    await slskdApi.downloadFile(username, filesToDownload);
}
```

### 3. New API Methods

```typescript
// Get search state with optional responses
const searchState = await slskdApi.getSearchState(searchId, true);
console.log(searchState.state); // 'InProgress', 'Completed', etc.
console.log(searchState.responses); // If includeResponses was true

// Get all downloads (properly typed)
const transfers = await slskdApi.getAllDownloads();
transfers.forEach(transfer => {
    console.log(transfer.username);
    transfer.directories.forEach(dir => {
        console.log(`  ${dir.directory}: ${dir.fileCount} files`);
    });
});

// Get downloads for specific user
const userTransfers = await slskdApi.getDownloadsForUser('someuser');
```

### 4. Utility Functions

New helper functions for common tasks:

```typescript
import {
    formatFileSize,
    formatDuration,
    formatBitRate,
    formatSampleRate,
    getDirectoryPath,
    getFileName
} from './slskd-utils';

// Format file size
formatFileSize(28567234); // "27.24 MB"

// Format duration
formatDuration(259); // "4:19"

// Format bitrate
formatBitRate(320); // "320 kbps"

// Extract filename from path
getFileName('Music/Jazz/Miles Davis/Song.mp3'); // "Song.mp3"
getDirectoryPath('Music/Jazz/Miles Davis/Song.mp3'); // "Music/Jazz/Miles Davis"
```

## Type Changes

### SlskdSearchResultFile

Enhanced with more metadata:

```typescript
// Old
interface SlskdSearchResultFile {
    filename: string;
    size: number;
    code: number;
    bitRate?: number;
    // ...
}

// New (backward compatible)
interface SlskdSearchResultFile {
    filename: string;
    size: number;
    code: number;
    isLocked?: boolean;       // NEW
    extension?: string;       // NEW
    bitRate?: number;
    bitDepth?: number;        // NEW
    length?: number;
    sampleRate?: number;
    attributeCount?: number;  // NEW
    attributes?: SlskdFileAttribute[]; // NEW
}
```

### SlskdTransfer (replaces SlskdDownloadGroup)

Better structured for directories:

```typescript
// Old
interface SlskdDownloadGroup {
    username: string;
    directories?: Array<{
        directory: string;
        fileCount: number;
        files: SlskdDownload[];
    }>;
}

// New (more specific)
interface SlskdTransfer {
    username: string;
    directories: SlskdTransferredDirectory[];
}

interface SlskdTransferredDirectory {
    directory: string;
    fileCount: number;
    files: SlskdTransferredFile[];
}
```

## Examples

### Building a Tree View Component

```typescript
import { transformSearchResponseToHierarchical } from './slskd-utils';
import { SlskdHierarchicalDirectory } from './slskd-types';

function DirectoryTree({ directory }: { directory: SlskdHierarchicalDirectory }) {
    return (
        <div>
            <div>
                {directory.name} ({directory.totalFileCount} files)
            </div>
            {directory.subdirectories.map(subdir => (
                <div key={subdir.path} style={{ marginLeft: 20 }}>
                    <DirectoryTree directory={subdir} />
                </div>
            ))}
            {directory.files.map(file => (
                <div key={file.code} style={{ marginLeft: 20 }}>
                    {file.name} - {formatFileSize(file.size)}
                </div>
            ))}
        </div>
    );
}
```

### Filtering Search Results

```typescript
// Filter by bitrate
const highQualityFiles = hierarchical.directories.map(dir => ({
    ...dir,
    files: dir.files.filter(f => f.bitRate && f.bitRate >= 320)
}));

// Filter by file extension
const flacFiles = hierarchical.directories.map(dir => ({
    ...dir,
    files: dir.files.filter(f => f.extension === 'flac')
}));
```

## Testing

Test the new functionality:

```typescript
import { testHierarchicalTransform, testNewApiMethods } from './slskd-test';

// Test hierarchical transformation
await testHierarchicalTransform(searchId);

// Test new API methods
await testNewApiMethods();
```

## Need Help?

- Check the [README.md](./README.md) for complete documentation
- See [slskd-example.ts](./slskd-example.ts) for example data structures
- Review the [Python wrapper](https://github.com/bigoulours/slskd-python-api) for API details
