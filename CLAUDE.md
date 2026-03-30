# CLAUDE.md

## Project Overview

Electron desktop music player, forked from Feishin. TypeScript + React + electron-vite. Connects to Navidrome/Jellyfin/OpenSubsonic servers, adds Spotify discovery and Soulseek P2P downloading. Supports MPV, web audio, and remote MPD playback.

## Commands

```bash
make install    # Install dependencies (pnpm)
make dev        # Start development server
make dev-watch  # Dev with HMR for main/preload
make build      # Production build (typecheck + electron + remote)
make build-web  # Standalone web app build
make package    # Package for current platform
make lint       # ESLint + Stylelint
make lint-fix   # Auto-fix lint issues
make typecheck  # Type check all projects
make i18n       # Generate i18n files
make clean      # Remove dist + out + node_modules
```

## Architecture

```
src/
├── main/           # Main process (Node.js)
│   └── features/
│       ├── core/       # Lyrics, Discord RPC, settings, remote server
│       ├── playback/   # MPD playback service and IPC handlers
│       └── {darwin,linux,win32}/  # Platform-specific code
├── preload/        # Context bridge (exposes APIs to renderer)
├── renderer/       # React frontend
│   ├── api/            # Server API clients + Spotify/Soulseek clients
│   │   └── controller.ts  # Dispatches by ServerType
│   ├── features/       # Feature modules (player, albums, playlists, discover, slskd)
│   ├── store/          # Zustand stores (player, settings, auth)
│   └── hooks/          # Custom React hooks
├── remote/         # Standalone remote control web app
└── shared/         # Types, components, utilities shared between processes
```

## Conventions

- **Indentation**: Tabs
- **Quotes**: Single quotes
- **Semicolons**: Required
- **CSS Modules**: camelCase (`styles.myClass`)
- **Path aliases**: `/@/renderer`, `/@/main`, `/@/shared`, `/@/preload`

## Playback Modes

`PlaybackType` enum in `src/shared/types/types.ts`:
- **LOCAL** — MPV player on desktop
- **WEB** — browser-based audio
- **REMOTE_MPD** — remote MPD server control

## IPC Communication

Preload scripts expose APIs via `contextBridge`:
- Renderer access: `window.api.mpvPlayer`, `window.api.mpdPlayer`, etc.
- Main process handlers: `src/main/index.ts` and `src/main/features/`

## Server API Pattern

When adding API functionality:
1. Define types in `src/shared/types/domain-types.ts`
2. Add endpoint to `src/shared/types/features-types.ts`
3. Implement in each server controller (`jellyfin-controller.ts`, `navidrome-controller.ts`, `subsonic-controller.ts`)
4. Export via `controller.ts`

## MPD Remote Playback

- `MpdPlaybackService` maintains queue mapping (MPD index -> NoisePort queue ID)
- Songs converted to authenticated HTTP stream URLs for MPD to fetch
- Status polling every 1.5s (MPD has no push notifications for position)
- Reconnection: exponential backoff (1s -> 30s max), up to 10 attempts

## Key Dependencies

- `electron`, `electron-vite` — app shell + build
- `@mantine/core` — UI framework
- `ag-grid-react` — virtual tables
- `zustand` — state management
- `@tanstack/react-query` — data fetching
- `node-mpv` — local playback
- `mpc-js` — MPD client
