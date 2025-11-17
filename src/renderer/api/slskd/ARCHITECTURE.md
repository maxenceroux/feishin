# slskd API Architecture

## Overview

This document describes the architecture of the slskd API integration, including type definitions, data flow, and transformation processes.

## Type Hierarchy

```
SlskdApiResponse<T>
├── Generic wrapper for all API responses
└── Contains: data, status, message

Search Types
├── SlskdSearchState (search request metadata)
│   ├── id, searchText, state
│   ├── fileCount, responseCount
│   └── responses?: SlskdSearchResponse[]
│
├── SlskdSearchResponse (flat response from API)
│   ├── username, uploadSpeed, queueLength
│   ├── files: SlskdSearchResultFile[]
│   └── lockedFiles: SlskdSearchResultFile[]
│
├── SlskdSearchResultFile
│   ├── filename (full path)
│   ├── size, code, extension
│   ├── bitRate, bitDepth, sampleRate
│   └── length, isLocked
│
└── SlskdHierarchicalSearchResult (transformed for UI)
    ├── username, uploadSpeed
    ├── totalFileCount, lockedFileCount
    └── directories: SlskdHierarchicalDirectory[]
        ├── name, path
        ├── files: SlskdHierarchicalFile[]
        ├── subdirectories: SlskdHierarchicalDirectory[]
        ├── totalFileCount
        └── totalSize

Transfer Types
└── SlskdTransfer (downloads/uploads by user)
    ├── username
    └── directories: SlskdTransferredDirectory[]
        ├── directory (path)
        ├── fileCount
        └── files: SlskdTransferredFile[]
            ├── id, filename, size
            ├── state, percentComplete
            ├── bytesTransferred, averageSpeed
            └── startedAt, endedAt
```

## Data Flow

### Search Flow

```
1. Start Search
   User Input → slskdApi.startSearch(query) → API returns searchId

2. Get Search Results
   searchId → slskdApi.getSearchResults(searchId)
   ↓
   API Response (flat structure)
   {
     results: [
       {
         username: "user1",
         files: [
           { filename: "Music/Jazz/Album/Song.mp3", ... }
         ]
       }
     ]
   }

3. Transform for UI (optional)
   Flat Response → transformSearchResponseToHierarchical()
   ↓
   Hierarchical Structure
   {
     username: "user1",
     directories: [
       {
         name: "Music",
         subdirectories: [
           {
             name: "Jazz",
             subdirectories: [
               {
                 name: "Album",
                 files: [{ name: "Song.mp3", ... }]
               }
             ]
           }
         ]
       }
     ]
   }

4. Display in UI
   Hierarchical Structure → Tree View Component
   └── User can expand/collapse directories
   └── User can download individual files or entire folders
```

### Download Flow

```
1. Select Files/Folder
   User clicks download on:
   - Single file → [{ filename, size, code }]
   - Folder → getAllFilesInDirectory() → [{...}, {...}, ...]

2. Enqueue Downloads
   Files Array → slskdApi.downloadFile(username, files)
   ↓
   API enqueues downloads

3. Monitor Progress
   slskdApi.getAllDownloads() or slskdApi.getDownloadsForUser(username)
   ↓
   Returns SlskdTransfer[] with progress information
   └── directories: [{ directory, files: [{ state, percentComplete, ... }] }]

4. Display Progress
   Transfer data → UI components show:
   - Overall progress per directory
   - Individual file progress
   - Download speed
   - Time remaining
```

## File Organization

```
src/renderer/api/slskd/
├── slskd-types.ts           Type definitions
│   ├── API response types
│   ├── Search types (flat and hierarchical)
│   ├── Transfer types
│   └── Validation schemas (Zod)
│
├── slskd-api.ts             API client
│   ├── SlskdApiClient class
│   ├── Authentication (login, token management)
│   ├── Search methods (startSearch, getSearchResults, getSearchState)
│   ├── Download methods (downloadFile, getRecentDownloads, getAllDownloads)
│   └── Management (removeDownload, removeDirectory)
│
├── slskd-utils.ts           Utility functions
│   ├── Directory tree building (buildDirectoryTree)
│   ├── Transformations (transformSearchResponseToHierarchical)
│   ├── File operations (getAllFilesInDirectory)
│   ├── Path utilities (getDirectoryPath, getFileName, getFileExtension)
│   └── Formatting (formatFileSize, formatDuration, formatBitRate, formatSampleRate)
│
├── slskd-example.ts         Example data
│   ├── Example flat response
│   ├── Example hierarchical structure
│   └── Example download usage patterns
│
├── slskd-test.ts            Test functions
│   ├── Connection testing
│   ├── Data fetching tests
│   ├── Hierarchical transformation tests
│   └── New API method tests
│
├── README.md                Main documentation
├── MIGRATION_GUIDE.md       Migration guide
└── ARCHITECTURE.md          This file
```

## API Methods

### Search Methods

```typescript
// Start a new search
startSearch(query: string, options?: { limit?: number; timeout?: number }): Promise<string>
  Returns: searchId (UUID)

// Get search results (responses from users)
getSearchResults(searchId: string): Promise<SlskdSearchResultsResponse>
  Returns: { searchId, searchText, results: SlskdSearchResponse[] }

// Get search state (metadata about the search)
getSearchState(searchId: string, includeResponses?: boolean): Promise<SlskdSearchState>
  Returns: { id, state, fileCount, responseCount, responses?, ... }

// Get list of recent searches
getRecentSearches(limit?: number): Promise<SlskdSearchListResponse>
  Returns: { count, searches: SlskdSearchRequest[] }
```

### Download Methods

```typescript
// Enqueue files for download
downloadFile(username: string, files: Array<{ filename, size, code? }>): Promise<void>

// Get all downloads grouped by user
getAllDownloads(includeRemoved?: boolean): Promise<SlskdTransfer[]>

// Get downloads for specific user
getDownloadsForUser(username: string): Promise<SlskdTransfer>

// Get recent downloads (legacy, for backward compatibility)
getRecentDownloads(limit?: number): Promise<SlskdDownloadListResponse>

// Remove a specific download
removeDownload(username: string, downloadId: string, remove?: boolean): Promise<void>

// Remove all files in a directory
removeDirectory(username: string, directory: string): Promise<void>

// Remove all completed downloads
removeCompletedDownloads(): Promise<void>
```

## Transformation Process

### Flat to Hierarchical

The `buildDirectoryTree()` function transforms flat file lists into hierarchical structures:

```
Input (flat):
[
  { filename: "Music/Jazz/Miles Davis/So What.mp3", size: 1000, ... },
  { filename: "Music/Jazz/Miles Davis/Blue in Green.mp3", size: 1200, ... },
  { filename: "Music/Rock/Beatles/Yesterday.mp3", size: 900, ... }
]

Process:
1. Extract directory paths from filenames
   - "Music/Jazz/Miles Davis"
   - "Music/Rock/Beatles"

2. Create directory objects
   - Music
     - Jazz
       - Miles Davis
     - Rock
       - Beatles

3. Assign files to directories
   - Miles Davis: [So What.mp3, Blue in Green.mp3]
   - Beatles: [Yesterday.mp3]

4. Calculate totals (bottom-up)
   - Miles Davis: 2 files, 2200 bytes
   - Jazz: 2 files, 2200 bytes
   - Beatles: 1 file, 900 bytes
   - Rock: 1 file, 900 bytes
   - Music: 3 files, 3100 bytes

Output (hierarchical):
{
  name: "Music",
  path: "Music",
  totalFileCount: 3,
  totalSize: 3100,
  files: [],
  subdirectories: [
    {
      name: "Jazz",
      path: "Music/Jazz",
      totalFileCount: 2,
      totalSize: 2200,
      files: [],
      subdirectories: [
        {
          name: "Miles Davis",
          path: "Music/Jazz/Miles Davis",
          totalFileCount: 2,
          totalSize: 2200,
          files: [
            { name: "So What.mp3", size: 1000, ... },
            { name: "Blue in Green.mp3", size: 1200, ... }
          ],
          subdirectories: []
        }
      ]
    },
    {
      name: "Rock",
      path: "Music/Rock",
      totalFileCount: 1,
      totalSize: 900,
      files: [],
      subdirectories: [
        {
          name: "Beatles",
          path: "Music/Rock/Beatles",
          totalFileCount: 1,
          totalSize: 900,
          files: [
            { name: "Yesterday.mp3", size: 900, ... }
          ],
          subdirectories: []
        }
      ]
    }
  ]
}
```

## UI Component Patterns

### Tree View Pattern

```typescript
interface TreeNodeProps {
  directory: SlskdHierarchicalDirectory;
  depth: number;
  onDownloadDir: (dir: SlskdHierarchicalDirectory) => void;
  onDownloadFile: (file: SlskdHierarchicalFile) => void;
}

function TreeNode({ directory, depth, onDownloadDir, onDownloadFile }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={{ paddingLeft: depth * 20 }}>
      {/* Directory header */}
      <div onClick={() => setExpanded(!expanded)}>
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} />
        <span>{directory.name}</span>
        <span>({directory.totalFileCount} files)</span>
        <button onClick={() => onDownloadDir(directory)}>
          Download Folder
        </button>
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <div>
          {/* Subdirectories */}
          {directory.subdirectories.map(subdir => (
            <TreeNode
              key={subdir.path}
              directory={subdir}
              depth={depth + 1}
              onDownloadDir={onDownloadDir}
              onDownloadFile={onDownloadFile}
            />
          ))}
          
          {/* Files */}
          {directory.files.map(file => (
            <div key={file.code} style={{ paddingLeft: (depth + 1) * 20 }}>
              <span>{file.name}</span>
              <span>{formatFileSize(file.size)}</span>
              <button onClick={() => onDownloadFile(file)}>Download</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### List View Pattern (Existing)

The current implementation uses a flat list with expandable user rows. This pattern is maintained for backward compatibility.

## Performance Considerations

1. **Hierarchical Transformation**: O(n) where n is number of files
   - Single pass to group files by directory
   - Single pass to build parent-child relationships
   - Single pass to calculate totals

2. **Directory Flattening**: O(n) where n is total number of files in tree
   - Recursive traversal of directory tree
   - Used when downloading entire folders

3. **Memory**: Hierarchical structure has slightly higher memory usage due to:
   - Additional directory objects
   - Duplicate path information
   - Calculated totals (fileCount, size)

4. **Recommendation**: Use hierarchical structure only when needed for tree views. For simple lists, use flat structure.

## Testing Strategy

1. **Unit Tests**: Test individual utility functions
   - Path extraction
   - Directory tree building
   - File filtering

2. **Integration Tests**: Test API methods
   - Search flow
   - Download flow
   - Transformation accuracy

3. **Manual Testing**: Test with real slskd instance
   - Use test functions in slskd-test.ts
   - Verify UI components work correctly
   - Test edge cases (empty results, single file, deep nesting)

## Future Enhancements

1. **Virtual Scrolling**: For large result sets
2. **Lazy Loading**: Load subdirectories on demand
3. **Caching**: Cache directory structures for repeated transformations
4. **Filtering**: Advanced filtering by file type, bitrate, size
5. **Sorting**: Multiple sort options (name, size, date)
6. **Batch Operations**: Download/remove multiple directories at once
7. **Search History**: Save and restore search results
8. **Download Queue Management**: Prioritize, pause, resume downloads
