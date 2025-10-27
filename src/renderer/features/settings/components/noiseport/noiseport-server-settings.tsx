import { useState } from 'react';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useNoisePortSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';

export const NoisePortServerSettings = () => {
    const noiseportSettings = useNoisePortSettings();
    const { setNoisePortServerIp } = useSettingsStoreActions();
    const [serverIp, setServerIp] = useState(noiseportSettings.serverIp);
    const [testResult, setTestResult] = useState<null | {
        message: string;
        success: boolean;
    }>(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleSaveIp = () => {
        setNoisePortServerIp(serverIp);
        setTestResult({
            message: 'Server IP saved successfully',
            success: true,
        });
    };

    const handleTestConnection = async () => {
        if (!serverIp.trim()) {
            setTestResult({
                message: 'Please enter a server IP address',
                success: false,
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch(`http://${serverIp}:8010/api/v1/system/health`, {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();
                setTestResult({
                    message: `Connection successful! Server responded: ${JSON.stringify(data)}`,
                    success: true,
                });
            } else {
                setTestResult({
                    message: `Connection failed with status: ${response.status} ${response.statusText}`,
                    success: false,
                });
            }
        } catch (error) {
            setTestResult({
                message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                success: false,
            });
        } finally {
            setIsTesting(false);
        }
    };

    const options: SettingOption[] = [
        {
            control: (
                <Stack gap="md">
                    <Text fw={500} size="lg">
                        NoisePort Server Configuration
                    </Text>
                    <Text c="dimmed" size="sm">
                        Configure the IP address of your NoisePort server for Spotify token requests
                        and downloads. If you&apos;re using Tailscale VPN, the IP address typically
                        starts with 100.x.x.x
                    </Text>

                    <TextInput
                        description="Enter the IP address of your NoisePort server (e.g., 100.98.104.55)"
                        label="Server IP Address"
                        onChange={(e) => setServerIp(e.currentTarget.value)}
                        placeholder="100.98.104.55"
                        value={serverIp}
                    />

                    <Group gap="sm">
                        <Button onClick={handleSaveIp} size="sm">
                            Save IP Address
                        </Button>
                        <Button
                            loading={isTesting}
                            onClick={handleTestConnection}
                            size="sm"
                            variant="outline"
                        >
                            Test Connection
                        </Button>
                    </Group>

                    {testResult && (
                        <Text
                            c={testResult.success ? 'green' : 'red'}
                            size="sm"
                            style={{
                                backgroundColor: testResult.success
                                    ? 'rgba(0, 255, 0, 0.1)'
                                    : 'rgba(255, 0, 0, 0.1)',
                                borderRadius: 'var(--mantine-radius-sm)',
                                padding: '0.5rem',
                            }}
                        >
                            {testResult.message}
                        </Text>
                    )}
                </Stack>
            ),
            description: '',
            isHidden: false,
            title: '',
        },
    ];

    return <SettingsSection options={options} />;
};
