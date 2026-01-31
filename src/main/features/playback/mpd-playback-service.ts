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

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log(
                    `[MPD Service] Adding to queue [${currentQueueLength + i}]: ${item.uri}`,
                );
                await this.sendCommand('add', [item.uri]);
                this.queueMapping[currentQueueLength + i] = item.id;
            }

            this.emit({ data: { added: items }, type: 'queue' });
            console.log(`[MPD Service] Added ${items.length} items to queue`);
        } catch (error) {
            console.error('[MPD Service] Failed to add to queue:', error);
            throw error;
        }
    }

    async clearQueue(): Promise<void> {
        await this.sendCommand('clear');
        this.queueMapping = {};
        this.emit({ data: { cleared: true }, type: 'queue' });
    }

    async connect(): Promise<void> {
        console.log(
            `[MPD Service] connect() called — host=${this.config.host} port=${this.config.port}`,
        );

        if (this.connected && this.client) {
            console.log('[MPD Service] Already connected, skipping');
            return;
        }

        // Clean up stale client that wasn't properly nulled
        if (this.client) {
            console.log('[MPD Service] Cleaning up stale client before reconnecting');
            try {
                this.client.disconnect();
            } catch {
                // Ignore errors from stale client
            }
            this.client = null;
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
            this.emit({ type: 'connected' });

            // Start status polling
            this.startStatusPolling();

            console.log(`[MPD Service] Connected to ${this.config.host}:${this.config.port}`);
        } catch (error) {
            console.error('[MPD Service] Connection failed:', error);
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
        console.log('[MPD Service] disconnect() called');
        this.stopStatusPolling();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Reset reconnect counter so next manual connect gets a fresh set of attempts
        this.reconnectAttempts = 0;

        if (this.client) {
            try {
                this.client.disconnect();
            } catch (error) {
                console.error('[MPD Service] Error during disconnect:', error);
            }
            this.client = null;
        }

        this.connected = false;
        this.queueMapping = {};
        this.emit({ type: 'disconnected' });
        console.log('[MPD Service] Disconnected');
    }

    getConfig(): PlaybackServiceConfig {
        return {
            id: 'mpd',
            name: `MPD (${this.config.host}:${this.config.port})`,
        };
    }

    getMpdConfig(): MpdConfig {
        return { ...this.config };
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
            console.error('[MPD Service] Failed to get status:', error);
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
            // Clear current queue
            await this.sendCommand('clear');

            // Reset queue mapping
            this.queueMapping = {};

            // Add all items to queue
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log(`[MPD Service] Adding to queue [${i}]: ${item.uri}`);
                await this.sendCommand('add', [item.uri]);
                this.queueMapping[i] = item.id;
            }

            // Start playback at specified index
            if (items.length > 0) {
                await this.sendCommand('play', [startIndex.toString()]);
            }

            this.emit({ data: { items, startIndex }, type: 'queue' });
            console.log(
                `[MPD Service] Queue set with ${items.length} items, starting at ${startIndex}`,
            );
        } catch (error) {
            console.error('[MPD Service] Failed to set queue:', error);
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
                console.error('[MPD Service] Error in event callback:', error);
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
        if (this.reconnectTimeout) {
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log(
                `[MPD Service] Max reconnect attempts (${this.maxReconnectAttempts}) reached, giving up`,
            );
            return;
        }

        this.reconnectAttempts++;

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

        console.log(
            `[MPD Service] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
        );

        this.reconnectTimeout = setTimeout(async () => {
            this.reconnectTimeout = null;
            try {
                await this.connect();
            } catch {
                // Error already handled in connect()
            }
        }, delay);
    }

    private async sendCommand(command: string, args: string[] = []): Promise<string> {
        if (!this.client) {
            throw new Error('MPD client not initialized');
        }

        try {
            // Build command string with arguments
            const cmdString = args.length > 0 ? `${command} ${args.join(' ')}` : command;
            console.log(`[MPD Service] sendCommand: ${command}`);
            const response = await this.client.sendCommand(cmdString);

            // Return the response lines joined
            return response.lines.join('\n');
        } catch (error) {
            console.error(`[MPD Service] Command failed: ${command}`, error);

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
        console.log('[MPD Service] startStatusPolling()');
        if (this.statusPollInterval) {
            return;
        }

        // Poll status every 1.5 seconds
        this.statusPollInterval = setInterval(async () => {
            try {
                const status = await this.getStatus();
                this.emit({ data: status, type: 'status' });
            } catch {
                // Polling errors are logged but don't emit events
                // (disconnect events are handled in sendCommand)
            }
        }, 1500);
    }

    private stopStatusPolling(): void {
        console.log('[MPD Service] stopStatusPolling()');
        if (this.statusPollInterval) {
            clearInterval(this.statusPollInterval);
            this.statusPollInterval = null;
        }
    }
}
