# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoisePort is an Electron-based desktop music player, forked from Feishin. It connects to self-hosted music servers (Navidrome, Jellyfin, OpenSubsonic) and adds music discovery features via Spotify browsing and Soulseek P2P downloading.

## Development Commands

```bash
pnpm run dev          # Start development server
pnpm run dev:watch    # Development with HMR for main/preload
pnpm run build        # Full production build (typecheck + electron + remote)
pnpm run lint         # Run ESLint and Stylelint
pnpm run lint:fix     # Fix linting errors
pnpm run typecheck    # Type check all projects
pnpm run package      # Build and package for current platform
```

## Architecture

### Process Structure (Electron)

```
src/
├── main/           # Main process (Node.js) - window management, IPC handlers
│   └── features/
│       ├── core/       # Lyrics fetching, Discord RPC, settings, remote server
│       ├── playback/   # MPD playback service and IPC handlers
│       └── {darwin,linux,win32}/  # Platform-specific code
├── preload/        # Context bridge - exposes APIs to renderer securely
│   ├── mpv-player.ts   # MPV control API
│   ├── mpd-player.ts   # MPD control API
│   └── ...
├── renderer/       # React frontend (browser context)
├── remote/         # Standalone remote control web app
└── shared/         # Types, components, utilities shared between processes
```

### Renderer Structure

- **`api/`** - Server API clients (Jellyfin, Navidrome, Subsonic) + Spotify/Soulseek clients
  - `controller.ts` dispatches to server-specific implementations based on `ServerType`
- **`features/`** - Feature modules (player, albums, playlists, discover, slskd, etc.)
- **`store/`** - Zustand stores: `player.store.ts` (queue, playback state), `settings.store.ts`, `auth.store.ts`
- **`hooks/`** - Custom React hooks
- **`router/`** - React Router configuration

### Playback Types

The app supports three playback modes (see `PlaybackType` enum in `src/shared/types/types.ts`):
- **LOCAL** - MPV player running on desktop
- **WEB** - Browser-based audio playback
- **REMOTE_MPD** - Remote MPD server control

### IPC Communication

Preload scripts in `src/preload/` expose APIs via `contextBridge`:
- Access in renderer: `window.api.mpvPlayer`, `window.api.mpdPlayer`, etc.
- Main process handlers are in `src/main/index.ts` and `src/main/features/`

## Code Conventions

- **Indentation**: Tabs
- **Quotes**: Single quotes
- **Semicolons**: Required
- **CSS Modules**: camelCase convention (`styles.myClass`)
- **Path aliases**: `/@/renderer`, `/@/main`, `/@/shared`, `/@/preload`

## Key Dependencies

- **UI**: Mantine v8, AG Grid (virtual tables)
- **State**: Zustand v5
- **Data Fetching**: TanStack React Query v4
- **Playback**: node-mpv (local), mpc-js (MPD)
- **Build**: electron-vite, Vite

## Server API Pattern

When adding API functionality:
1. Define types in `src/shared/types/domain-types.ts`
2. Add endpoint to `src/shared/types/features-types.ts` (ControllerEndpoint interface)
3. Implement in each server controller (`jellyfin-controller.ts`, `navidrome-controller.ts`, `subsonic-controller.ts`)
4. Export via `controller.ts`

## MPD Remote Playback Integration

### Overview

MPD (Music Player Daemon) support allows NoisePort to send playback to a remote MPD server (e.g. a Raspberry Pi with speakers). The app acts as an MPD client: it converts its internal queue into HTTP stream URLs from the music server (Navidrome/Jellyfin) and tells MPD to play them. The underlying library is `mpc-js` (TCP client).

### File Map

| Layer | File | Role |
|-------|------|------|
| Main process | `src/main/features/playback/mpd-playback-service.ts` | `MpdPlaybackService` class — TCP connection, command execution, status polling, reconnect logic |
| Main process | `src/main/features/playback/mpd-ipc-handlers.ts` | Registers IPC handlers (`mpd-connect`, `mpd-play`, `mpd-set-queue`, etc.) and forwards events back to renderer |
| Main process | `src/main/features/playback/types.ts` | `IPlaybackService` interface implemented by MPV, Web, and MPD backends |
| Preload | `src/preload/mpd-player.ts` | Context bridge — exposes `mpdPlayer` (commands) and `mpdPlayerListener` (events) on `window.api` |
| Renderer hook | `src/renderer/hooks/use-mpd-playback.ts` | Orchestrator — watches player store and routes changes (play/pause, volume, queue, track index) to MPD via IPC |
| Renderer hook | `src/renderer/hooks/use-mpd-status-sync.ts` | Receives MPD status polls (every 1.5s) and updates the player store (position, duration, state) |
| Renderer hook | `src/renderer/hooks/use-mpd-connection.ts` | Tracks connection state (`connected`/`connecting`/`disconnected`/`error`) for UI indicators |
| Renderer | `src/renderer/features/player/mpd-queue-sync.ts` | `convertToMpdQueue()` — converts NoisePort songs to `MpdQueueItem[]` with stream URLs; `buildStreamUrl()` — builds authenticated HTTP URLs respecting transcoding settings |
| UI component | `src/renderer/features/player/components/playback-output-selector.tsx` | Dropdown to switch between Local / Remote MPD / Web playback |
| UI component | `src/renderer/features/player/components/playback-output-indicator.tsx` | Connection status badge (green/yellow/red dot) |
| Settings UI | `src/renderer/features/settings/components/playback/remote-targets-settings.tsx` | MPD config form: enable toggle, host, port, password, test connection button |
| Settings UI | `src/renderer/features/settings/components/playback/audio-settings.tsx` | Playback type selector (MPV / Remote MPD / Web) |
| Store | `src/renderer/store/settings.store.ts` | Persists `playback.remoteTargets.mpd` (`enabled`, `host`, `port`, `password`) |
| Types | `src/shared/types/types.ts` | `PlaybackType` enum: `LOCAL`, `WEB`, `REMOTE_MPD` |
| App init | `src/renderer/app.tsx` | Mounts `useMpdPlayback()` and `useMpdStatusSync()` hooks globally |

### Data Flow

```
User action (play/pause/queue change/volume)
  → Zustand player store updates
  → use-mpd-playback hook detects change via refs
  → Calls window.api.mpdPlayer.play() / setQueue() / etc.
  → IPC send/invoke → Main process handler (mpd-ipc-handlers.ts)
  → MpdPlaybackService sends TCP command to MPD
  → MPD fetches audio via HTTP stream URLs from Navidrome/Jellyfin

MPD status feedback (every 1.5s):
  → MpdPlaybackService polls getStatus()
  → Emits 'status' event → IPC webContents.send('renderer-mpd-status')
  → use-mpd-status-sync receives → updates player store (position, state)
  → UI re-renders with current playback position
```

### IPC Channels

**Request-response** (`ipcRenderer.invoke` / `ipcMain.handle`):
- `mpd-connect` — connect with config, returns `{ success, error? }`
- `mpd-disconnect` — close connection
- `mpd-is-connected` — returns boolean
- `mpd-test-connection` — test config without persisting
- `mpd-get-status` — returns current `MpdStatus`

**Fire-and-forget** (`ipcRenderer.send` / `ipcMain.on`):
- `mpd-play`, `mpd-pause`, `mpd-stop`, `mpd-next`, `mpd-previous`
- `mpd-seek`, `mpd-set-volume`
- `mpd-set-queue`, `mpd-add-to-queue`, `mpd-clear-queue`

**Events from main → renderer** (`webContents.send`):
- `renderer-mpd-status` — periodic status updates
- `renderer-mpd-connected`, `renderer-mpd-disconnected`, `renderer-mpd-error`
- `renderer-mpd-play`, `renderer-mpd-pause`, `renderer-mpd-stop`
- `renderer-mpd-next`, `renderer-mpd-previous`, `renderer-mpd-seek`, `renderer-mpd-volume`
- `renderer-mpd-queue` — queue modification confirmations

### How to Enable

1. **Settings → Playback → Remote Targets**: toggle "Enable MPD Remote" on
2. Enter **Host** (IP or hostname), **Port** (default 6600), optional **Password**
3. Use **Test Connection** to verify connectivity
4. **Settings → Playback → Audio**: change playback type to "Remote MPD"

### Settings and Their Effects

| Setting | Store path | Effect |
|---------|-----------|--------|
| Enable MPD | `playback.remoteTargets.mpd.enabled` | Gates all MPD functionality; hooks are no-ops when disabled |
| Host | `playback.remoteTargets.mpd.host` | IP/hostname for TCP connection to MPD server |
| Port | `playback.remoteTargets.mpd.port` | TCP port (default 6600) |
| Password | `playback.remoteTargets.mpd.password` | Sent after TCP connect for auth; empty = no auth |
| Playback Type | `playback.type` | `REMOTE_MPD` activates MPD hooks. Cannot switch while playing. Only one mode active at a time |
| Transcoding | `playback.transcode` | Affects stream URLs built by `buildStreamUrl()` — MPD receives transcoded or original stream URLs |

### Key Design Details

- **Queue mapping**: `MpdPlaybackService` maintains a `queueMapping` object (`mpdIndex → noisePortQueueId`) to correlate MPD's queue positions with NoisePort's internal queue item IDs
- **Stream URLs**: Queue sync converts each song to an HTTP stream URL (authenticated, with optional transcoding) that MPD can fetch directly from the music server
- **Reconnection**: Exponential backoff (1s → 2s → 4s → ... → 30s max), up to 10 attempts
- **Status polling**: Every 1.5s since MPD protocol lacks push notifications for playback position
- **Track navigation**: Adjacent changes (±1) use `next()`/`previous()` commands; larger jumps resync the entire queue with a new start index
- **Ref-based change detection**: `use-mpd-playback` uses `useRef` (`prevStatusRef`, `prevIndexRef`, etc.) to detect store changes without causing re-renders
