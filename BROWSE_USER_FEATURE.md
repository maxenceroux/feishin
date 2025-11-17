# User Directory Browsing Feature

## Overview

This document describes the new **User Directory Browsing** feature added to slskd search results. This feature allows users to browse the complete shared folder structure of any user found in search results, not just the files matching the search query.

## Feature Description

### What's New

- **Browse Button**: Added to each user in search results
- **Browse Modal**: Opens when clicking the browse button, displaying all shared folders/files from that user
- **Directory/File Counts**: Shows the number of directories and files the user shares
- **Download Support**: Can download individual files or entire folders from the browse view

### Difference from Search Results

| Feature | Search Results | Browse User |
|---------|---------------|-------------|
| Content | Only files matching search query | ALL shared files/folders |
| Scope | Limited to search matches | Complete user library |
| Use Case | Finding specific content | Exploring user's collection |
| API Endpoint | `/searches/{id}/responses` | `/users/{username}/browse` |

## Implementation Details

### New API Method

**File**: `src/renderer/api/slskd/slskd-api.ts`

```typescript
async browseUser(username: string): Promise<SlskdUserBrowseResponse>
```

Calls the slskd API endpoint: `GET /api/v0/users/{username}/browse`

### New Types

**File**: `src/renderer/api/slskd/slskd-types.ts`

```typescript
interface SlskdUserBrowseResponse {
    username: string;
    directories: SlskdUserDirectory[];
    directoryCount: number;
    fileCount: number;
    isLocked?: boolean;
    lockedDirectoryCount?: number;
}
```

### New Utility Function

**File**: `src/renderer/api/slskd/slskd-utils.ts`

```typescript
function transformBrowseToHierarchical(
    browseResponse: SlskdUserBrowseResponse
): SlskdHierarchicalSearchResult
```

Converts the flat browse API response into the same hierarchical structure used for search results, allowing reuse of existing tree components.

### New Component

**File**: `src/renderer/features/slskd/components/slskd-user-browse-modal.tsx`

```typescript
<SlskdUserBrowseModal 
    username={string}
    opened={boolean}
    onClose={() => void}
/>
```

Modal component that:
- Fetches user's shared folders via API
- Displays hierarchical folder/file tree
- Shows directory and file counts
- Supports downloading files and folders
- Handles loading and error states

### Updated Components

**File**: `src/renderer/features/slskd/components/slskd-folder-tree.tsx`

- Added `onBrowseUser` prop to `UserFolderTree`
- Added "Browse" button next to "All Files" button in user row

**File**: `src/renderer/features/slskd/components/slskd-search-results.tsx`

- Integrated browse modal
- Added state management for selected username
- Passes `onBrowseUser` callback to `UserFolderTree`

## User Flow

1. User performs a search in slskd
2. Search results display users with matching files
3. For each user, there's now a "Browse" button alongside "All Files"
4. Clicking "Browse" opens a modal showing all shared folders/files
5. User can navigate the folder structure
6. User can download individual files or entire folders
7. Modal shows directory count (e.g., "25 directories") and file count (e.g., "1,234 files")

## UI Components

### Search Results - User Row
```
▼ 🟢 musiclover42    10 files    512 KB/s    ✅ Free slot    [Browse] [All Files ⬇]
```

### Browse Modal Header
```
Browse musiclover42's Shared Folders

[25 directories] [1,234 files]                    [Download All Files ⬇]
```

### Browse Modal Content
```
┌─────────────────────────────────────────────────────────────┐
│ Folder / File        Size / Files    Quality    Duration    │
├─────────────────────────────────────────────────────────────┤
│ ▼ 📁 Music            1,234 files     -         -         [⬇]│
│   ▼ 📁 Rock           450 files       -         -         [⬇]│
│     ▼ 📁 Beatles      45 files        -         -         [⬇]│
│       🎵 01.flac      28.5 MB         24/96kHz  4:19      [⬇]│
│       🎵 02.flac      24.8 MB         24/96kHz  3:02      [⬇]│
└─────────────────────────────────────────────────────────────┘
```

## API Response Structure

### Browse API Response (from slskd)

```json
[
  {
    "name": "Music/Rock/Beatles",
    "fileCount": 45,
    "files": [
      {
        "filename": "01 Come Together.flac",
        "size": 28567234,
        "code": 123,
        "extension": "flac",
        "attributeCount": 5,
        "attributes": [
          { "type": 0, "value": 0 },      // Bit rate (0 for lossless)
          { "type": 1, "value": 259 },    // Length (seconds)
          { "type": 3, "value": 24 },     // Bit depth
          { "type": 4, "value": 96000 }   // Sample rate
        ]
      }
    ]
  }
]
```

### Transformed Hierarchical Structure

The `transformBrowseToHierarchical()` function converts this into:

```typescript
{
  username: "musiclover42",
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
              name: "Beatles",
              path: "Music/Rock/Beatles",
              files: [
                {
                  filename: "Music/Rock/Beatles/01 Come Together.flac",
                  name: "01 Come Together.flac",
                  size: 28567234,
                  code: 123,
                  extension: "flac",
                  bitDepth: 24,
                  sampleRate: 96000,
                  length: 259
                }
              ],
              subdirectories: [],
              totalFileCount: 1,
              totalSize: 28567234
            }
          ]
        }
      ]
    }
  ]
}
```

## File Attribute Type Codes

Based on the Soulseek protocol:

| Type | Description | Example |
|------|-------------|---------|
| 0 | Bit rate (kbps) for lossy files | 320 |
| 1 | Length/Duration (seconds) | 259 |
| 2 | VBR (variable bit rate flag) | 0 or 1 |
| 3 | Bit depth for lossless files | 24 |
| 4 | Sample rate (Hz) | 96000 |

## Error Handling

### User Offline
If the user is offline when browse is attempted:
```
Failed to load user's shared folders. The user may be offline 
or their shares may be locked.
```

### Locked Shares
If the user has locked/private shares:
```
Failed to load user's shared folders. The user may be offline 
or their shares may be locked.
```

### Network Error
```
Failed to load user's shared folders. Please check your 
connection and try again.
```

## Performance Considerations

1. **Lazy Loading**: Modal content only loads when opened
2. **React Query Caching**: Browse results cached per username
3. **Component Reuse**: Reuses existing `FolderTree` component
4. **Efficient Tree Building**: O(n) complexity for building hierarchy

## Testing

### Manual Testing Steps

1. Start slskd server
2. Perform a search that returns multiple users
3. Click "Browse" button on a user row
4. Verify modal opens with loading state
5. Verify folder structure displays correctly
6. Verify file counts are accurate
7. Test expanding/collapsing folders
8. Test downloading a single file
9. Test downloading a folder
10. Test downloading all files
11. Test with offline user (should show error)
12. Test closing and reopening modal

### Edge Cases

- User with no shared folders
- User with locked/private shares
- User with deeply nested folder structure
- User with large number of files (performance)
- Network timeout during browse
- Concurrent browse requests

## Future Enhancements

1. **Search within browse results**: Filter files/folders in browse view
2. **Sort options**: Sort by name, size, date
3. **Compare users**: Browse multiple users side-by-side
4. **Favorites**: Save favorite users for quick browse access
5. **Browse history**: Remember recently browsed users
6. **Preview files**: Preview audio files before downloading
7. **Batch operations**: Select multiple files/folders for download
8. **Export list**: Export user's file list to CSV/JSON

## Related Documentation

- [SLSKD_FOLDER_NAVIGATION.md](./SLSKD_FOLDER_NAVIGATION.md) - Hierarchical search results
- [UI_MOCKUP.md](./UI_MOCKUP.md) - UI mockups
- [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) - Component structure

## Technical Notes

### Why Reuse Hierarchical Structure?

The browse API returns a different structure than search results, but we transform it to match the hierarchical search format. This allows us to:

1. Reuse the existing `FolderTree` component
2. Maintain consistent UI/UX between search and browse
3. Leverage existing utility functions for file operations
4. Reduce code duplication

### File Path Construction

The browse API returns:
- Directory name: `"Music/Rock/Beatles"`
- File name: `"01 Come Together.flac"`

We construct the full path:
- `"Music/Rock/Beatles/01 Come Together.flac"`

This allows the existing tree-building logic to work correctly.

### Attribute Extraction

File attributes are returned as an array of `{type, value}` objects. We extract specific attributes by type code and map them to the appropriate fields (`bitRate`, `bitDepth`, `length`, `sampleRate`).

## Code Quality

- ✅ TypeScript strongly typed throughout
- ✅ Follows existing code patterns
- ✅ Consistent with project style
- ✅ Proper error handling
- ✅ Loading states implemented
- ✅ Comments and documentation
- ✅ Reuses existing components
- ✅ Minimal code duplication

## API Compatibility

This feature uses the official slskd API:
- Endpoint: `GET /api/v0/users/{username}/browse`
- Authentication: Bearer token (same as other endpoints)
- Response format: Matches Python wrapper documentation

Reference: https://github.com/bigoulours/slskd-python-api
