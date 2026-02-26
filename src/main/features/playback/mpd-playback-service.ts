/**
 * MPD Playback Service
 * Controls a remote MPD (Music Player Daemon) instance over TCP
 */

import { MPC } from 'mpc-js';

import {
    IPlaybackService,
    PlaybackEvent,
    PlaybackEventCallback,
    PlaybackServiceConfig,
    PlaybackState,
    PlaybackStatus,
    QueueItem,
} from './types';

export interface MpdConfig {
    host: string;
    password?: string;
    port: number;
}

interface MpdQueueMapping {
    /** MPD queue position -> noiseport QueueItem ID */
    [mpdIndex: number]: string;
}

export class MpdPlaybackService implements IPlaybackService {
    private client: MPC | null = null;
    private config: MpdConfig;
    private connected = false;
    private maxReconnectAttempts = 10;
    private queueMapping: MpdQueueMapping = {};
    private reconnectAttempts = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private statusPollInterval: NodeJS.Timeout | null = null;
    private subscribers: PlaybackEventCallback[] = [];

    constructor(config: MpdConfig) {
        this.config = config;
    }

    async addToQueue(items: QueueItem[]): Promise<void> {
        try {
            const currentQueueLength = Object.keys(this.queueMapping).length;
            const promises: Promise<string>[] = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log(`[MPD] Adding to queue [${currentQueueLength + i}]: ${item.uri}`);
                promises.push(this.sendCommand('add', [item.uri]));
                this.queueMapping[currentQueueLength + i] = item.id;
            }

            await Promise.all(promises);

            this.emit({ data: { added: items }, type: 'queue' });
            console.log(`[MPD] Added ${items.length} items to queue`);
        } catch (error) {
            console.error('[MPD] Failed to add to queue:', error);
            throw error;
        }
    }

    async clearQueue(): Promise<void> {
        await this.sendCommand('clear');
        this.queueMapping = {};
        this.emit({ data: { cleared: true }, type: 'queue' });
    }

    async connect(): Promise<void> {
        if (this.connected && this.client) {
            return;
        }

        try {
            this.client = new MPC();
            await this.client.connectTCP(this.config.host, this.config.port);

            // Authenticate if password provided
            if (this.config.password) {
                await this.sendCommand('password', [this.config.password]);
            }

            this.connected = true;
            this.reconnectAttempts = 0;

            // Ensure MPD plays through the queue (disable single-song repeat/stop)
            await this.sendCommand('single', ['0']);
            await this.sendCommand('repeat', ['0']);
            await this.sendCommand('consume', ['0']);

            this.emit({ type: 'connected' });

            // Start status polling
            this.startStatusPolling();

            console.log(`[MPD] Connected to ${this.config.host}:${this.config.port}`);
        } catch (error) {
            console.error('[MPD] Connection failed:', error);
            this.connected = false;
            this.emit({
                data: { error, message: 'Failed to connect to MPD' },
                type: 'error',
            });
            this.scheduleReconnect();
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.stopStatusPolling();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.client) {
            try {
                this.client.disconnect();
            } catch (error) {
                console.error('[MPD] Error during disconnect:', error);
            }
            this.client = null;
        }

        this.connected = false;
        this.queueMapping = {};
        this.emit({ type: 'disconnected' });
        console.log('[MPD] Disconnected');
    }

    getConfig(): PlaybackServiceConfig {
        return {
            id: 'mpd',
            name: `MPD (${this.config.host}:${this.config.port})`,
        };
    }

    /**
     * Get the noiseport queue item ID for a given MPD queue position
     */
    getQueueItemId(mpdIndex: number): string | undefined {
        return this.queueMapping[mpdIndex];
    }

    async getStatus(): Promise<PlaybackStatus> {
        if (!this.isConnected()) {
            throw new Error('MPD not connected');
        }

        try {
            const [statusResult, currentSongResult] = await Promise.all([
                this.sendCommand('status'),
                this.sendCommand('currentsong'),
            ]);

            const status = this.parseResponse(statusResult);
            const currentSong = this.parseResponse(currentSongResult);

            const state = this.mapMpdState(status.state);
            const position = parseFloat(status.elapsed || '0');
            const duration = parseFloat(status.duration || currentSong.duration || '0');
            const volume = parseInt(status.volume || '0', 10);
            const currentIndex = parseInt(status.song || '-1', 10);

            const playbackStatus: PlaybackStatus = {
                currentIndex: currentIndex >= 0 ? currentIndex : undefined,
                currentTrackUri: currentSong.file,
                duration,
                position,
                state,
                volume,
            };

            return playbackStatus;
        } catch (error) {
            console.error('[MPD] Failed to get status:', error);
            throw error;
        }
    }

    isConnected(): boolean {
        return this.connected && this.client !== null;
    }

    async next(): Promise<void> {
        await this.sendCommand('next');
        this.emit({ type: 'next' });
    }

    async pause(): Promise<void> {
        await this.sendCommand('pause', ['1']);
        this.emit({ type: 'pause' });
    }

    async play(): Promise<void> {
        await this.sendCommand('play');
        this.emit({ type: 'play' });
    }

    async previous(): Promise<void> {
        await this.sendCommand('previous');
        this.emit({ type: 'previous' });
    }

    async seek(seconds: number): Promise<void> {
        await this.sendCommand('seekcur', [seconds.toString()]);
        this.emit({ data: { position: seconds }, type: 'seek' });
    }

    async setQueue(items: QueueItem[], startIndex = 0): Promise<void> {
        try {
            // Reset queue mapping
            this.queueMapping = {};

            // Build all commands and send them as a single batch via Promise.all.
            // mpc-js will wrap concurrent sendCommand calls in a command_list_ok_begin
            // block, so MPD executes them atomically — no status polls or other
            // commands can interleave.
            const promises: Promise<string>[] = [this.sendCommand('clear')];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log(`[MPD] Adding to queue [${i}]: ${item.uri}`);
                promises.push(this.sendCommand('add', [item.uri]));
                this.queueMapping[i] = item.id;
            }

            // Start playback at specified index
            if (items.length > 0) {
                promises.push(this.sendCommand('play', [startIndex.toString()]));
            }

            await Promise.all(promises);

            this.emit({ data: { items, startIndex }, type: 'queue' });
            console.log(`[MPD] Queue set with ${items.length} items, starting at ${startIndex}`);
        } catch (error) {
            console.error('[MPD] Failed to set queue:', error);
            throw error;
        }
    }

    async setVolume(volume: number): Promise<void> {
        // Clamp volume to 0-100
        const clampedVolume = Math.max(0, Math.min(100, volume));
        await this.sendCommand('setvol', [clampedVolume.toString()]);
        this.emit({ data: { volume: clampedVolume }, type: 'volume' });
    }

    async stop(): Promise<void> {
        await this.sendCommand('stop');
        this.emit({ type: 'stop' });
    }

    subscribe(callback: PlaybackEventCallback): () => void {
        this.subscribers.push(callback);
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Update configuration and reconnect if needed
     */
    async updateConfig(config: Partial<MpdConfig>): Promise<void> {
        const wasConnected = this.isConnected();

        this.config = { ...this.config, ...config };

        if (wasConnected) {
            await this.disconnect();
            await this.connect();
        }
    }

    private emit(event: PlaybackEvent): void {
        this.subscribers.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                console.error('[MPD] Error in event callback:', error);
            }
        });
    }

    private isConnectionError(error: any): boolean {
        // Check for common connection error patterns
        if (!error) return false;

        const errorMessage = error.message?.toLowerCase() || '';
        return (
            errorMessage.includes('connect') ||
            errorMessage.includes('econnrefused') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('socket')
        );
    }

    private mapMpdState(mpdState: string | undefined): PlaybackState {
        switch (mpdState) {
            case 'pause':
                return PlaybackState.PAUSED;
            case 'play':
                return PlaybackState.PLAYING;
            case 'stop':
            default:
                return PlaybackState.STOPPED;
        }
    }

    private parseResponse(response: string): Record<string, string> {
        const lines = response.split('\n').filter((line) => line.trim() !== '');
        const result: Record<string, string> = {};

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                result[key.toLowerCase()] = value;
            }
        }

        return result;
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimeout || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        this.reconnectAttempts++;

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

        console.log(
            `[MPD] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
        );

        this.reconnectTimeout = setTimeout(async () => {
            this.reconnectTimeout = null;
            try {
                await this.connect();
            } catch (error) {
                // Error already handled in connect()
            }
        }, delay);
    }

    private async sendCommand(command: string, args: string[] = []): Promise<string> {
        if (!this.client) {
            throw new Error('MPD client not initialized');
        }

        try {
            // Build command string with quoted arguments (MPD protocol requires quoting)
            const quotedArgs = args.map(
                (arg) => `"${arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
            );
            const cmdString =
                quotedArgs.length > 0 ? `${command} ${quotedArgs.join(' ')}` : command;
            const response = await this.client.sendCommand(cmdString);

            // Return the response lines joined
            return response.lines.join('\n');
        } catch (error) {
            console.error(`[MPD] Command failed: ${command}`, error);

            // Handle connection errors
            if (this.isConnectionError(error)) {
                this.connected = false;
                this.emit({ type: 'disconnected' });
                this.scheduleReconnect();
            }

            throw error;
        }
    }

    private startStatusPolling(): void {
        if (this.statusPollInterval) {
            return;
        }

        // Poll status every 1.5 seconds
        this.statusPollInterval = setInterval(async () => {
            try {
                const status = await this.getStatus();
                this.emit({ data: status, type: 'status' });
            } catch (error) {
                // Polling errors are logged but don't emit events
                // (disconnect events are handled in sendCommand)
            }
        }, 1500);
    }

    private stopStatusPolling(): void {
        if (this.statusPollInterval) {
            clearInterval(this.statusPollInterval);
            this.statusPollInterval = null;
        }
    }
}
