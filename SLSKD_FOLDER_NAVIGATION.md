# Slskd Search Results - Hierarchical Folder Navigation

## Overview

This document describes the refactored slskd search results feature that now supports **nested folder navigation** and **folder-level downloads**.

## What Changed

### Before
- Search results displayed as a flat list of files per user
- Users could only see and download individual files
- No folder structure or hierarchy visible
- Difficult to understand file organization

### After
- Search results display full folder hierarchy (user → directory → subdirectory → files)
- Users can expand/collapse folders to navigate the structure
- Download entire folders or subfolders with a single click
- Clear visual hierarchy with indentation and icons
- Better user experience for browsing shared music libraries

## New Components

### 1. `FolderTree` Component
**Location**: `src/renderer/features/slskd/components/slskd-folder-tree.tsx`

Recursive component that renders a directory and its contents:
- Shows folder name, file count, and total size
- Expandable/collapsible folder rows
- Recursively renders subdirectories
- Displays files within each directory
- Visual indentation based on folder depth
- Alternating background colors for readability

**Props:**
```typescript
interface FolderTreeProps {
    directory: SlskdHierarchicalDirectory;
    level?: number;
    onDownloadFile: (file: SlskdHierarchicalFile) => void;
    onDownloadFolder: (directory: SlskdHierarchicalDirectory) => void;
    username: string;
}
```

### 2. `UserFolderTree` Component
**Location**: `src/renderer/features/slskd/components/slskd-folder-tree.tsx`

Top-level component that displays user information and their root directories:
- User header with stats (upload speed, queue length, free slots)
- Expandable/collapsible user row
- "Download All Files" button to download everything from a user
- Renders all root directories for the user

**Props:**
```typescript
interface UserFolderTreeProps {
    username: string;
    uploadSpeed: number;
    hasFreeUploadSlot: boolean;
    queueLength: number;
    rootDirectories: SlskdHierarchicalDirectory[];
    totalFileCount: number;
    onDownloadFile: (file: SlskdHierarchicalFile, username: string) => void;
    onDownloadFolder: (directory: SlskdHierarchicalDirectory, username: string) => void;
}
```

## Updated Components

### `SlskdSearchResults` Component
**Location**: `src/renderer/features/slskd/components/slskd-search-results.tsx`

Major refactoring to support hierarchical display:

**Key Changes:**
1. Uses `transformSearchResultsToHierarchical()` to convert flat API responses
2. Replaced `ExpandableUserRow` with `UserFolderTree` component
3. Added `handleDownloadFolder()` to download entire folder trees
4. Updated table headers to reflect hierarchical structure
5. Uses strongly-typed hierarchical interfaces

**New Handler Functions:**
```typescript
// Download a single file
handleDownloadFile(file: SlskdHierarchicalFile, username: string): Promise<void>

// Download entire folder with all nested files
handleDownloadFolder(directory: SlskdHierarchicalDirectory, username: string): Promise<void>
```

## TypeScript Types Used

All types are defined in `src/renderer/api/slskd/slskd-types.ts`:

### `SlskdHierarchicalFile`
Represents a file in the hierarchical structure:
```typescript
interface SlskdHierarchicalFile {
    filename: string;        // Full path
    name: string;           // Just filename
    size: number;           // Bytes
    code: number;           // File identifier
    extension?: string;     // File extension
    bitRate?: number;       // For lossy audio (kbps)
    bitDepth?: number;      // For lossless audio
    length?: number;        // Duration in seconds
    sampleRate?: number;    // Hz
    isLocked?: boolean;     // Whether file is locked
}
```

### `SlskdHierarchicalDirectory`
Represents a directory with nested structure:
```typescript
interface SlskdHierarchicalDirectory {
    name: string;                                  // Directory name
    path: string;                                  // Full path
    files: SlskdHierarchicalFile[];               // Files in this directory
    subdirectories: SlskdHierarchicalDirectory[]; // Nested subdirectories
    totalFileCount: number;                       // Total files (including subdirs)
    totalSize: number;                            // Total size in bytes
}
```

### `SlskdHierarchicalSearchResult`
Represents a user's complete search results:
```typescript
interface SlskdHierarchicalSearchResult {
    username: string;
    uploadSpeed: number;                          // bytes/sec
    hasFreeUploadSlot: boolean;
    queueLength: number;
    directories: SlskdHierarchicalDirectory[];    // Root directories
    totalFileCount: number;
    lockedFileCount: number;
    token: number;
}
```

## Utility Functions

### `transformSearchResultsToHierarchical()`
**Location**: `src/renderer/api/slskd/slskd-utils.ts`

Transforms flat API responses into hierarchical structures:
```typescript
transformSearchResultsToHierarchical(
    responses: SlskdSearchResponse[]
): SlskdHierarchicalSearchResult[]
```

### `getAllFilesInDirectory()`
**Location**: `src/renderer/api/slskd/slskd-utils.ts`

Recursively collects all files from a directory tree:
```typescript
getAllFilesInDirectory(
    directory: SlskdHierarchicalDirectory
): SlskdHierarchicalFile[]
```

### `buildDirectoryTree()`
**Location**: `src/renderer/api/slskd/slskd-utils.ts`

Builds hierarchical directory structure from flat file list:
```typescript
buildDirectoryTree(
    files: SlskdSearchResultFile[]
): SlskdHierarchicalDirectory[]
```

## UI/UX Features

### Visual Hierarchy
- **Indentation**: Increases with each folder level (2rem per level)
- **Icons**: 
  - 🟢 User icon for user rows
  - 📁 Folder icon for directory rows
  - 🎵 Music note icon for file rows
  - 🔒 Lock icon for locked files
- **Colors**: Alternating background colors by depth level
- **Arrows**: Visual indicators for expand/collapse state

### Interaction
- **Expand/Collapse**: Click on user or folder row
- **Download File**: Click download button on file row
- **Download Folder**: Click download button on folder row (downloads all nested files)
- **Download All**: Click "All Files" button on user row (downloads everything)

### Download Actions
1. **Single File**: Downloads one file
2. **Folder**: Downloads all files in folder + all subdirectories recursively
3. **All User Files**: Downloads all files from all root directories

## Example Usage

See `src/renderer/features/slskd/components/slskd-folder-tree.example.tsx` for complete examples.

### Basic Usage
```typescript
import { UserFolderTree } from './slskd-folder-tree';
import { transformSearchResultsToHierarchical } from '/@/renderer/api/slskd/slskd-utils';

// Transform flat API response
const hierarchicalResults = transformSearchResultsToHierarchical(apiResults);

// Render hierarchical tree
<UserFolderTree
    username={result.username}
    uploadSpeed={result.uploadSpeed}
    hasFreeUploadSlot={result.hasFreeUploadSlot}
    queueLength={result.queueLength}
    rootDirectories={result.directories}
    totalFileCount={result.totalFileCount}
    onDownloadFile={handleDownloadFile}
    onDownloadFolder={handleDownloadFolder}
/>
```

## Example Data Structure

```javascript
{
  username: "musiclover42",
  uploadSpeed: 524288,
  hasFreeUploadSlot: true,
  queueLength: 3,
  totalFileCount: 10,
  directories: [
    {
      name: "Music",
      path: "Music",
      files: [],
      subdirectories: [
        {
          name: "Rock",
          path: "Music/Rock",
          files: [],
          subdirectories: [
            {
              name: "The Beatles",
              path: "Music/Rock/The Beatles",
              files: [],
              subdirectories: [
                {
                  name: "Abbey Road",
                  path: "Music/Rock/The Beatles/Abbey Road",
                  files: [
                    {
                      filename: "Music/Rock/The Beatles/Abbey Road/01 Come Together.flac",
                      name: "01 Come Together.flac",
                      size: 28567234,
                      code: 1,
                      extension: "flac",
                      bitDepth: 24,
                      sampleRate: 96000,
                      length: 259
                    }
                  ],
                  subdirectories: [],
                  totalFileCount: 3,
                  totalSize: 79695479
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Testing

### Unit Testing
The transformation logic can be tested with the example data in:
- `src/renderer/api/slskd/slskd-example.ts`

### Integration Testing
Test with actual slskd API:
```typescript
import { testHierarchicalTransform } from '/@/renderer/api/slskd/slskd-test';

// Test transformation with real search results
await testHierarchicalTransform(searchId);
```

## Performance Considerations

1. **Lazy Rendering**: Folders and files are only rendered when expanded
2. **Memoization**: React's built-in memoization helps prevent unnecessary re-renders
3. **Efficient Tree Building**: `buildDirectoryTree()` uses Maps for O(n) complexity
4. **Batch Downloads**: Folder downloads send all files in a single API call

## Future Enhancements

Potential improvements:
1. Add search/filter within folder tree
2. Remember expand/collapse state across refreshes
3. Sort folders by name, size, or file count
4. Show progress bars for folder downloads
5. Add context menu for additional actions
6. Support drag-and-drop for downloads
7. Add keyboard shortcuts for navigation

## Browser Compatibility

Works with all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid and Flexbox
- React 19.x

## Dependencies

- React 19.1.0+
- Mantine UI 8.2.8+
- Existing slskd API client
- TypeScript 5.8.3+

## Migration Notes

### For Developers
- Old flat API responses are automatically transformed to hierarchical
- No changes needed to API client
- All existing TypeScript types remain backwards compatible
- Component props use strongly-typed interfaces

### For Users
- Search results now show full folder structure by default
- Click on folders to expand/collapse
- Use folder download buttons to get complete albums/directories
- No change to search functionality - only display improvements
