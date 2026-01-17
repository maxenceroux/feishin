import { ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * MPD Player Preload API
 * Exposes MPD playback control to renderer process via IPC
 */

export interface MpdConnectionConfig {
    host: string;
    port: number;
    password?: string;
}

export interface MpdStatus {
    state: 'playing' | 'paused' | 'stopped';
    position: number;
    duration: number;
    volume: number;
    currentTrackUri?: string;
    currentIndex?: number;
}

export interface MpdQueueItem {
    id: string;
    uri: string;
    duration?: number;
    metadata?: {
        title?: string;
        artist?: string;
        album?: string;
        [key: string]: any;
    };
}

// Command methods
const connect = (config: MpdConnectionConfig) => {
    return ipcRenderer.invoke('mpd-connect', config);
};

const disconnect = () => {
    return ipcRenderer.invoke('mpd-disconnect');
};

const isConnected = () => {
    return ipcRenderer.invoke('mpd-is-connected');
};

const play = () => {
    ipcRenderer.send('mpd-play');
};

const pause = () => {
    ipcRenderer.send('mpd-pause');
};

const stop = () => {
    ipcRenderer.send('mpd-stop');
};

const next = () => {
    ipcRenderer.send('mpd-next');
};

const previous = () => {
    ipcRenderer.send('mpd-previous');
};

const seek = (seconds: number) => {
    ipcRenderer.send('mpd-seek', seconds);
};

const setVolume = (volume: number) => {
    ipcRenderer.send('mpd-set-volume', volume);
};

const setQueue = (items: MpdQueueItem[], startIndex?: number) => {
    ipcRenderer.send('mpd-set-queue', items, startIndex);
};

const addToQueue = (items: MpdQueueItem[]) => {
    ipcRenderer.send('mpd-add-to-queue', items);
};

const clearQueue = () => {
    ipcRenderer.send('mpd-clear-queue');
};

const getStatus = () => {
    return ipcRenderer.invoke('mpd-get-status');
};

const testConnection = (config: MpdConnectionConfig) => {
    return ipcRenderer.invoke('mpd-test-connection', config);
};

// Event listeners for renderer callbacks
const onStatusUpdate = (cb: (event: IpcRendererEvent, status: MpdStatus) => void) => {
    ipcRenderer.on('renderer-mpd-status', cb);
};

const onPlay = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-mpd-play', cb);
};

const onPause = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-mpd-pause', cb);
};

const onStop = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-mpd-stop', cb);
};

const onNext = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-mpd-next', cb);
};

const onPrevious = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-mpd-previous', cb);
};

const onSeek = (cb: (event: IpcRendererEvent, position: number) => void) => {
    ipcRenderer.on('renderer-mpd-seek', cb);
};

const onVolume = (cb: (event: IpcRendererEvent, volume: number) => void) => {
    ipcRenderer.on('renderer-mpd-volume', cb);
};

const onConnected = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-mpd-connected', cb);
};

const onDisconnected = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-mpd-disconnected', cb);
};

const onError = (cb: (event: IpcRendererEvent, error: { message: string; details?: any }) => void) => {
    ipcRenderer.on('renderer-mpd-error', cb);
};

const onQueueUpdate = (cb: (event: IpcRendererEvent, data: any) => void) => {
    ipcRenderer.on('renderer-mpd-queue', cb);
};

export const mpdPlayer = {
    addToQueue,
    clearQueue,
    connect,
    disconnect,
    getStatus,
    isConnected,
    next,
    pause,
    play,
    previous,
    seek,
    setQueue,
    setVolume,
    stop,
    testConnection,
};

export const mpdPlayerListener = {
    onConnected,
    onDisconnected,
    onError,
    onNext,
    onPause,
    onPlay,
    onPrevious,
    onQueueUpdate,
    onSeek,
    onStatusUpdate,
    onStop,
    onVolume,
};

export type MpdPlayer = typeof mpdPlayer;
export type MpdPlayerListener = typeof mpdPlayerListener;
