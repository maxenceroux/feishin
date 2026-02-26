/**
 * Hook to track MPD connection status
 */

import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

import { usePlaybackSettings, usePlaybackType } from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/shared/types/types';

const mpdPlayer = isElectron() ? window.api.mpdPlayer : null;
const mpdPlayerListener = isElectron() ? window.api.mpdPlayerListener : null;

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

        // Query actual connection state (read-only, no connect attempt)
        const checkConnection = async () => {
            if (mpdConfig?.enabled && mpdConfig.host) {
                try {
                    const connected = await mpdPlayer?.isConnected();
                    setStatus(connected ? 'connected' : 'connecting');
                } catch {
                    setStatus('connecting');
                }
            }
        };

        checkConnection();

        // Cleanup
        return () => {
            // Note: preload doesn't expose removeListener for ipcRenderer
        };
    }, [isMpdMode, mpdConfig?.enabled, mpdConfig?.host]);

    return {
        error,
        isConnected: status === 'connected',
        isError: status === 'error',
        status,
    };
};
