/**
 * Hook to sync MPD playback status to player store
 * Updates position, duration, and playback state from MPD
 */

import isElectron from 'is-electron';
import { useEffect } from 'react';

import { usePlaybackType, usePlayerStore } from '/@/renderer/store';
import { PlaybackType } from '/@/shared/types/types';

const mpdPlayerListener = isElectron() ? window.api.mpdPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

export const useMpdStatusSync = () => {
    const playbackType = usePlaybackType();
    const { actions } = usePlayerStore();

    const isMpdMode = playbackType === PlaybackType.REMOTE_MPD;

    useEffect(() => {
        if (!isMpdMode || !isElectron()) {
            return;
        }

        const handleStatusUpdate = (
            _event: any,
            status: {
                currentIndex?: number;
                duration: number;
                position: number;
                state: 'paused' | 'playing' | 'stopped';
                volume: number;
            },
        ) => {
            // Update player store with MPD status
            // Update current time (position)
            actions.setCurrentTime(status.position);

            // Note: Duration is typically stored in the song metadata, not updated here
            // Volume sync is handled by use-mpd-playback hook

            console.log('[MPD Status Sync] Updated position:', {
                duration: status.duration,
                position: status.position,
                state: status.state,
            });
        };

        mpdPlayerListener?.onStatusUpdate(handleStatusUpdate);

        // Cleanup
        return () => {
            ipc?.removeAllListeners('renderer-mpd-status');
        };
    }, [isMpdMode, actions]);
};
