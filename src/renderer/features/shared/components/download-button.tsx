import clsx from 'clsx';
import { useEffect, useState } from 'react';

import styles from './play-button.module.css';

import { getDownloadUrl } from '/@/renderer/utils/noiseport-server';
import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { toast } from '/@/shared/components/toast/toast';

export interface DownloadButtonProps extends Omit<ActionIconProps, 'onClick'> {
    albumArtist?: string;
    albumName?: string;
    vpnIp?: string;
    onDownloadComplete?: () => void;
    onDownloadError?: (error: string) => void;
    size?: number | string;
}

export const DownloadButton = ({
    albumArtist = '',
    albumName = '',
    vpnIp = '',
    className,
    onDownloadComplete,
    onDownloadError,
    ...props
}: DownloadButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [vpnIpState, setVpnIpState] = useState(vpnIp);

    useEffect(() => {
        if (!vpnIp) {
            const fetchVpnIp = async () => {
                try {
                    const ip = await window.headscale.getIp();
                    setVpnIpState(ip);
                } catch (error) {
                    console.error('Failed to fetch VPN IP:', error);
                }
            };
            fetchVpnIp();
        }
    }, [vpnIp]);

    const handleDownload = async () => {
        if (!albumArtist || !albumName) {
            const errorMessage = 'Album artist or name is missing';
            toast.error({ message: errorMessage });
            onDownloadError?.(errorMessage);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(getDownloadUrl(), {
                body: JSON.stringify({
                    album: albumName,
                    artist: albumArtist,
                    vpn_ip: vpnIpState,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(
                    `Download request failed: ${response.status} ${response.statusText}`,
                );
            }

            toast.success({
                message: `Download request sent for "${albumName}" by ${albumArtist}`,
            });
            onDownloadComplete?.();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Download request failed';
            console.error('Download error:', error);
            toast.error({ message: errorMessage });
            onDownloadError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ActionIcon
            className={clsx(styles.button, className)}
            disabled={isLoading || !albumArtist || !albumName}
            icon="download"
            iconProps={{
                size: 'xl',
            }}
            loading={isLoading}
            onClick={handleDownload}
            variant="filled"
            {...props}
        />
    );
};
