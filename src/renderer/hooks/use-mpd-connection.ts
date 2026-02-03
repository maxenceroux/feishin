/**
 * Hook to track MPD connection status
 */

import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

import { usePlaybackSettings, usePlaybackType } from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/shared/types/types';

const mpdPlayerListener = isElectron() ? window.api.mpdPlayerListener : null;

export type MpdConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export const useMpdConnection = () => {
    const playbackType = usePlaybackType();
    const settings = usePlaybackSettings();
    const [status, setStatus] = useState<MpdConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);

    const isMpdMode = playbackType === PlaybackType.REMOTE_MPD;
    const mpdConfig = settings.remoteTargets?.mpd;

    useEffect(() => {
        if (!isMpdMode || !isElectron()) {
            setStatus('disconnected');
            return;
        }

        // Set up event listeners
        const handleConnected = () => {
            setStatus('connected');
            setError(null);
        };

        const handleDisconnected = () => {
            setStatus('disconnected');
            setError(null);
        };

        const handleError = (_event: any, errorData: { message: string }) => {
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
            // Note: mpc-js doesn't provide removeListener, 
            // but since this is tied to component lifecycle it's okay
        };
    }, [isMpdMode, mpdConfig?.enabled, mpdConfig?.host]);

    return {
        error,
        isConnected: status === 'connected',
        isError: status === 'error',
        status,
    };
};
