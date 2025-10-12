import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    const form = useForm({
        initialValues: {
            baseUrl: initialData?.baseUrl || 'http://localhost:5030',
            name: initialData?.name || '',
            password: initialData?.password || '',
            username: initialData?.username || '',
        },
        validate: {
            name: (value) => (!value ? t('form.required', { postProcess: 'sentenceCase' }) : null),
            baseUrl: (value) => {
                if (!value) return t('form.required', { postProcess: 'sentenceCase' });
                try {
                    new URL(value);
                    return null;
                } catch {
                    return t('form.invalidUrl', { postProcess: 'sentenceCase' });
                }
            },
            username: (value) =>
                !value ? t('form.required', { postProcess: 'sentenceCase' }) : null,
            password: (value) =>
                !value ? t('form.required', { postProcess: 'sentenceCase' }) : null,
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
                    message: t('form.testConnection.success', { postProcess: 'sentenceCase' }),
                });
            } else {
                toast.error({
                    message: t('form.testConnection.failed', { postProcess: 'sentenceCase' }),
                });
            }
        } catch (error) {
            toast.error({
                message: t('form.testConnection.error', {
                    postProcess: 'sentenceCase',
                    error: error instanceof Error ? error.message : 'Unknown error',
                }),
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
                    label={t('form.addServer.input', {
                        context: 'name',
                        postProcess: 'sentenceCase',
                    })}
                    placeholder={t('form.addServer.placeholder', {
                        context: 'name',
                        postProcess: 'sentenceCase',
                    })}
                    required
                    {...form.getInputProps('name')}
                />

                <TextInput
                    label={t('form.addServer.input', {
                        context: 'url',
                        postProcess: 'sentenceCase',
                    })}
                    placeholder="http://localhost:5030"
                    required
                    {...form.getInputProps('baseUrl')}
                />

                <TextInput
                    label={t('form.addServer.input', {
                        context: 'username',
                        postProcess: 'sentenceCase',
                    })}
                    placeholder={t('form.addServer.placeholder', {
                        context: 'username',
                        postProcess: 'sentenceCase',
                    })}
                    required
                    {...form.getInputProps('username')}
                />

                <PasswordInput
                    label={t('form.addServer.input', {
                        context: 'password',
                        postProcess: 'sentenceCase',
                    })}
                    placeholder={t('form.addServer.placeholder', {
                        context: 'password',
                        postProcess: 'sentenceCase',
                    })}
                    required
                    {...form.getInputProps('password')}
                />

                <Group justify="flex-end" gap="sm">
                    <Button onClick={onCancel} variant="default">
                        {t('common.cancel', { postProcess: 'sentenceCase' })}
                    </Button>
                    <Button
                        disabled={!form.isValid()}
                        loading={isTestingConnection}
                        onClick={handleTestConnection}
                        variant="outline"
                    >
                        {t('form.testConnection.title', { postProcess: 'sentenceCase' })}
                    </Button>
                    <Button disabled={!form.isValid()} type="submit">
                        {initialData
                            ? t('common.update', { postProcess: 'sentenceCase' })
                            : t('common.add', { postProcess: 'sentenceCase' })}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};