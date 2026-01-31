/**
 * MPD Queue Synchronization Utilities
 * Builds stream URLs and translates noiseport queue to MPD queue
 */

import { api } from '/@/renderer/api';
import { getServerById } from '/@/renderer/store/auth.store';
import type { QueueSong } from '/@/shared/types/domain-types';
import type { TranscodingConfig } from '/@/renderer/store/settings.store';

// Replicate MpdQueueItem type to avoid preload import issues in renderer
export interface MpdQueueItem {
    id: string;
    uri: string;
    duration?: number;
    metadata?: {
        title?: string;
        artist?: string;
        album?: string | null;
        [key: string]: any;
    };
}

/**
 * Build a complete Subsonic stream URL for a song
 * Uses token-based authentication (t/s parameters)
 */
export function buildStreamUrl(song: QueueSong, transcode?: TranscodingConfig): string {
    if (!song.serverId) {
        throw new Error(`Song ${song.id} has no serverId`);
    }

    const server = getServerById(song.serverId);
    if (!server) {
        throw new Error(`Server ${song.serverId} not found`);
    }

    // If transcoding is enabled and configured, use transcoded URL
    if (transcode?.enabled) {
        const transcodedUrl = api.controller.getTranscodingUrl({
            apiClientProps: { server },
            query: {
                base: song.streamUrl,
                ...transcode,
            },
        });

        if (transcodedUrl) {
            return transcodedUrl;
        }
    }

    // Use original stream URL (already includes auth params from Subsonic normalization)
    console.log('[MPD Queue] Built stream URL:', song.streamUrl);
    return song.streamUrl;
}

/**
 * Convert noiseport QueueSong array to MPD queue items
 */
export function convertToMpdQueue(
    songs: QueueSong[],
    transcode?: TranscodingConfig,
): MpdQueueItem[] {
    return songs.map((song) => ({
        duration: song.duration || 0,
        id: song.uniqueId,
        metadata: {
            album: song.album,
            artist: song.artistName,
            title: song.name,
        },
        uri: buildStreamUrl(song, transcode),
    }));
}

/**
 * Sync a portion of the queue to MPD (for buffered/windowed sync)
 * @param songs Full queue
 * @param currentIndex Current playing index
 * @param windowSize Number of songs to buffer ahead
 * @param transcode Transcoding settings
 */
export function getQueueWindow(
    songs: QueueSong[],
    currentIndex: number,
    windowSize: number = 5,
    transcode?: TranscodingConfig,
): {
    items: MpdQueueItem[];
    startIndex: number;
} {
    // Get current song + next N songs
    const start = currentIndex;
    const end = Math.min(currentIndex + windowSize, songs.length);
    const windowSongs = songs.slice(start, end);

    return {
        items: convertToMpdQueue(windowSongs, transcode),
        startIndex: 0, // Always start at 0 in the MPD queue
    };
}
