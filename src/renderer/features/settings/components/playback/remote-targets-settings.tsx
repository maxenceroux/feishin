import isElectron from 'is-electron';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';

export const RemoteTargetsSettings = () => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const [testingConnection, setTestingConnection] = useState(false);

    if (!isElectron()) {
        return null;
    }

    const mpdConfig = settings.remoteTargets?.mpd || {
        enabled: false,
        host: '',
        password: '',
        port: 6600,
    };

    const handleTestConnection = async () => {
        if (!mpdConfig.host) {
            toast.error({
                message: t('error.mpdHostRequired', {
                    defaultValue: 'MPD host is required',
                    postProcess: 'sentenceCase',
                }),
            });
            return;
        }

        setTestingConnection(true);
        try {
            const result = await window.api.mpdPlayer.testConnection({
                host: mpdConfig.host,
                password: mpdConfig.password || undefined,
                port: mpdConfig.port,
            });

            if (result?.success) {
                toast.success({
                    message: t('success.mpdConnectionSuccess', {
                        defaultValue: 'Successfully connected to MPD server',
                        postProcess: 'sentenceCase',
                    }),
                });
            } else {
                toast.error({
                    message: t('error.mpdConnectionFailed', {
                        defaultValue: `Failed to connect to MPD: ${result?.error || 'Unknown error'}`,
                        postProcess: 'sentenceCase',
                    }),
                });
            }
        } catch (error) {
            console.error('[MPD] Test connection error:', error);
            toast.error({
                message: t('error.mpdConnectionError', {
                    defaultValue: 'Error testing MPD connection',
                    postProcess: 'sentenceCase',
                }),
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const remoteTargetOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    checked={mpdConfig.enabled}
                    onChange={(e) =>
                        setSettings({
                            playback: {
                                ...settings,
                                remoteTargets: {
                                    ...settings.remoteTargets,
                                    mpd: { ...mpdConfig, enabled: e },
                                },
                            },
                        })
                    }
                />
            ),
            description: t('setting.enableMpdRemote', {
                context: 'description',
                defaultValue: 'Enable remote playback via MPD (Music Player Daemon)',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.enableMpdRemote', {
                defaultValue: 'Enable MPD Remote',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <TextInput
                    defaultValue={mpdConfig.host}
                    placeholder="192.168.1.100"
                    onBlur={(e) =>
                        setSettings({
                            playback: {
                                ...settings,
                                remoteTargets: {
                                    ...settings.remoteTargets,
                                    mpd: { ...mpdConfig, host: e.currentTarget.value },
                                },
                            },
                        })
                    }
                />
            ),
            description: t('setting.mpdHost', {
                context: 'description',
                defaultValue: 'IP address or hostname of the MPD server',
                postProcess: 'sentenceCase',
            }),
            isHidden: !mpdConfig.enabled,
            title: t('setting.mpdHost', {
                defaultValue: 'MPD Host',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={mpdConfig.port}
                    max={65535}
                    min={1}
                    onBlur={(e) =>
                        setSettings({
                            playback: {
                                ...settings,
                                remoteTargets: {
                                    ...settings.remoteTargets,
                                    mpd: {
                                        ...mpdConfig,
                                        port: parseInt(e.currentTarget.value, 10) || 6600,
                                    },
                                },
                            },
                        })
                    }
                />
            ),
            description: t('setting.mpdPort', {
                context: 'description',
                defaultValue: 'TCP port for MPD server (default: 6600)',
                postProcess: 'sentenceCase',
            }),
            isHidden: !mpdConfig.enabled,
            title: t('setting.mpdPort', {
                defaultValue: 'MPD Port',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <PasswordInput
                    defaultValue={mpdConfig.password}
                    placeholder="Optional"
                    onBlur={(e) =>
                        setSettings({
                            playback: {
                                ...settings,
                                remoteTargets: {
                                    ...settings.remoteTargets,
                                    mpd: { ...mpdConfig, password: e.currentTarget.value },
                                },
                            },
                        })
                    }
                />
            ),
            description: t('setting.mpdPassword', {
                context: 'description',
                defaultValue: 'Password for MPD server (optional)',
                postProcess: 'sentenceCase',
            }),
            isHidden: !mpdConfig.enabled,
            title: t('setting.mpdPassword', {
                defaultValue: 'MPD Password',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Button
                    disabled={!mpdConfig.host || testingConnection}
                    loading={testingConnection}
                    variant="filled"
                    onClick={handleTestConnection}
                >
                    {t('action.testConnection', {
                        defaultValue: 'Test Connection',
                        postProcess: 'sentenceCase',
                    })}
                </Button>
            ),
            description: t('setting.testMpdConnection', {
                context: 'description',
                defaultValue: 'Verify that noiseport can connect to your MPD server',
                postProcess: 'sentenceCase',
            }),
            isHidden: !mpdConfig.enabled,
            title: t('setting.testMpdConnection', {
                defaultValue: 'Test Connection',
                postProcess: 'sentenceCase',
            }),
        },
    ];

    return (
        <SettingsSection
            options={remoteTargetOptions}
            title={t('setting.remotePlaybackTargets', {
                defaultValue: 'Remote Playback Targets',
                postProcess: 'sentenceCase',
            })}
        />
    );
};
