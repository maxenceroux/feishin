# slskd API Integration

This directory contains the TypeScript client and type definitions for integrating with the slskd API.

## Files

- **slskd-types.ts** - TypeScript type definitions for all slskd API responses
- **slskd-api.ts** - API client for making requests to slskd
- **slskd-utils.ts** - Utility functions for transforming and working with slskd data
- **slskd-example.ts** - Example data structures demonstrating the API responses
- **slskd-test.ts** - Test functions for verifying API connectivity

## Type Definitions

### Core Types

The types are based on the official [slskd Python wrapper](https://github.com/bigoulours/slskd-python-api) to ensure accuracy and compatibility.

#### Search Types

- **SlskdSearchResponse** - A single user's response to a search, containing files that match the query
- **SlskdSearchState** - The state of a search request (in progress, completed, etc.)
- **SlskdSearchResultFile** - A file in search results with metadata (size, bitrate, etc.)

#### Hierarchical Types

For tree view display and subfolder downloads:

- **SlskdHierarchicalSearchResult** - User's search results organized into a directory tree
- **SlskdHierarchicalDirectory** - A directory node with files and subdirectories
- **SlskdHierarchicalFile** - A file with extracted path information

#### Transfer Types

- **SlskdTransfer** - All transfers for a user, grouped by directory
- **SlskdTransferredDirectory** - A directory being transferred
- **SlskdTransferredFile** - A single file transfer with progress information

## Usage Examples

### Starting a Search

```typescript
import { slskdApi } from './slskd-api';

// Start a search
const searchId = await slskdApi.startSearch('Miles Davis Kind of Blue', {
    limit: 100,
    timeout: 30000
});

// Get search results
const results = await slskdApi.getSearchResults(searchId);
console.log(`Found ${results.results.length} users with matching files`);
```

### Transforming to Hierarchical Structure

```typescript
import { transformSearchResponseToHierarchical } from './slskd-utils';

// Get search results
const results = await slskdApi.getSearchResults(searchId);

// Transform each user's results to hierarchical structure
const hierarchical = results.results.map(transformSearchResponseToHierarchical);

// Now you can display as a tree
hierarchical.forEach(userResult => {
    console.log(`User: ${userResult.username}`);
    console.log(`Upload Speed: ${userResult.uploadSpeed} bytes/sec`);
    console.log(`Directories:`);
    
    userResult.directories.forEach(dir => {
        console.log(`  ${dir.name} (${dir.totalFileCount} files)`);
    });
});
```

### Downloading Files

#### Single File

```typescript
// Download a single file
await slskdApi.downloadFile('username', [
    {
        filename: 'Music/Jazz/Miles Davis/Kind of Blue/01 So What.mp3',
        size: 15234567,
        code: 6
    }
]);
```

#### Entire Directory

```typescript
import { getAllFilesInDirectory } from './slskd-utils';

// Get hierarchical results
const hierarchical = transformSearchResponseToHierarchical(searchResponse);

// Find the directory you want to download
const jazzDir = hierarchical.directories[0].subdirectories.find(
    d => d.name === 'Jazz'
);

if (jazzDir) {
    // Get all files in directory and subdirectories
    const allFiles = getAllFilesInDirectory(jazzDir);
    
    // Convert to download format
    const filesToDownload = allFiles.map(f => ({
        filename: f.filename,
        size: f.size,
        code: f.code
    }));
    
    // Download all files
    await slskdApi.downloadFile(hierarchical.username, filesToDownload);
}
```

### Getting Download Status

```typescript
// Get all downloads
const transfers = await slskdApi.getAllDownloads();

transfers.forEach(transfer => {
    console.log(`User: ${transfer.username}`);
    
    transfer.directories.forEach(dir => {
        console.log(`  Directory: ${dir.directory}`);
        console.log(`  Files: ${dir.fileCount}`);
        
        dir.files.forEach(file => {
            console.log(`    ${file.filename}: ${file.percentComplete}%`);
        });
    });
});
```

## UI Implementation Suggestions

### Tree View Component

For displaying search results in a collapsible tree view:

```typescript
interface TreeNodeProps {
    directory: SlskdHierarchicalDirectory;
    username: string;
    onDownloadDirectory: (dir: SlskdHierarchicalDirectory) => void;
    onDownloadFile: (file: SlskdHierarchicalFile) => void;
}

function DirectoryTreeNode({ directory, username, onDownloadDirectory, onDownloadFile }: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div className="tree-node">
            <div className="tree-node-header">
                <button onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? '▼' : '▶'}
                </button>
                <span className="directory-name">{directory.name}</span>
                <span className="directory-info">
                    {directory.totalFileCount} files, {formatFileSize(directory.totalSize)}
                </span>
                <button onClick={() => onDownloadDirectory(directory)}>
                    Download Folder
                </button>
            </div>
            
            {isExpanded && (
                <div className="tree-node-content">
                    {/* Subdirectories */}
                    {directory.subdirectories.map(subdir => (
                        <DirectoryTreeNode
                            key={subdir.path}
                            directory={subdir}
                            username={username}
                            onDownloadDirectory={onDownloadDirectory}
                            onDownloadFile={onDownloadFile}
                        />
                    ))}
                    
                    {/* Files */}
                    {directory.files.map(file => (
                        <div key={file.code} className="tree-file">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{formatFileSize(file.size)}</span>
                            {file.bitRate && <span>{formatBitRate(file.bitRate)}</span>}
                            {file.length && <span>{formatDuration(file.length)}</span>}
                            <button onClick={() => onDownloadFile(file)}>Download</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

### Handling Directory Downloads

```typescript
function SearchResultsView() {
    const handleDownloadDirectory = async (
        directory: SlskdHierarchicalDirectory,
        username: string
    ) => {
        // Get all files in directory tree
        const allFiles = getAllFilesInDirectory(directory);
        
        // Convert to API format
        const filesToDownload = allFiles.map(f => ({
            filename: f.filename,
            size: f.size,
            code: f.code
        }));
        
        // Enqueue downloads
        try {
            await slskdApi.downloadFile(username, filesToDownload);
            showNotification({
                title: 'Download Started',
                message: `Downloading ${allFiles.length} files from ${directory.name}`
            });
        } catch (error) {
            showNotification({
                title: 'Download Failed',
                message: error.message,
                color: 'red'
            });
        }
    };
    
    // ... rest of component
}
```

### Grouped View (by genre/artist/album)

The hierarchical structure naturally supports organizing by:
- Genre → Artist → Album → Files
- Artist → Album → Files
- Any custom directory structure the user has

Since the structure is parsed from actual file paths, it preserves the original organization.

### Search Filters

```typescript
function filterSearchResults(
    results: SlskdHierarchicalSearchResult[],
    filters: {
        minBitRate?: number;
        maxFileSize?: number;
        fileExtensions?: string[];
        hasFreeSlotsOnly?: boolean;
    }
): SlskdHierarchicalSearchResult[] {
    return results
        .filter(result => {
            // Filter by free slots
            if (filters.hasFreeSlotsOnly && !result.hasFreeUploadSlot) {
                return false;
            }
            return true;
        })
        .map(result => ({
            ...result,
            directories: result.directories
                .map(dir => filterDirectory(dir, filters))
                .filter(dir => dir.totalFileCount > 0)
        }))
        .filter(result => result.directories.length > 0);
}

function filterDirectory(
    dir: SlskdHierarchicalDirectory,
    filters: any
): SlskdHierarchicalDirectory {
    const filteredFiles = dir.files.filter(file => {
        if (filters.minBitRate && file.bitRate && file.bitRate < filters.minBitRate) {
            return false;
        }
        if (filters.maxFileSize && file.size > filters.maxFileSize) {
            return false;
        }
        if (filters.fileExtensions && file.extension) {
            return filters.fileExtensions.includes(file.extension);
        }
        return true;
    });
    
    const filteredSubdirs = dir.subdirectories
        .map(subdir => filterDirectory(subdir, filters))
        .filter(subdir => subdir.totalFileCount > 0);
    
    return {
        ...dir,
        files: filteredFiles,
        subdirectories: filteredSubdirs,
        totalFileCount: filteredFiles.length + 
            filteredSubdirs.reduce((sum, d) => sum + d.totalFileCount, 0)
    };
}
```

## Data Flow

1. **Search** → API returns flat list of files per user
2. **Transform** → Convert flat list to hierarchical tree using `transformSearchResponseToHierarchical()`
3. **Display** → Render tree view with directories and files
4. **Download** → User can download individual files or entire directories
5. **Monitor** → Track download progress via `getAllDownloads()` or `getDownloadsForUser()`

## Utility Functions

The `slskd-utils.ts` file provides helpful utilities:

- `buildDirectoryTree()` - Converts flat file list to hierarchical structure
- `getAllFilesInDirectory()` - Gets all files in a directory tree (flattened)
- `formatFileSize()` - Formats bytes to human-readable size
- `formatDuration()` - Formats seconds to MM:SS or HH:MM:SS
- `formatBitRate()` - Formats bitrate with units
- `formatSampleRate()` - Formats sample rate in kHz

## Testing

```typescript
import { testSlskdConnection, testSlskdData } from './slskd-test';

// Test connection
const connected = await testSlskdConnection();
console.log('Connected:', connected);

// Test data retrieval
const data = await testSlskdData();
console.log('Searches:', data.searches);
console.log('Downloads:', data.downloads);
```

## References

- [slskd API Documentation](https://github.com/slskd/slskd)
- [slskd Python Wrapper](https://github.com/bigoulours/slskd-python-api)
- [Soulseek Protocol](https://github.com/slskd/slskd/wiki)
