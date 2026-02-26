/**
 * Playback service types and interfaces for abstracted player control
 */

export enum PlaybackState {
    PAUSED = 'paused',
    PLAYING = 'playing',
    STOPPED = 'stopped',
}

/**
 * Abstract interface for playback services (MPV, Web Audio, MPD, etc.)
 * All implementations must provide these methods for unified control
 */
export interface IPlaybackService {
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
     * Get service configuration
     */
    getConfig(): PlaybackServiceConfig;

    /**
     * Get current playback status
     * @returns Current status including state, position, volume, etc.
     */
    getStatus(): Promise<PlaybackStatus>;

    /**
     * Check if service is currently connected
     */
    isConnected(): boolean;

    /**
     * Skip to next track in queue
     */
    next(): Promise<void>;

    /**
     * Pause playback
     */
    pause(): Promise<void>;

    /**
     * Start or resume playback
     */
    play(): Promise<void>;

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
     * Set/replace the entire playback queue
     * @param items Array of queue items to play
     * @param startIndex Optional index to start playing from (default: 0)
     */
    setQueue(items: QueueItem[], startIndex?: number): Promise<void>;

    /**
     * Set volume level
     * @param volume Volume level (0-100)
     */
    setVolume(volume: number): Promise<void>;

    /**
     * Stop playback completely
     */
    stop(): Promise<void>;

    /**
     * Subscribe to playback events
     * @param callback Function to call when events occur
     * @returns Unsubscribe function
     */
    subscribe(callback: PlaybackEventCallback): () => void;
}

export interface PlaybackEvent {
    data?: any;
    type: PlaybackEventType;
}

export type PlaybackEventCallback = (event: PlaybackEvent) => void;

export type PlaybackEventType =
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'next'
    | 'pause'
    | 'play'
    | 'previous'
    | 'queue'
    | 'seek'
    | 'status'
    | 'stop'
    | 'volume';

export interface PlaybackServiceConfig {
    /** Unique identifier for this service instance */
    id: string;
    /** Display name for the service */
    name: string;
}

export interface PlaybackStatus {
    /** Current queue position/index */
    currentIndex?: number;
    /** Current track URI or ID */
    currentTrackUri?: string;
    /** Total duration in seconds */
    duration: number;
    /** Current position in seconds */
    position: number;
    /** Current playback state */
    state: PlaybackState;
    /** Volume level (0-100) */
    volume: number;
}

export interface QueueItem {
    /** Duration in seconds */
    duration?: number;
    /** Unique identifier for tracking */
    id: string;
    /** Additional metadata */
    metadata?: {
        [key: string]: any;
        album?: string;
        artist?: string;
        title?: string;
    };
    /** Playable URI (HTTP URL, file path, etc.) */
    uri: string;
}
