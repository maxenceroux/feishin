/**
 * MPD Player IPC Handlers
 * Handles IPC communication between renderer and MPD playback service
 */

import { BrowserWindow, ipcMain } from 'electron';

import { MpdConfig, MpdPlaybackService } from './mpd-playback-service';
import { PlaybackEvent } from './types';

let mpdService: MpdPlaybackService | null = null;

/**
 * Cleanup MPD service on app quit
 */
export async function cleanupMpdService(): Promise<void> {
    if (mpdService) {
        await mpdService.disconnect();
        mpdService = null;
    }
}

/**
 * Initialize MPD IPC handlers
 */
export function initializeMpdHandlers(): void {
    // Connection management
    ipcMain.handle('mpd-connect', async (_event, config: MpdConfig) => {
        console.log('[MPD IPC] mpd-connect invoked', { host: config.host, port: config.port });
        try {
            const service = getMpdService(config);
            await service.connect();
            return { success: true };
        } catch (error) {
            console.error('[MPD IPC] Connect failed:', error);
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
                success: false,
            };
        }
    });

    ipcMain.handle('mpd-disconnect', async () => {
        console.log('[MPD IPC] mpd-disconnect invoked');
        try {
            if (mpdService) {
                await mpdService.disconnect();
                mpdService = null;
            }
            return { success: true };
        } catch (error) {
            console.error('[MPD IPC] Disconnect failed:', error);
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
                success: false,
            };
        }
    });

    ipcMain.handle('mpd-is-connected', () => {
        const result = mpdService?.isConnected() || false;
        console.log('[MPD IPC] mpd-is-connected invoked, result:', result);
        return result;
    });

    ipcMain.handle('mpd-test-connection', async (_event, config: MpdConfig) => {
        console.log('[MPD IPC] mpd-test-connection invoked', {
            host: config.host,
            port: config.port,
        });
        try {
            // Create temporary service for testing
            const testService = new MpdPlaybackService(config);
            await testService.connect();
            await testService.disconnect();
            return { success: true };
        } catch (error) {
            console.error('[MPD IPC] Test connection failed:', error);
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
                success: false,
            };
        }
    });

    // Playback control
    ipcMain.on('mpd-play', async () => {
        console.log('[MPD IPC] mpd-play invoked');
        try {
            const service = getMpdService();
            await service.play();
        } catch (error) {
            console.error('[MPD IPC] Play failed:', error);
        }
    });

    ipcMain.on('mpd-pause', async () => {
        console.log('[MPD IPC] mpd-pause invoked');
        try {
            const service = getMpdService();
            await service.pause();
        } catch (error) {
            console.error('[MPD IPC] Pause failed:', error);
        }
    });

    ipcMain.on('mpd-stop', async () => {
        console.log('[MPD IPC] mpd-stop invoked');
        try {
            const service = getMpdService();
            await service.stop();
        } catch (error) {
            console.error('[MPD IPC] Stop failed:', error);
        }
    });

    ipcMain.on('mpd-next', async () => {
        console.log('[MPD IPC] mpd-next invoked');
        try {
            const service = getMpdService();
            await service.next();
        } catch (error) {
            console.error('[MPD IPC] Next failed:', error);
        }
    });

    ipcMain.on('mpd-previous', async () => {
        console.log('[MPD IPC] mpd-previous invoked');
        try {
            const service = getMpdService();
            await service.previous();
        } catch (error) {
            console.error('[MPD IPC] Previous failed:', error);
        }
    });

    ipcMain.on('mpd-seek', async (_event, seconds: number) => {
        console.log('[MPD IPC] mpd-seek invoked', { seconds });
        try {
            const service = getMpdService();
            await service.seek(seconds);
        } catch (error) {
            console.error('[MPD IPC] Seek failed:', error);
        }
    });

    ipcMain.on('mpd-set-volume', async (_event, volume: number) => {
        console.log('[MPD IPC] mpd-set-volume invoked', { volume });
        try {
            const service = getMpdService();
            await service.setVolume(volume);
        } catch (error) {
            console.error('[MPD IPC] Set volume failed:', error);
        }
    });

    // Queue management
    ipcMain.on('mpd-set-queue', async (_event, items: any[], startIndex?: number) => {
        console.log('[MPD IPC] mpd-set-queue invoked', { itemCount: items.length, startIndex });
        try {
            const service = getMpdService();
            await service.setQueue(items, startIndex);
        } catch (error) {
            console.error('[MPD IPC] Set queue failed:', error);
        }
    });

    ipcMain.on('mpd-add-to-queue', async (_event, items: any[]) => {
        console.log('[MPD IPC] mpd-add-to-queue invoked', { itemCount: items.length });
        try {
            const service = getMpdService();
            await service.addToQueue(items);
        } catch (error) {
            console.error('[MPD IPC] Add to queue failed:', error);
        }
    });

    ipcMain.on('mpd-clear-queue', async () => {
        console.log('[MPD IPC] mpd-clear-queue invoked');
        try {
            const service = getMpdService();
            await service.clearQueue();
        } catch (error) {
            console.error('[MPD IPC] Clear queue failed:', error);
        }
    });

    ipcMain.handle('mpd-get-status', async () => {
        console.log('[MPD IPC] mpd-get-status invoked');
        try {
            const service = getMpdService();
            return await service.getStatus();
        } catch (error) {
            console.error('[MPD IPC] Get status failed:', error);
            return null;
        }
    });
}

/**
 * Check if config has changed compared to the current service
 */
function configChanged(config: MpdConfig): boolean {
    if (!mpdService) return true;
    const current = mpdService.getMpdConfig();
    return (
        current.host !== config.host ||
        current.port !== config.port ||
        current.password !== config.password
    );
}

/**
 * Get or create MPD service instance.
 * If config is provided and differs from the current service's config,
 * the old service is disconnected and a new one is created.
 */
function getMpdService(config?: MpdConfig): MpdPlaybackService {
    if (config && mpdService && configChanged(config)) {
        console.log('[MPD IPC] Config changed, tearing down old service');
        // Fire-and-forget disconnect of old service
        mpdService.disconnect().catch((err) => {
            console.error('[MPD IPC] Error disconnecting old service:', err);
        });
        mpdService = null;
    }

    if (!mpdService && config) {
        console.log('[MPD IPC] Creating new MpdPlaybackService');
        mpdService = new MpdPlaybackService(config);
        subscribeToEvents(mpdService);
    }

    if (!mpdService) {
        throw new Error('MPD service not initialized. Call mpd-connect first.');
    }

    return mpdService;
}

/**
 * Wire up event forwarding from MPD service to renderer
 */
function subscribeToEvents(service: MpdPlaybackService): void {
    service.subscribe((event: PlaybackEvent) => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return;

        switch (event.type) {
            case 'connected':
                mainWindow.webContents.send('renderer-mpd-connected');
                break;
            case 'disconnected':
                mainWindow.webContents.send('renderer-mpd-disconnected');
                break;
            case 'error':
                mainWindow.webContents.send('renderer-mpd-error', event.data);
                break;
            case 'next':
                mainWindow.webContents.send('renderer-mpd-next');
                break;
            case 'pause':
                mainWindow.webContents.send('renderer-mpd-pause');
                break;
            case 'play':
                mainWindow.webContents.send('renderer-mpd-play');
                break;
            case 'previous':
                mainWindow.webContents.send('renderer-mpd-previous');
                break;
            case 'queue':
                mainWindow.webContents.send('renderer-mpd-queue', event.data);
                break;
            case 'seek':
                mainWindow.webContents.send('renderer-mpd-seek', event.data?.position);
                break;
            case 'status':
                mainWindow.webContents.send('renderer-mpd-status', event.data);
                break;
            case 'stop':
                mainWindow.webContents.send('renderer-mpd-stop');
                break;
            case 'volume':
                mainWindow.webContents.send('renderer-mpd-volume', event.data?.volume);
                break;
        }
    });
}
