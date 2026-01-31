import { useTranslation } from 'react-i18next';
import { RiSpeaker2Line, RiSpeaker3Line } from 'react-icons/ri';

import {
    usePlaybackSettings,
    usePlaybackType,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Text } from '/@/shared/components/text/text';
import { PlaybackType } from '/@/shared/types/types';

export const PlaybackOutputSelector = () => {
    const { t } = useTranslation();
    const playbackType = usePlaybackType();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    const isMpdEnabled = settings.remoteTargets?.mpd?.enabled || false;
    const mpdHost = settings.remoteTargets?.mpd?.host || 'Unknown';
    const isMpdSelected = playbackType === PlaybackType.REMOTE_MPD;
    // Treat WEB as LOCAL for UI purposes (WEB is fallback when mpv fails)
    const isLocalSelected =
        playbackType === PlaybackType.LOCAL || playbackType === PlaybackType.WEB;

    const handleSelectOutput = (type: PlaybackType) => {
        setSettings({
            playback: {
                ...settings,
                type,
            },
        });
    };

    // Icon: RiSpeaker3Line (active speaker) when MPD selected, RiSpeaker2Line otherwise
    const OutputIcon = isMpdSelected ? RiSpeaker3Line : RiSpeaker2Line;

    // Tooltip: just "MPD: {host}" when MPD, "Local Audio" otherwise
    const tooltipLabel = isMpdSelected
        ? `MPD: ${mpdHost}`
        : t('player.localAudio', { defaultValue: 'Local Audio' });

    return (
        <DropdownMenu arrowOffset={12} offset={0} position="top-end" width={250} withArrow>
            <DropdownMenu.Target>
                <ActionIcon
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    size="sm"
                    tooltip={{
                        label: tooltipLabel,
                        openDelay: 0,
                    }}
                    variant="subtle"
                >
                    <OutputIcon
                        color={isMpdSelected ? 'var(--theme-colors-primary-filled)' : undefined}
                        size={22}
                    />
                </ActionIcon>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                <DropdownMenu.Label>
                    {t('player.audioOutput', { defaultValue: 'Audio Output' })}
                </DropdownMenu.Label>

                {/* Local Audio Output */}
                <DropdownMenu.Item
                    isSelected={isLocalSelected}
                    leftSection={<RiSpeaker2Line size={20} />}
                    onClick={() => handleSelectOutput(PlaybackType.LOCAL)}
                >
                    <Flex direction="column" gap={2}>
                        <Text size="sm">
                            {t('player.localAudio', { defaultValue: 'Local Audio' })}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {t('player.localAudioDescription', {
                                defaultValue: 'Play on this device',
                            })}
                        </Text>
                    </Flex>
                </DropdownMenu.Item>

                {/* Remote MPD Output */}
                {isMpdEnabled && (
                    <DropdownMenu.Item
                        isSelected={isMpdSelected}
                        leftSection={
                            <RiSpeaker3Line
                                color={
                                    isMpdSelected ? 'var(--theme-colors-primary-filled)' : undefined
                                }
                                size={20}
                            />
                        }
                        onClick={() => handleSelectOutput(PlaybackType.REMOTE_MPD)}
                    >
                        <Flex direction="column" gap={2}>
                            <Text size="sm">MPD - {mpdHost}</Text>
                            <Text c="dimmed" size="xs">
                                {t('player.remoteDescription', {
                                    defaultValue: 'Play on remote device',
                                })}
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
                                {t('player.noRemoteTargets', {
                                    defaultValue: 'No remote outputs configured',
                                })}
                            </Text>
                        </Flex>
                    </>
                )}
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};
