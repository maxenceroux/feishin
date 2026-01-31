/**
 * Playback service types and interfaces for abstracted player control
 */

export enum PlaybackState {
    PLAYING = 'playing',
    PAUSED = 'paused',
    STOPPED = 'stopped',
}

export interface PlaybackStatus {
    /** Current playback state */
    state: PlaybackState;
    /** Current position in seconds */
    position: number;
    /** Total duration in seconds */
    duration: number;
    /** Volume level (0-100) */
    volume: number;
    /** Current track URI or ID */
    currentTrackUri?: string;
    /** Current queue position/index */
    currentIndex?: number;
}

export interface PlaybackServiceConfig {
    /** Unique identifier for this service instance */
    id: string;
    /** Display name for the service */
    name: string;
}

export interface QueueItem {
    /** Unique identifier for tracking */
    id: string;
    /** Playable URI (HTTP URL, file path, etc.) */
    uri: string;
    /** Duration in seconds */
    duration?: number;
    /** Additional metadata */
    metadata?: {
        title?: string;
        artist?: string;
        album?: string;
        [key: string]: any;
    };
}

export type PlaybackEventType =
    | 'status'
    | 'play'
    | 'pause'
    | 'stop'
    | 'next'
    | 'previous'
    | 'seek'
    | 'volume'
    | 'queue'
    | 'error'
    | 'connected'
    | 'disconnected';

export interface PlaybackEvent {
    type: PlaybackEventType;
    data?: any;
}

export type PlaybackEventCallback = (event: PlaybackEvent) => void;

/**
 * Abstract interface for playback services (MPV, Web Audio, MPD, etc.)
 * All implementations must provide these methods for unified control
 */
export interface IPlaybackService {
    /**
     * Connect/initialize the playback service
     * @returns Promise that resolves when connected
     */
    connect(): Promise<void>;

    /**
     * Disconnect and cleanup the playback service
     * @returns Promise that resolves when disconnected
     */
    disconnect(): Promise<void>;

    /**
     * Check if service is currently connected
     */
    isConnected(): boolean;

    /**
     * Start or resume playback
     */
    play(): Promise<void>;

    /**
     * Pause playback
     */
    pause(): Promise<void>;

    /**
     * Stop playback completely
     */
    stop(): Promise<void>;

    /**
     * Skip to next track in queue
     */
    next(): Promise<void>;

    /**
     * Go back to previous track in queue
     */
    previous(): Promise<void>;

    /**
     * Seek to a specific position in the current track
     * @param seconds Position in seconds
     */
    seek(seconds: number): Promise<void>;

    /**
     * Set volume level
     * @param volume Volume level (0-100)
     */
    setVolume(volume: number): Promise<void>;

    /**
     * Set/replace the entire playback queue
     * @param items Array of queue items to play
     * @param startIndex Optional index to start playing from (default: 0)
     */
    setQueue(items: QueueItem[], startIndex?: number): Promise<void>;

    /**
     * Add items to the end of the queue
     * @param items Array of queue items to add
     */
    addToQueue(items: QueueItem[]): Promise<void>;

    /**
     * Clear the entire queue
     */
    clearQueue(): Promise<void>;

    /**
     * Get current playback status
     * @returns Current status including state, position, volume, etc.
     */
    getStatus(): Promise<PlaybackStatus>;

    /**
     * Subscribe to playback events
     * @param callback Function to call when events occur
     * @returns Unsubscribe function
     */
    subscribe(callback: PlaybackEventCallback): () => void;

    /**
     * Get service configuration
     */
    getConfig(): PlaybackServiceConfig;
}
