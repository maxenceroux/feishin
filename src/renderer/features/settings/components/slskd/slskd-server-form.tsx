import { useForm } from '@mantine/form';
import { useState } from 'react';

import { SlskdServerItem } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';

interface SlskdServerFormProps {
    initialData?: SlskdServerItem;
    onCancel: () => void;
    onSubmit: (data: Omit<SlskdServerItem, 'id'>) => void;
    onTestConnection: (server: SlskdServerItem) => Promise<boolean>;
}

export const SlskdServerForm = ({
    initialData,
    onCancel,
    onSubmit,
    onTestConnection,
}: SlskdServerFormProps) => {
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    const form = useForm({
        initialValues: {
            baseUrl: initialData?.baseUrl || 'http://localhost:5030',
            name: initialData?.name || '',
            password: initialData?.password || '',
            username: initialData?.username || '',
        },
        validate: {
            name: (value) => (!value ? 'Name is required' : null),
            baseUrl: (value) => {
                if (!value) return 'URL is required';
                try {
                    new URL(value);
                    return null;
                } catch {
                    return 'Invalid URL format';
                }
            },
            username: (value) => (!value ? 'Username is required' : null),
            password: (value) => (!value ? 'Password is required' : null),
        },
    });

    const handleTestConnection = async () => {
        const validationResult = form.validate();
        if (validationResult.hasErrors) {
            return;
        }

        setIsTestingConnection(true);
        try {
            const testServer: SlskdServerItem = {
                id: 'test',
                ...form.values,
            };

            const result = await onTestConnection(testServer);
            if (result) {
                toast.success({
                    message: 'Connection successful!',
                });
            } else {
                toast.error({
                    message: 'Connection failed. Please check your settings.',
                });
            }
        } catch (error) {
            toast.error({
                message: `Connection error: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleSubmit = form.onSubmit((values) => {
        onSubmit(values);
    });

    return (
        <form onSubmit={handleSubmit}>
            <Stack
                gap="sm"
                p="md"
                style={{
                    border: '1px solid var(--mantine-color-gray-3)',
                    borderRadius: 'var(--mantine-radius-sm)',
                    backgroundColor: 'var(--mantine-color-gray-0)',
                }}
            >
                <TextInput
                    label="Server Name"
                    placeholder="My slskd Server"
                    required
                    {...form.getInputProps('name')}
                />

                <TextInput
                    label="Server URL"
                    placeholder="http://localhost:5030"
                    required
                    {...form.getInputProps('baseUrl')}
                />

                <TextInput
                    label="Username"
                    placeholder="Enter username"
                    required
                    {...form.getInputProps('username')}
                />

                <PasswordInput
                    label="Password"
                    placeholder="Enter password"
                    required
                    {...form.getInputProps('password')}
                />

                <Group justify="flex-end" gap="sm">
                    <Button onClick={onCancel} variant="default">
                        Cancel
                    </Button>
                    <Button
                        disabled={!form.isValid()}
                        loading={isTestingConnection}
                        onClick={handleTestConnection}
                        variant="outline"
                    >
                        Test Connection
                    </Button>
                    <Button disabled={!form.isValid()} type="submit">
                        {initialData ? 'Update' : 'Add'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};