/**
 * Hook to sync MPD playback status to player store
 * Updates position, duration, and playback state from MPD
 */

import isElectron from 'is-electron';
import { useEffect } from 'react';

import { usePlaybackType, usePlayerStore } from '/@/renderer/store';
import { PlaybackType, PlayerStatus } from '/@/shared/types/types';

const mpdPlayerListener = isElectron() ? window.api.mpdPlayerListener : null;

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
                state: 'playing' | 'paused' | 'stopped';
                position: number;
                duration: number;
                volume: number;
                currentIndex?: number;
            },
        ) => {
            // Update player store with MPD status
            // Update current time (position)
            actions.setCurrentTime(status.position);

            // Note: Duration is typically stored in the song metadata, not updated here
            // Volume sync is handled by use-mpd-playback hook

            console.log('[MPD Status Sync] Updated position:', {
                position: status.position,
                duration: status.duration,
                state: status.state,
            });
        };

        mpdPlayerListener?.onStatusUpdate(handleStatusUpdate);

        // Cleanup
        return () => {
            // Note: mpc-js doesn't provide removeListener
        };
    }, [isMpdMode, actions]);
};
