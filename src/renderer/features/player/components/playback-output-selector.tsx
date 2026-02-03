import { useTranslation } from 'react-i18next';
import { RiSpeaker2Line, RiSpeaker3Line } from 'react-icons/ri';

import { useMpdConnection } from '/@/renderer/hooks/use-mpd-connection';
import { usePlaybackSettings, usePlaybackType, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { useCurrentStatus, usePlayerControls, usePlayerStore } from '/@/renderer/store';
import { setQueue } from '/@/renderer/utils/set-transcoded-queue-data';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { PlaybackType, PlayerStatus } from '/@/shared/types/types';

export const PlaybackOutputSelector = () => {
    const { t } = useTranslation();
    const playbackType = usePlaybackType();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const { isConnected, isError } = useMpdConnection();
    const status = useCurrentStatus();
    const { pause } = usePlayerControls();

    const isMpdEnabled = settings.remoteTargets?.mpd?.enabled || false;
    const mpdHost = settings.remoteTargets?.mpd?.host || 'Unknown';

    const handleSelectOutput = (type: PlaybackType) => {
        // Skip if already on this output
        if (type === playbackType) return;

        const wasPlaying = status === PlayerStatus.PLAYING;

        // Pause if currently playing
        if (wasPlaying) {
            pause();
        }

        // If switching to LOCAL, sync the queue to MPV so it's ready
        if (type === PlaybackType.LOCAL && playbackType !== PlaybackType.LOCAL) {
            const queueData = usePlayerStore.getState().actions.getPlayerData();
            if (queueData) {
                setQueue(queueData, true); // true = start paused
            }
        }

        // Update playback type
        setSettings({
            playback: {
                ...settings,
                type,
            },
        });

        // Notify user if they were playing
        if (wasPlaying) {
            toast.info({
                message: t('player.outputSwitched', {
                    defaultValue: 'Output switched. Press play to resume.',
                }),
            });
        }
    };

    const getOutputIcon = () => {
        if (playbackType === PlaybackType.REMOTE_MPD) {
            if (isError) return RiSpeaker2Line; // Speaker with issue
            return RiSpeaker3Line; // Active speaker
        }
        return RiSpeaker2Line; // Default speaker
    };

    const getOutputLabel = () => {
        if (playbackType === PlaybackType.REMOTE_MPD) {
            if (isConnected) return `MPD: ${mpdHost}`;
            if (isError) return t('player.mpdError', { defaultValue: 'MPD Error' });
            return t('player.connecting', { defaultValue: 'Connecting...' });
        }
        return t('player.localAudio', { defaultValue: 'Local Audio' });
    };

    const OutputIcon = getOutputIcon();

    return (
        <DropdownMenu arrowOffset={12} offset={0} position="top-end" width={250} withArrow>
            <DropdownMenu.Target>
                <ActionIcon
                    iconProps={{
                        color: playbackType === PlaybackType.REMOTE_MPD && isConnected ? 'primary' : undefined,
                        size: 'xl',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    size="sm"
                    tooltip={{
                        label: getOutputLabel(),
                        openDelay: 0,
                    }}
                    variant="subtle"
                >
                    <OutputIcon size={22} />
                </ActionIcon>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                <DropdownMenu.Label>
                    {t('player.audioOutput', { defaultValue: 'Audio Output' })}
                </DropdownMenu.Label>

                {/* Local Audio Output */}
                <DropdownMenu.Item
                    isSelected={playbackType === PlaybackType.LOCAL}
                    leftSection={<RiSpeaker2Line size={20} />}
                    onClick={() => handleSelectOutput(PlaybackType.LOCAL)}
                >
                    <Flex direction="column" gap={2}>
                        <Text size="sm">
                            {t('player.localAudio', { defaultValue: 'Local Audio' })}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {t('player.localAudioDescription', { defaultValue: 'Play on this device' })}
                        </Text>
                    </Flex>
                </DropdownMenu.Item>

                {/* Remote MPD Output */}
                {isMpdEnabled && (
                    <DropdownMenu.Item
                        isSelected={playbackType === PlaybackType.REMOTE_MPD}
                        leftSection={<RiSpeaker3Line size={20} />}
                        onClick={() => handleSelectOutput(PlaybackType.REMOTE_MPD)}
                    >
                        <Flex direction="column" gap={2}>
                            <Text size="sm">
                                MPD - {mpdHost}
                            </Text>
                            <Text c="dimmed" size="xs">
                                {isConnected
                                    ? t('player.connected', { defaultValue: 'Connected' })
                                    : isError
                                      ? t('player.connectionError', { defaultValue: 'Connection error' })
                                      : t('player.disconnected', { defaultValue: 'Disconnected' })}
                            </Text>
                        </Flex>
                    </DropdownMenu.Item>
                )}

                {/* No Remote Targets Available */}
                {!isMpdEnabled && (
                    <>
                        <DropdownMenu.Divider />
                        <Flex justify="center" p="md">
                            <Text c="dimmed" size="xs" ta="center">
                                {t('player.noRemoteTargets', { defaultValue: 'No remote outputs configured' })}
                            </Text>
                        </Flex>
                    </>
                )}
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};
