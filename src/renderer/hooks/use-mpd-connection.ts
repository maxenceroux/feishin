/**
 * Hook to track MPD connection status
 */

import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

import { usePlaybackSettings, usePlaybackType } from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/shared/types/types';

const mpdPlayerListener = isElectron() ? window.api.mpdPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

export type MpdConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export const useMpdConnection = () => {
    const playbackType = usePlaybackType();
    const settings = usePlaybackSettings();
    const [status, setStatus] = useState<MpdConnectionStatus>('disconnected');
    const [error, setError] = useState<null | string>(null);

    const isMpdMode = playbackType === PlaybackType.REMOTE_MPD;
    const mpdConfig = settings.remoteTargets?.mpd;

    useEffect(() => {
        if (!isMpdMode || !isElectron()) {
            setStatus('disconnected');
            return;
        }

        // Set up event listeners
        const handleConnected = () => {
            console.log('[MPD Connection] Connected event received');
            setStatus('connected');
            setError(null);
        };

        const handleDisconnected = () => {
            console.log('[MPD Connection] Disconnected event received');
            setStatus('disconnected');
            setError(null);
        };

        const handleError = (_event: any, errorData: { message: string }) => {
            console.log('[MPD Connection] Error event received:', errorData.message);
            setStatus('error');
            setError(errorData.message);
        };

        mpdPlayerListener?.onConnected(handleConnected);
        mpdPlayerListener?.onDisconnected(handleDisconnected);
        mpdPlayerListener?.onError(handleError);

        // Check initial connection state
        const checkConnection = async () => {
            if (mpdConfig?.enabled && mpdConfig.host) {
                setStatus('connecting');
                // The useMpdPlayback hook will handle actual connection
            }
        };

        checkConnection();

        // Cleanup
        return () => {
            ipc?.removeAllListeners('renderer-mpd-connected');
            ipc?.removeAllListeners('renderer-mpd-disconnected');
            ipc?.removeAllListeners('renderer-mpd-error');
        };
    }, [isMpdMode, mpdConfig?.enabled, mpdConfig?.host]);

    return {
        error,
        isConnected: status === 'connected',
        isError: status === 'error',
        status,
    };
};
