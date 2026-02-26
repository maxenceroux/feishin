import { useTranslation } from 'react-i18next';

import { useMpdConnection } from '/@/renderer/hooks/use-mpd-connection';
import { usePlaybackSettings, usePlaybackType } from '/@/renderer/store/settings.store';
import { Badge } from '/@/shared/components/badge/badge';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { PlaybackType } from '/@/shared/types/types';

export const PlaybackOutputIndicator = () => {
    const { t } = useTranslation();
    const playbackType = usePlaybackType();
    const settings = usePlaybackSettings();
    const { error, isConnected, isError } = useMpdConnection();

    if (playbackType !== PlaybackType.REMOTE_MPD) {
        return null;
    }

    const mpdHost = settings.remoteTargets?.mpd?.host || 'Unknown';

    let color: 'green' | 'red' | 'yellow' = 'yellow';
    let text = t('player.connecting', { defaultValue: 'Connecting...' });
    let tooltipText = `MPD: ${mpdHost}`;

    if (isConnected) {
        color = 'green';
        text = t('player.remoteMpd', { defaultValue: 'MPD' });
        tooltipText = `${t('player.connectedTo', { defaultValue: 'Connected to' })} ${mpdHost}`;
    } else if (isError) {
        color = 'red';
        text = t('player.mpdError', { defaultValue: 'MPD Error' });
        tooltipText = error || t('player.connectionError', { defaultValue: 'Connection error' });
    }

    return (
        <Tooltip label={tooltipText}>
            <Badge color={color} size="sm" variant="dot">
                {text}
            </Badge>
        </Tooltip>
    );
};
