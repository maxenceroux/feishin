/**
 * MPD Playback Controller Hook
 * Listens to player store state changes and routes commands to MPD service
 */

import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

import { convertToMpdQueue } from '/@/renderer/features/player/mpd-queue-sync';
import {
    useCurrentSong,
    useCurrentStatus,
    useDefaultQueue,
    usePlaybackType,
    usePlayerStore,
    useVolume,
} from '/@/renderer/store';
import { usePlaybackSettings } from '/@/renderer/store/settings.store';
import { PlaybackType, PlayerStatus } from '/@/shared/types/types';

const mpdPlayer = isElectron() ? window.api.mpdPlayer : null;

export const useMpdPlayback = () => {
    const playbackType = usePlaybackType();
    const status = useCurrentStatus();
    const currentSong = useCurrentSong();
    const currentIndex = usePlayerStore((state) => state.current.index);
    const volume = useVolume();
    const queue = useDefaultQueue();
    const settings = usePlaybackSettings();

    const prevStatusRef = useRef<PlayerStatus>(status);
    const prevSongIdRef = useRef<string | undefined>(currentSong?.uniqueId);
    const prevIndexRef = useRef(currentIndex);
    const prevQueueLengthRef = useRef(0);
    const isConnectedRef = useRef(false);
    const queueSyncedRef = useRef(false);

    const isMpdMode = playbackType === PlaybackType.REMOTE_MPD;
    const mpdConfig = settings.remoteTargets?.mpd;

    // Connect/disconnect based on playback type and settings
    useEffect(() => {
        let cancelled = false;

        console.log('[MPD Hook] Connect/disconnect effect fired', {
            enabled: mpdConfig?.enabled,
            host: mpdConfig?.host,
            isMpdMode,
        });

        const connect = async () => {
            if (!isMpdMode) {
                console.log('[MPD Hook] Not in MPD mode, skipping connect');
                return;
            }

            if (!mpdConfig?.enabled) {
                console.log('[MPD Hook] MPD not enabled in config');
                return;
            }

            if (!mpdConfig.host) {
                console.log('[MPD Hook] No MPD host configured');
                return;
            }

            console.log('[MPD Hook] Attempting to connect to MPD:', {
                hasPassword: !!mpdConfig.password,
                host: mpdConfig.host,
                port: mpdConfig.port,
            });

            try {
                const connected = await mpdPlayer?.isConnected();
                if (cancelled) return;
                console.log('[MPD Hook] Current connection state:', connected);

                if (!connected) {
                    console.log('[MPD Hook] Connecting...');
                    await mpdPlayer?.connect({
                        host: mpdConfig.host,
                        password: mpdConfig.password || undefined,
                        port: mpdConfig.port,
                    });
                    if (cancelled) return;
                    isConnectedRef.current = true;
                    queueSyncedRef.current = false; // Reset queue sync on reconnect
                    console.log('[MPD Hook] Successfully connected to MPD');
                } else {
                    console.log('[MPD Hook] Already connected');
                    isConnectedRef.current = true;
                }
            } catch (error) {
                if (cancelled) return;
                console.error('[MPD Hook] Failed to connect:', error);
                isConnectedRef.current = false;
            }
        };

        if (isMpdMode) {
            connect();
        } else if (isConnectedRef.current) {
            // Switching away from MPD mode — fire-and-forget disconnect
            console.log('[MPD Hook] Leaving MPD mode, disconnecting');
            isConnectedRef.current = false;
            queueSyncedRef.current = false;
            mpdPlayer?.disconnect().catch((error: unknown) => {
                console.error('[MPD Hook] Failed to disconnect:', error);
            });
        }

        return () => {
            cancelled = true;
            // Synchronously reset refs so subsequent effects don't act on stale state
            if (isConnectedRef.current) {
                console.log('[MPD Hook] Cleanup: resetting refs and disconnecting');
                isConnectedRef.current = false;
                queueSyncedRef.current = false;
                // Fire-and-forget disconnect
                mpdPlayer?.disconnect().catch((error: unknown) => {
                    console.error('[MPD Hook] Cleanup disconnect error:', error);
                });
            }
        };
    }, [isMpdMode, mpdConfig?.enabled, mpdConfig?.host, mpdConfig?.port, mpdConfig?.password]);

    // Sync queue to MPD when queue changes
    useEffect(() => {
        console.log('[MPD Hook] Queue sync effect', {
            connected: isConnectedRef.current,
            isMpdMode,
            queueLen: queue.length,
            synced: queueSyncedRef.current,
        });

        if (!isMpdMode || !isConnectedRef.current || queue.length === 0) {
            return;
        }

        const queueChanged = queue.length !== prevQueueLengthRef.current || !queueSyncedRef.current;
        prevQueueLengthRef.current = queue.length;

        if (queueChanged) {
            try {
                // Convert entire queue to MPD format
                const mpdQueue = convertToMpdQueue(queue, settings.transcode);

                // Set queue starting at current index
                mpdPlayer?.setQueue(mpdQueue, currentIndex);
                queueSyncedRef.current = true;
                console.log(
                    `[MPD Hook] Queue synced: ${queue.length} tracks, starting at index ${currentIndex}`,
                );
            } catch (error) {
                console.error('[MPD Hook] Failed to sync queue:', error);
            }
        }
    }, [isMpdMode, queue, currentIndex, settings.transcode]);

    // Handle play/pause status changes
    useEffect(() => {
        console.log('[MPD Hook] Status effect', {
            isMpdMode,
            prevStatus: prevStatusRef.current,
            status,
        });

        if (!isMpdMode || !isConnectedRef.current) {
            return;
        }

        const prevStatus = prevStatusRef.current;
        prevStatusRef.current = status;

        if (status === prevStatus) {
            return;
        }

        if (status === PlayerStatus.PLAYING) {
            mpdPlayer?.play();
            console.log('[MPD Hook] Play command sent');
        } else if (status === PlayerStatus.PAUSED) {
            mpdPlayer?.pause();
            console.log('[MPD Hook] Pause command sent');
        }
    }, [isMpdMode, status]);

    // Handle volume changes
    useEffect(() => {
        console.log('[MPD Hook] Volume effect', { isMpdMode, volume });

        if (!isMpdMode || !isConnectedRef.current) {
            return;
        }

        mpdPlayer?.setVolume(volume);
    }, [isMpdMode, volume]);

    // Handle song changes (track navigation via next/previous or jump)
    useEffect(() => {
        console.log('[MPD Hook] Song change effect', {
            currentIndex,
            isMpdMode,
            prevIndex: prevIndexRef.current,
            songId: currentSong?.uniqueId,
        });

        if (!isMpdMode || !isConnectedRef.current || !queueSyncedRef.current) {
            return;
        }

        const prevIndex = prevIndexRef.current;
        prevIndexRef.current = currentIndex;

        // Detect if index changed (user pressed next/previous or jumped to track)
        if (prevIndex !== currentIndex && prevIndex !== -1) {
            const indexDiff = currentIndex - prevIndex;

            if (indexDiff === 1) {
                // User went forward by 1 - call next()
                mpdPlayer?.next();
                console.log('[MPD Hook] Next command sent');
            } else if (indexDiff === -1) {
                // User went back by 1 - call previous()
                mpdPlayer?.previous();
                console.log('[MPD Hook] Previous command sent');
            } else {
                // User jumped to arbitrary track - resync queue with new start index
                try {
                    const mpdQueue = convertToMpdQueue(queue, settings.transcode);
                    mpdPlayer?.setQueue(mpdQueue, currentIndex);
                    console.log(`[MPD Hook] Jumped to index ${currentIndex}, queue resynced`);
                } catch (error) {
                    console.error('[MPD Hook] Failed to resync queue on jump:', error);
                }
            }
        }

        prevSongIdRef.current = currentSong?.uniqueId;
    }, [isMpdMode, currentIndex, currentSong?.uniqueId, queue, settings.transcode]);
};
