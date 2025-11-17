# User Browse Feature - Visual Guide

## Quick Overview

This visual guide shows the user experience flow for the new "Browse User's Shared Folders" feature.

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLSKD SEARCH RESULTS                         │
│                                                                 │
│  Search: "beatles abbey road"                    [3] [245] [↻] │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▼ 🟢 musiclover42     10 files   512 KB/s   ✅ Free slot │ │
│  │                                   [Browse] [All Files ⬇]   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                           ↓ Click "Browse"                      │
│                           ↓                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSE MODAL OPENS                           │
│                                                                 │
│  🟢 Browse musiclover42's Shared Folders                   [✕] │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [25 directories] [1,234 files]      [Download All Files ⬇]    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Folder/File        Size/Files   Quality   Duration  ⬇  │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ▼ 📁 Music         1,234 files     -         -      [⬇]│   │
│  │   ▼ 📁 Rock        450 files       -         -      [⬇]│   │
│  │     ▼ 📁 Beatles   45 files        -         -      [⬇]│   │
│  │       🎵 01.flac   28.5 MB      24/96kHz    4:19    [⬇]│   │
│  │       🎵 02.flac   24.8 MB      24/96kHz    3:02    [⬇]│   │
│  │     ▶ 📁 Floyd     38 files        -         -      [⬇]│   │
│  │   ▶ 📁 Jazz        230 files       -         -      [⬇]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Feature Comparison

### Search Results vs Browse

| Aspect | Search Results | Browse User |
|--------|----------------|-------------|
| **Content** | Files matching search query | ALL files user shares |
| **Scope** | Limited to matches | Complete library |
| **Trigger** | Automatic (search) | Manual (click Browse) |
| **Use Case** | "Find this song" | "See what else they have" |
| **Display** | Tree of matches | Tree of everything |

## User Journey

### Step 1: Search Results
```
User searches for: "beatles abbey road"
├─ Results show users with matching files
├─ Each user row has file count from matches
└─ User sees "Browse" button next to "All Files"
```

### Step 2: Click Browse
```
User clicks "Browse" on musiclover42
├─ Modal opens (loading state shown)
├─ API fetches all shared folders
└─ Tree structure is built
```

### Step 3: Explore Library
```
Modal displays complete folder structure
├─ 25 directories badge
├─ 1,234 files badge
├─ Expandable folder tree
└─ Download buttons everywhere
```

### Step 4: Download Content
```
User can download:
├─ Individual files → Click file's download button
├─ Specific folders → Click folder's download button
└─ Everything → Click "Download All Files"
```

## UI States

### 1. Loading State
```
┌─────────────────────────────────────────┐
│                                         │
│              ⟳ Loading...               │
│                                         │
│   Loading shared folders from           │
│        musiclover42...                  │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Success State (Content)
```
┌─────────────────────────────────────────┐
│ [25 directories] [1,234 files]     [⬇]  │
│                                         │
│ ▼ 📁 Music          1,234 files    [⬇]  │
│   ▼ 📁 Rock         450 files      [⬇]  │
│     🎵 01.flac      28.5 MB        [⬇]  │
│     🎵 02.flac      24.8 MB        [⬇]  │
└─────────────────────────────────────────┘
```

### 3. Error State
```
┌─────────────────────────────────────────┐
│  ⚠️  Error                              │
│                                         │
│  Failed to load user's shared folders.  │
│  The user may be offline or their      │
│  shares may be locked.                 │
│                                         │
│  Error: Network timeout                │
└─────────────────────────────────────────┘
```

### 4. Empty State
```
┌─────────────────────────────────────────┐
│              📁                         │
│                                         │
│       No shared folders                 │
│                                         │
│  User musiclover42 has no shared       │
│  folders available                     │
│                                         │
└─────────────────────────────────────────┘
```

## Interactive Elements

### Browse Button
```
Location: Search Results → User Row
Style: Light variant (secondary)
Icon: 📁 folder
Label: "Browse"
Action: Opens browse modal for that user
```

### Download Buttons in Browse Modal

**Individual File**:
```
🎵 01 Come Together.flac    [⬇]
                            └─ Downloads one file
```

**Folder**:
```
📁 Abbey Road (45 files)    [⬇ Folder]
                            └─ Downloads all 45 files
```

**All Files**:
```
Top of modal:  [Download All Files ⬇]
               └─ Downloads everything from all folders
```

## Data Display

### Count Badges

```
[25 directories]  [1,234 files]
 └─ Informative       └─ Total count
    Visual indicator     across all folders
```

### Folder Stats
```
▼ 📁 Music (1,234 files, 12.5 GB)
  └─ Name   └─ Count    └─ Total size
```

### File Details
```
🎵 01 Come Together.flac | 28.5 MB | 24bit/96kHz | 4:19 | FLAC | [⬇]
└─ Name                  └─ Size   └─ Quality    └─ Dur └─ Type └─ DL
```

## Color Coding

### Icons
- 🟢 Green: User online, has free slots
- 🔴 Red: Locked files
- 📁 Yellow: Folders
- 🎵 Blue: Music files
- 🔒 Red: Locked content

### Badges
- Green: "Free slot" (positive)
- Gray: "Queue: 3" (info)
- Red: "Locked" (warning)
- Blue: File types "FLAC" (info)

### Text
- Bold: User names, folder names
- Normal: File names
- Dim: Metadata (size, duration)

## Responsive Design

### Desktop (Full Width)
```
┌──────────────────────────────────────────────────────────────┐
│ Folder/File   Size/Files   Quality   Duration   Details  ⬇  │
├──────────────────────────────────────────────────────────────┤
│ ▼ Music       1,234        -         -          -        [⬇]│
│   ▼ Rock      450          -         -          -        [⬇]│
│     01.flac   28.5 MB      24/96     4:19       FLAC     [⬇]│
└──────────────────────────────────────────────────────────────┘
```

### Mobile/Tablet (Reduced)
```
┌──────────────────────────────────┐
│ Folder/File      Size       ⬇   │
├──────────────────────────────────┤
│ ▼ Music          12.5 GB   [⬇]  │
│   ▼ Rock         8.2 GB    [⬇]  │
│     01.flac      28.5 MB   [⬇]  │
└──────────────────────────────────┘
```

## Keyboard Navigation

- **Tab**: Navigate between buttons
- **Enter/Space**: Activate focused button
- **Escape**: Close modal
- **Arrow Keys**: Navigate tree (future enhancement)

## Performance Features

### React Query Caching
```
First browse of musiclover42:
├─ Fetches from API (2-5 seconds)
└─ Stores in cache

Second browse of musiclover42:
├─ Loads from cache (instant)
└─ Optionally refetches in background
```

### Lazy Loading
```
Modal closed:
├─ No API calls
└─ No memory usage

Modal opened:
├─ API call triggered
├─ Data fetched
└─ Tree rendered

Modal closed again:
├─ Tree unmounted
└─ Cache retained
```

## Edge Cases Handled

### 1. User with No Shares
```
Modal shows: "No shared folders"
Action: Inform user, no downloads available
```

### 2. User Offline
```
Modal shows: "Failed to load... user may be offline"
Action: Display error message with retry option
```

### 3. Locked/Private Shares
```
Modal shows: "Failed to load... shares may be locked"
Action: Explain user has private sharing enabled
```

### 4. Very Large Library
```
User has 10,000 files in 1,000 folders
├─ All data loads (no pagination yet)
├─ Tree building is efficient (O(n))
└─ Rendering is lazy (only expanded nodes)
```

### 5. Deep Nesting
```
Music/Rock/70s/British/Pink Floyd/1973/The Dark Side of the Moon/
├─ Full path preserved
├─ Hierarchy correctly rendered
└─ Indentation increases per level
```

## Download Flow

### Single File Download
```
User clicks [⬇] on file
    ↓
handleDownloadFile called
    ↓
API: POST /transfers/downloads/{username}
    Body: [{ filename, size, code }]
    ↓
Download queued in slskd
    ↓
Console log: "Download started"
    ↓
User sees download in Downloads tab
```

### Folder Download
```
User clicks [⬇ Folder] on folder
    ↓
handleDownloadFolder called
    ↓
getAllFilesInDirectory() recursively collects files
    ↓
API: POST /transfers/downloads/{username}
    Body: [{ file1 }, { file2 }, ..., { fileN }]
    ↓
All files queued as batch
    ↓
Console log: "Download started: 45 files"
    ↓
All downloads appear in Downloads tab
```

### All Files Download
```
User clicks [Download All Files]
    ↓
handleDownloadAll called
    ↓
For each root directory:
    ├─ getAllFilesInDirectory()
    └─ API call with batch
    ↓
All files from all folders queued
    ↓
Console log: "Download started: 1,234 files"
```

## API Integration

### Browse Request
```http
GET /api/v0/users/musiclover42/browse
Authorization: Bearer {token}
```

### Browse Response
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
        "attributes": [
          { "type": 1, "value": 259 },    // duration
          { "type": 3, "value": 24 },     // bit depth
          { "type": 4, "value": 96000 }   // sample rate
        ]
      }
    ]
  }
]
```

### Download Request
```http
POST /api/v0/transfers/downloads/musiclover42
Authorization: Bearer {token}
Content-Type: application/json

[
  {
    "filename": "Music/Rock/Beatles/01 Come Together.flac",
    "size": 28567234,
    "code": 123
  }
]
```

## Component Architecture

```
SlskdSearchResults
├─ State: browseUsername
├─ Handlers: handleBrowseUser, handleCloseBrowse
├─ Renders:
│  ├─ UserFolderTree (for each user)
│  │  ├─ Props: onBrowseUser callback
│  │  └─ Browse button triggers handleBrowseUser
│  │
│  └─ SlskdUserBrowseModal
│     ├─ Props: username, opened, onClose
│     ├─ useQuery: fetches browse data
│     ├─ Transform: hierarchical structure
│     └─ Renders:
│        └─ FolderTree (recursive)
│           ├─ Folder rows
│           ├─ File rows
│           └─ Download buttons
```

## Summary

The browse feature seamlessly integrates into the existing search results UI, providing users with a powerful way to explore complete music libraries beyond just search matches. The implementation reuses existing components, maintains visual consistency, and handles all edge cases gracefully.

**Key Benefits**:
- 📁 Explore complete user libraries
- 🔢 See accurate folder/file counts
- ⬇️  Download individual files or entire folders
- ⚡ Fast with React Query caching
- 🎨 Consistent UI with search results
- 🛡️  Secure with proper authentication
- 📱 Responsive design
