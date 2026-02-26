/**
 * Hook to sync MPD playback status to player store
 * Updates position, duration, and playback state from MPD
 */

import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

import { usePlaybackType, usePlayerStore } from '/@/renderer/store';
import { PlaybackType } from '/@/shared/types/types';

const mpdPlayerListener = isElectron() ? window.api.mpdPlayerListener : null;

/**
 * Flag to indicate an index change originated from MPD status polling,
 * so the playback hook doesn't echo the command back to MPD.
 */
export let mpdStatusDrivenIndexChange = false;

export function resetMpdStatusFlag(): void {
    mpdStatusDrivenIndexChange = false;
}

export const useMpdStatusSync = () => {
    const playbackType = usePlaybackType();
    const { actions } = usePlayerStore();

    const isMpdMode = playbackType === PlaybackType.REMOTE_MPD;
    const prevMpdIndexRef = useRef<number>(-1);

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
            // Update current time (position)
            actions.setCurrentTime(status.position);

            // Sync track index when MPD advances to a different track
            if (
                status.currentIndex !== undefined &&
                status.currentIndex >= 0 &&
                status.currentIndex !== prevMpdIndexRef.current
            ) {
                prevMpdIndexRef.current = status.currentIndex;

                // Read current store index directly to avoid stale closure
                const storeIndex = usePlayerStore.getState().current.index;
                if (status.currentIndex !== storeIndex) {
                    console.log('[MPD Status Sync] Track changed:', {
                        mpdIndex: status.currentIndex,
                        storeIndex,
                    });
                    mpdStatusDrivenIndexChange = true;
                    actions.setCurrentIndex(status.currentIndex);
                }
            }
        };

        mpdPlayerListener?.onStatusUpdate(handleStatusUpdate);

        // Cleanup
        return () => {
            // Note: preload doesn't expose removeListener for ipcRenderer
        };
    }, [isMpdMode, actions]);
};
