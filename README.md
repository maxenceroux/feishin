# NoisePort

Desktop music player with discovery and peer-to-peer downloading.

## Overview

NoisePort is an Electron-based desktop music player forked from [Feishin](https://github.com/jeffvli/feishin). It connects to self-hosted music servers (Navidrome, Jellyfin, OpenSubsonic) and adds Spotify browsing for discovery and Soulseek integration for P2P downloading. Supports local MPV playback, browser-based playback, and remote MPD output.

## Tech Stack

- TypeScript, React, Electron (electron-vite)
- Mantine v8 (UI), AG Grid (virtual tables)
- Zustand v5 (state), TanStack Query v4 (data fetching)
- node-mpv (local playback), mpc-js (MPD remote)
- pnpm

## Prerequisites

- Node.js >= 23
- pnpm
- MPV (for local playback)

## Getting Started

```bash
make install
make dev
```

## Usage

```bash
make dev          # Start development server
make dev-watch    # Dev with HMR for main/preload
make build        # Build for production
make package      # Package for current platform
make lint         # Run ESLint + Stylelint
make lint-fix     # Auto-fix lint issues
make typecheck    # Type check all projects
make i18n         # Generate i18n files
```

## Deployment

Packaged as desktop app via electron-builder. Platform-specific packaging:
- `pnpm run package:mac`
- `pnpm run package:linux`
- `pnpm run package:win`

## Architecture

```
src/
├── main/           # Main process (Node.js) — window management, IPC
│   └── features/
│       ├── core/       # Lyrics, Discord RPC, settings, remote server
│       └── playback/   # MPD playback service and IPC handlers
├── preload/        # Context bridge — exposes APIs to renderer
├── renderer/       # React frontend
│   ├── api/            # Server API clients (Jellyfin, Navidrome, Subsonic, Spotify, Soulseek)
│   ├── features/       # Feature modules (player, albums, playlists, discover, slskd)
│   ├── store/          # Zustand stores (player, settings, auth)
│   └── hooks/          # Custom React hooks
├── remote/         # Standalone remote control web app
└── shared/         # Types, components, utilities shared between processes
```

Playback modes: LOCAL (MPV), WEB (browser audio), REMOTE_MPD (remote MPD server).

## License

GPL-3.0.
