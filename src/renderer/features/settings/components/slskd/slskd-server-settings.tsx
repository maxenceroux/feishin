import { nanoid } from 'nanoid';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SlskdApiClient } from '/@/renderer/api/slskd/slskd-api';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    SlskdServerItem,
    useSettingsStoreActions,
    useSlskdSettings,
} from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

import { SlskdServerForm } from './slskd-server-form';

export const SlskdServerSettings = () => {
    const { t } = useTranslation();
    const slskdSettings = useSlskdSettings();
    const { addSlskdServer, updateSlskdServer, removeSlskdServer, setSelectedSlskdServer } =
        useSettingsStoreActions();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingServer, setEditingServer] = useState<SlskdServerItem | null>(null);

    const handleAddServer = (serverData: Omit<SlskdServerItem, 'id'>) => {
        const newServer: SlskdServerItem = {
            ...serverData,
            id: nanoid(),
        };
        addSlskdServer(newServer);
        setShowAddForm(false);
    };

    const handleUpdateServer = (serverData: Omit<SlskdServerItem, 'id'>) => {
        if (editingServer) {
            const updatedServer: SlskdServerItem = {
                ...serverData,
                id: editingServer.id,
            };
            updateSlskdServer(editingServer.id, updatedServer);
            setEditingServer(null);
        }
    };

    const handleRemoveServer = (id: string) => {
        removeSlskdServer(id);
    };

    const handleSetActiveServer = (id: string) => {
        setSelectedSlskdServer(id);
    };

    const handleTestConnection = async (server: SlskdServerItem): Promise<boolean> => {
        const apiClient = new SlskdApiClient({
            baseUrl: server.baseUrl,
            username: server.username,
            password: server.password,
        });
        return await apiClient.testConnection();
    };

    const options: SettingOption[] = [
        {
            control: (
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text size="lg" fw={500}>
                            slskd Servers
                        </Text>
                        <Button onClick={() => setShowAddForm(true)} size="sm">
                            Add Server
                        </Button>
                    </Group>

                    {slskdSettings.servers.length === 0 && !showAddForm && (
                        <Text c="dimmed" size="sm">
                            No slskd servers configured
                        </Text>
                    )}

                    {slskdSettings.servers.map((server) => (
                        <Group
                            key={server.id}
                            justify="space-between"
                            p="sm"
                            style={{
                                border: '1px solid var(--mantine-color-gray-3)',
                                borderRadius: 'var(--mantine-radius-sm)',
                                backgroundColor:
                                    slskdSettings.selectedServerId === server.id
                                        ? 'var(--mantine-color-blue-0)'
                                        : undefined,
                            }}
                        >
                            <Stack gap="xs">
                                <Text fw={500}>{server.name}</Text>
                                <Text size="sm" c="dimmed">
                                    {server.baseUrl}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    Username: {server.username}
                                </Text>
                            </Stack>
                            <Group gap="xs">
                                {slskdSettings.selectedServerId !== server.id && (
                                    <Button
                                        onClick={() => handleSetActiveServer(server.id)}
                                        size="xs"
                                        variant="light"
                                    >
                                        Select
                                    </Button>
                                )}
                                {slskdSettings.selectedServerId === server.id && (
                                    <Text size="xs" c="blue" fw={500}>
                                        Active
                                    </Text>
                                )}
                                <Button
                                    onClick={() => setEditingServer(server)}
                                    size="xs"
                                    variant="default"
                                >
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => handleRemoveServer(server.id)}
                                    size="xs"
                                    variant="outline"
                                    color="red"
                                >
                                    Remove
                                </Button>
                            </Group>
                        </Group>
                    ))}

                    {showAddForm && (
                        <SlskdServerForm
                            onSubmit={handleAddServer}
                            onCancel={() => setShowAddForm(false)}
                            onTestConnection={handleTestConnection}
                        />
                    )}

                    {editingServer && (
                        <SlskdServerForm
                            initialData={editingServer}
                            onSubmit={handleUpdateServer}
                            onCancel={() => setEditingServer(null)}
                            onTestConnection={handleTestConnection}
                        />
                    )}
                </Stack>
            ),
            description: 'Configure slskd servers for music discovery and downloads',
            title: 'slskd Servers',
        },
    ];

    return <SettingsSection options={options} />;
};