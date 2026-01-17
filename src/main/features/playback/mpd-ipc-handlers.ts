/**
 * MPD Player IPC Handlers
 * Handles IPC communication between renderer and MPD playback service
 */

import { ipcMain, BrowserWindow } from 'electron';
import { MpdPlaybackService, MpdConfig } from './mpd-playback-service';
import { PlaybackEvent } from './types';

let mpdService: MpdPlaybackService | null = null;

/**
 * Get or create MPD service instance
 */
function getMpdService(config?: MpdConfig): MpdPlaybackService {
    if (!mpdService && config) {
        mpdService = new MpdPlaybackService(config);
        
        // Subscribe to events and forward to renderer
        mpdService.subscribe((event: PlaybackEvent) => {
            const mainWindow = BrowserWindow.getAllWindows()[0];
            if (!mainWindow) return;

            switch (event.type) {
                case 'status':
                    mainWindow.webContents.send('renderer-mpd-status', event.data);
                    break;
                case 'play':
                    mainWindow.webContents.send('renderer-mpd-play');
                    break;
                case 'pause':
                    mainWindow.webContents.send('renderer-mpd-pause');
                    break;
                case 'stop':
                    mainWindow.webContents.send('renderer-mpd-stop');
                    break;
                case 'next':
                    mainWindow.webContents.send('renderer-mpd-next');
                    break;
                case 'previous':
                    mainWindow.webContents.send('renderer-mpd-previous');
                    break;
                case 'seek':
                    mainWindow.webContents.send('renderer-mpd-seek', event.data?.position);
                    break;
                case 'volume':
                    mainWindow.webContents.send('renderer-mpd-volume', event.data?.volume);
                    break;
                case 'queue':
                    mainWindow.webContents.send('renderer-mpd-queue', event.data);
                    break;
                case 'connected':
                    mainWindow.webContents.send('renderer-mpd-connected');
                    break;
                case 'disconnected':
                    mainWindow.webContents.send('renderer-mpd-disconnected');
                    break;
                case 'error':
                    mainWindow.webContents.send('renderer-mpd-error', event.data);
                    break;
            }
        });
    }
    
    if (!mpdService) {
        throw new Error('MPD service not initialized. Call mpd-connect first.');
    }
    
    return mpdService;
}

/**
 * Initialize MPD IPC handlers
 */
export function initializeMpdHandlers(): void {
    // Connection management
    ipcMain.handle('mpd-connect', async (_event, config: MpdConfig) => {
        try {
            const service = getMpdService(config);
            await service.connect();
            return { success: true };
        } catch (error) {
            console.error('[MPD IPC] Connect failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });

    ipcMain.handle('mpd-disconnect', async () => {
        try {
            if (mpdService) {
                await mpdService.disconnect();
                mpdService = null;
            }
            return { success: true };
        } catch (error) {
            console.error('[MPD IPC] Disconnect failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });

    ipcMain.handle('mpd-is-connected', () => {
        return mpdService?.isConnected() || false;
    });

    ipcMain.handle('mpd-test-connection', async (_event, config: MpdConfig) => {
        try {
            // Create temporary service for testing
            const testService = new MpdPlaybackService(config);
            await testService.connect();
            await testService.disconnect();
            return { success: true };
        } catch (error) {
            console.error('[MPD IPC] Test connection failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });

    // Playback control
    ipcMain.on('mpd-play', async () => {
        try {
            const service = getMpdService();
            await service.play();
        } catch (error) {
            console.error('[MPD IPC] Play failed:', error);
        }
    });

    ipcMain.on('mpd-pause', async () => {
        try {
            const service = getMpdService();
            await service.pause();
        } catch (error) {
            console.error('[MPD IPC] Pause failed:', error);
        }
    });

    ipcMain.on('mpd-stop', async () => {
        try {
            const service = getMpdService();
            await service.stop();
        } catch (error) {
            console.error('[MPD IPC] Stop failed:', error);
        }
    });

    ipcMain.on('mpd-next', async () => {
        try {
            const service = getMpdService();
            await service.next();
        } catch (error) {
            console.error('[MPD IPC] Next failed:', error);
        }
    });

    ipcMain.on('mpd-previous', async () => {
        try {
            const service = getMpdService();
            await service.previous();
        } catch (error) {
            console.error('[MPD IPC] Previous failed:', error);
        }
    });

    ipcMain.on('mpd-seek', async (_event, seconds: number) => {
        try {
            const service = getMpdService();
            await service.seek(seconds);
        } catch (error) {
            console.error('[MPD IPC] Seek failed:', error);
        }
    });

    ipcMain.on('mpd-set-volume', async (_event, volume: number) => {
        try {
            const service = getMpdService();
            await service.setVolume(volume);
        } catch (error) {
            console.error('[MPD IPC] Set volume failed:', error);
        }
    });

    // Queue management
    ipcMain.on('mpd-set-queue', async (_event, items: any[], startIndex?: number) => {
        try {
            const service = getMpdService();
            await service.setQueue(items, startIndex);
        } catch (error) {
            console.error('[MPD IPC] Set queue failed:', error);
        }
    });

    ipcMain.on('mpd-add-to-queue', async (_event, items: any[]) => {
        try {
            const service = getMpdService();
            await service.addToQueue(items);
        } catch (error) {
            console.error('[MPD IPC] Add to queue failed:', error);
        }
    });

    ipcMain.on('mpd-clear-queue', async () => {
        try {
            const service = getMpdService();
            await service.clearQueue();
        } catch (error) {
            console.error('[MPD IPC] Clear queue failed:', error);
        }
    });

    ipcMain.handle('mpd-get-status', async () => {
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
 * Cleanup MPD service on app quit
 */
export async function cleanupMpdService(): Promise<void> {
    if (mpdService) {
        await mpdService.disconnect();
        mpdService = null;
    }
}
