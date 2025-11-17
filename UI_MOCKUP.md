# Slskd Search Results - UI Mockup

## Desktop View (Full Width)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Search Results                                                [3 users] [245 files] [↻] │
│ "beatles abbey road"                                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│ User / Folder / File                Size/Files    Quality      Duration    Details    Actions          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ▼ 🟢 musiclover42                   10 files      512 KB/s     -           ✅ Free slot    [Download All Files]     │
│                                                                              Queue: 3                              │
│   ▼ 📁 Music                        10 files      -            -           -            [⬇ Folder]                │
│       2.1 GB                                                                                                      │
│     ▼ 📁 Rock                       7 files       -            -           -            [⬇ Folder]                │
│         1.5 GB                                                                                                    │
│       ▼ 📁 The Beatles              3 files       -            -           -            [⬇ Folder]                │
│           750 MB                                                                                                  │
│         ▼ 📁 Abbey Road             3 files       -            -           -            [⬇ Folder]                │
│             750 MB                                                                                                │
│           🎵 01 Come Together.flac  27.3 MB       24bit/96kHz  4:19        FLAC         [⬇]                      │
│           🎵 02 Something.flac      23.7 MB       24bit/96kHz  3:02        FLAC         [⬇]                      │
│           🎵 03 Maxwell's...flac    25.0 MB       24bit/96kHz  3:27        FLAC         [⬇]                      │
│       ▶ 📁 Pink Floyd                2 files       -            -           -            [⬇ Folder]                │
│           500 MB                                                                                                  │
│       ▶ 📁 Led Zeppelin              2 files       -            -           -            [⬇ Folder]                │
│           🔒 250 MB                                                         🔴 Locked                             │
│     ▶ 📁 Jazz                        3 files       -            -           -            [⬇ Folder]                │
│         600 MB                                                                                                    │
│                                                                                                                   │
│ ▼ 🟢 vinyl_collector88              45 files      1.2 MB/s     -           -            [Download All Files]     │
│   ▶ 📁 Vinyl Rips                    45 files      -            -           -            [⬇ Folder]                │
│       8.5 GB                                                                                                      │
│                                                                                                                   │
│ ▼ 🟢 audiofile_pro                  200 files     256 KB/s     -           Queue: 15    [Download All Files]     │
│   ▶ 📁 FLAC Collection               150 files     -            -           -            [⬇ Folder]                │
│       15.2 GB                                                                                                     │
│   ▶ 📁 Hi-Res Audio                  50 files      -            -           -            [⬇ Folder]                │
│       12.8 GB                                                                                                     │
│                                                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Expanded Deep Hierarchy Example

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ▼ 🟢 musiclover42                   10 files      512 KB/s     -           ✅ Free slot    [Download All Files]     │
│   ▼ 📁 Music                        10 files      -            -           -            [⬇ Folder]                │
│     ▼ 📁 Rock                       7 files       -            -           -            [⬇ Folder]                │
│       ▼ 📁 Pink Floyd               2 files       -            -           -            [⬇ Folder]                │
│         ▼ 📁 Dark Side of the Moon  2 files       -            -           -            [⬇ Folder]                │
│           🎵 01 Speak to Me.mp3    4.0 MB        320 kbps     1:30        MP3          [⬇]                      │
│           🎵 02 Breathe.mp3        6.9 MB        320 kbps     2:43        MP3          [⬇]                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Collapsed View (Users Only)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Search Results                                                [3 users] [245 files] [↻] │
│ "beatles abbey road"                                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│ User / Folder / File                Size/Files    Quality      Duration    Details    Actions          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ▶ 🟢 musiclover42                   10 files      512 KB/s     -           ✅ Free slot    [Download All Files]     │
│                                                                              Queue: 3                              │
│                                                                                                                   │
│ ▶ 🟢 vinyl_collector88              45 files      1.2 MB/s     -           -            [Download All Files]     │
│                                                                                                                   │
│ ▶ 🟢 audiofile_pro                  200 files     256 KB/s     -           Queue: 15    [Download All Files]     │
│                                                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Color Coding (Visual Reference)

### Row Colors (Dark Theme)
- **User Row**: `dark-5` (Slightly lighter, header style) - Background: #2C2E33
- **Level 0 Folders**: `dark-7` / `dark-6` alternating - Background: #1A1B1E / #25262B
- **Level 1 Folders**: `dark-6` / `dark-5` alternating - Background: #25262B / #2C2E33
- **Files**: `dark-8` / `dark-7` alternating - Background: #141517 / #1A1B1E

### Icon Colors
- 🟢 **User**: Green (`green`)
- 📁 **Folder**: Yellow (`yellow`)
- 🎵 **File**: Blue (`blue`)
- 🔒 **Locked**: Red (`red`)

### Badge Colors
- ✅ **Free slot**: Green badge
- **Queue**: Light gray badge
- 🔴 **Locked**: Red badge
- **File type** (FLAC, MP3): Outline badge
- **Bit depth** (24bit): Dot badge

## Interaction States

### Hover State
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [HIGHLIGHTED] ▼ 📁 Abbey Road        3 files       -            -           -            [⬇ Folder]                │
│                750 MB                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```
- Entire row highlights on hover
- Cursor changes to pointer
- Visual feedback that row is clickable

### Click Action
```
User clicks folder row → Toggle expand/collapse
User clicks download button → Start download (event.stopPropagation())
```

## Responsive Behavior

### Tablet View (Reduced Width)
```
┌────────────────────────────────────────────────┐
│ Search Results           [3] [245] [↻]         │
│ "beatles abbey road"                           │
├────────────────────────────────────────────────┤
│ User / File         Size      Actions          │
├────────────────────────────────────────────────┤
│ ▼ 🟢 musiclover42   10 files  [⬇ All]          │
│   ▼ 📁 Music        10 files  [⬇]              │
│     🎵 01...flac   27MB      [⬇]              │
└────────────────────────────────────────────────┘
```
- Columns collapse/hide based on priority
- Quality and Duration columns hidden first
- Maintains core functionality

## Loading State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         ⟳                                   │
│                      Loading...                             │
│            Loading search results for                       │
│              "beatles abbey road"                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         🔍                                  │
│                   No results found                          │
│                                                             │
│        No files found for search "beatles abbey road"       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Error State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ⚠️  Error                                                │
│                                                             │
│   Failed to load search results. Please check              │
│   your connection and try again.                           │
│                                                             │
│   Error: Network timeout (10000ms)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Download Feedback

### Success (Console Log)
```javascript
console.log('Download started: 3 files from folder "Abbey Road" (musiclover42)');
```

### Error (Alert - Temporary)
```
┌────────────────────────────────────────────┐
│  Failed to start download. Please check    │
│  your connection and try again.            │
│                                            │
│                  [ OK ]                    │
└────────────────────────────────────────────┘
```

*Note: Alert will be replaced with toast notification in future*

## Key Visual Features

### 1. Indentation
- Each level adds 2rem left padding
- Files add additional 1rem beyond their parent folder
- Creates clear visual hierarchy

### 2. Icons
- Consistent icon usage throughout
- Icons have semantic meaning
- Color-coded for quick recognition

### 3. Expand/Collapse Indicators
- Arrow icons (► / ▼) show state
- Click entire row to toggle
- Smooth transition (no animation in initial version)

### 4. Information Density
- Folder rows: Name, stats, action
- File rows: Name, size, quality, duration, details, action
- User rows: Username, stats, badges, action

### 5. Action Buttons
- Clear labels ("Download", "Download Folder", "Download All Files")
- Distinct visual treatment
- Disabled state for locked files

### 6. Badges
- Color-coded (green = good, red = warning, gray = info)
- Small, non-intrusive
- Provide quick status information

## Accessibility Features

### Keyboard Navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Arrow keys could be added for tree navigation (future)

### Screen Reader Support
- Semantic HTML (table structure)
- Button labels describe action
- Icons have aria-labels
- Row nesting indicated by structure

### Visual Accessibility
- High contrast between text and background
- Icon + text for important actions
- Color not sole indicator of meaning
- Adequate touch target sizes

## Animation (Future Enhancement)

Currently: No animations (instant expand/collapse)

Potential future animations:
- Smooth expand/collapse with height transition
- Fade-in for newly loaded results
- Loading spinner rotation
- Download progress indicators
