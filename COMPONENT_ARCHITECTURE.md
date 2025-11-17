# Slskd Search Results - Component Architecture

## Component Hierarchy

```
SlskdSearchList (existing)
  └─ SlskdSearchResults (refactored)
      └─ Table
          └─ UserFolderTree (NEW) × N users
              ├─ User Header Row (expandable)
              │   ├─ Username + Stats
              │   └─ "Download All Files" button
              │
              └─ FolderTree (NEW) × N root directories
                  ├─ Folder Row (expandable)
                  │   ├─ Folder Name + Stats
                  │   └─ "Download Folder" button
                  │
                  ├─ FolderTree (recursive) × N subdirectories
                  │   └─ ... (recursive structure)
                  │
                  └─ File Rows × N files
                      ├─ File Name + Metadata
                      └─ "Download" button
```

## Data Flow

```
API Response (Flat)
   ↓
   ↓ transformSearchResultsToHierarchical()
   ↓
Hierarchical Structure
   ↓
   ↓ SlskdSearchResults component
   ↓
UserFolderTree × users
   ↓
   ↓ For each root directory
   ↓
FolderTree (recursive)
   ↓
   ├─ Subdirectories → FolderTree (recursive)
   └─ Files → Rendered as rows
```

## State Management

### Component States

#### SlskdSearchResults
- `data` - API query result (managed by React Query)
- `isLoading` - Loading state
- `error` - Error state
- Transforms data: `hierarchicalResults = transformSearchResultsToHierarchical(results)`

#### UserFolderTree
- `isUserExpanded` - Boolean state for user-level expand/collapse
- Props passed down from parent

#### FolderTree (Recursive)
- `isExpanded` - Boolean state for folder expand/collapse
- Default: `level === 0` (root folders expanded by default)
- State maintained independently per folder instance

## Event Handlers

### Download Flow

```
User Action
   ↓
┌──────────────────────────────────────────────┐
│ Download File Button Click                   │
│  → handleDownloadFile(file, username)        │
│     → slskdApi.downloadFile(username, [file]) │
└──────────────────────────────────────────────┘
   
┌──────────────────────────────────────────────┐
│ Download Folder Button Click                 │
│  → handleDownloadFolder(directory, username) │
│     → getAllFilesInDirectory(directory)       │
│        → Returns all files in folder tree    │
│     → slskdApi.downloadFile(username, files)  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Download All User Files Button Click         │
│  → handleDownloadAllUserFiles()              │
│     → For each rootDirectory:                │
│        → handleDownloadFolder(dir, username) │
└──────────────────────────────────────────────┘
```

## Props Flow

### Parent to Child

```typescript
SlskdSearchResults
   │
   ├─ Passes to UserFolderTree:
   │   ├─ username: string
   │   ├─ uploadSpeed: number
   │   ├─ hasFreeUploadSlot: boolean
   │   ├─ queueLength: number
   │   ├─ rootDirectories: SlskdHierarchicalDirectory[]
   │   ├─ totalFileCount: number
   │   ├─ onDownloadFile: (file, username) => void
   │   └─ onDownloadFolder: (directory, username) => void
   │
   └─ UserFolderTree
        │
        ├─ Passes to FolderTree:
        │   ├─ directory: SlskdHierarchicalDirectory
        │   ├─ level: number
        │   ├─ username: string
        │   ├─ onDownloadFile: (file) => void (username curried)
        │   └─ onDownloadFolder: (directory) => void (username curried)
        │
        └─ FolderTree (Recursive)
             │
             └─ Passes to nested FolderTree:
                 ├─ directory: subdirectory
                 ├─ level: level + 1
                 ├─ username: string
                 ├─ onDownloadFile: same
                 └─ onDownloadFolder: same
```

## Visual Styling

### Depth-Based Styling

```typescript
Level 0 (Root Folders)
  - paddingLeft: 2rem
  - backgroundColor: dark-7 / dark-6 (alternating)
  - isExpanded: true (default)

Level 1 (Subdirectories)
  - paddingLeft: 4rem
  - backgroundColor: dark-6 / dark-5 (alternating)
  - isExpanded: false (default)

Level 2+ (Nested)
  - paddingLeft: 6rem, 8rem, etc. (+2rem per level)
  - backgroundColor: continues alternating pattern
  - isExpanded: false (default)

Files
  - paddingLeft: parentLevel * 2 + 3rem
  - backgroundColor: darker than parent folder
```

### Color Coding

- **User Row**: `dark-5` (header style)
- **Even Level Folders**: `dark-7` / `dark-6`
- **Odd Level Folders**: `dark-6` / `dark-5`
- **Files**: `dark-8` / `dark-7` (darker than parent folder)

## Type Safety

### Type Chain

```typescript
SlskdSearchResponse (API)
   ↓ transformSearchResponseToHierarchical()
   ↓
SlskdHierarchicalSearchResult
   ├─ directories: SlskdHierarchicalDirectory[]
   │   ├─ subdirectories: SlskdHierarchicalDirectory[] (recursive)
   │   └─ files: SlskdHierarchicalFile[]
   │
   └─ All operations strongly typed
```

### Type Guards
- All components receive properly typed props
- TypeScript ensures type safety at compile time
- Runtime type errors prevented by Zod schemas (in API layer)

## Performance Optimizations

### Lazy Rendering
- Folders only render children when expanded
- React's virtual DOM efficiently updates only changed rows
- No unnecessary re-renders of collapsed branches

### Efficient Data Structures
- `buildDirectoryTree()` uses Map for O(n) complexity
- Path lookups in O(1) time
- Tree traversal is O(n) where n = total files

### State Optimization
- Each folder maintains independent expand state
- No global state for UI interactions
- React Query handles API caching and refetching

## Testing Strategy

### Unit Tests (Potential)
```typescript
// Test transformation
test('transforms flat results to hierarchical', () => {
  const flat = mockFlatSearchResponse;
  const hierarchical = transformSearchResultsToHierarchical([flat]);
  expect(hierarchical[0].directories).toHaveLength(1);
  expect(hierarchical[0].directories[0].subdirectories).toBeDefined();
});

// Test file collection
test('gets all files in directory tree', () => {
  const directory = mockHierarchicalDirectory;
  const files = getAllFilesInDirectory(directory);
  expect(files).toHaveLength(10);
});
```

### Integration Tests (Potential)
```typescript
// Test component rendering
test('renders folder tree with expand/collapse', async () => {
  render(<UserFolderTree {...mockProps} />);
  
  // User row should be visible
  expect(screen.getByText(mockProps.username)).toBeInTheDocument();
  
  // Click to expand
  await userEvent.click(screen.getByText(mockProps.username));
  
  // Folders should now be visible
  expect(screen.getByText('Music')).toBeInTheDocument();
});
```

## Error Handling

### Download Errors
```typescript
try {
  await slskdApi.downloadFile(username, files);
} catch (error) {
  console.error('Failed to start download:', error);
  alert('Failed to start download. Please check your connection and try again.');
  // TODO: Replace with toast notification
}
```

### API Errors
- Handled by React Query's error state
- Displayed in centered error message with details
- Retry logic built into React Query

## Accessibility

### Keyboard Navigation
- Table rows are interactive with onClick handlers
- Buttons receive focus in tab order
- Enter/Space trigger button actions

### Screen Readers
- Semantic HTML structure (table, tr, td)
- Icon components include aria labels
- Button labels are descriptive

### Visual Indicators
- Icons show expand/collapse state
- Color coding aids visual scanning
- Adequate contrast ratios

## Browser Support

- Modern browsers with ES6+ support
- React 19.x features
- CSS Grid and Flexbox
- No polyfills required for target browsers

## Future Enhancements

### Short Term
1. Toast notifications instead of alert()
2. Loading states for downloads
3. Download progress tracking

### Medium Term
1. Search/filter within folder tree
2. Persist expand/collapse state
3. Sort options (name, size, date)
4. Keyboard shortcuts

### Long Term
1. Virtual scrolling for large trees
2. Drag-and-drop downloads
3. Right-click context menu
4. Batch operations
5. Download queue management
