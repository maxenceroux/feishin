import { nanoid } from 'nanoid';
import { useState } from 'react';

import { SlskdServerForm } from './slskd-server-form';

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

export const SlskdServerSettings = () => {
    const slskdSettings = useSlskdSettings();
    const { addSlskdServer, removeSlskdServer, setSelectedSlskdServer, updateSlskdServer } =
        useSettingsStoreActions();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingServer, setEditingServer] = useState<null | SlskdServerItem>(null);

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
            password: server.password,
            username: server.username,
        });
        return await apiClient.testConnection();
    };

    const options: SettingOption[] = [
        {
            control: (
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={500} size="lg">
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
                            justify="space-between"
                            key={server.id}
                            p="sm"
                            style={{
                                backgroundColor:
                                    slskdSettings.selectedServerId === server.id
                                        ? 'var(--theme-colors-surface)'
                                        : undefined,
                                border: '1px solid var(--theme-colors-border)',
                                borderRadius: 'var(--mantine-radius-sm)',
                            }}
                        >
                            <Stack gap="xs">
                                <Text fw={500}>{server.name}</Text>
                                <Text c="dimmed" size="sm">
                                    {server.baseUrl}
                                </Text>
                                <Text c="dimmed" size="sm">
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
                                    <Text c="blue" fw={500} size="xs">
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
                                    color="red"
                                    onClick={() => handleRemoveServer(server.id)}
                                    size="xs"
                                    variant="outline"
                                >
                                    Remove
                                </Button>
                            </Group>
                        </Group>
                    ))}

                    {showAddForm && (
                        <SlskdServerForm
                            onCancel={() => setShowAddForm(false)}
                            onSubmit={handleAddServer}
                            onTestConnection={handleTestConnection}
                        />
                    )}

                    {editingServer && (
                        <SlskdServerForm
                            initialData={editingServer}
                            onCancel={() => setEditingServer(null)}
                            onSubmit={handleUpdateServer}
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
