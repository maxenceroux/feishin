import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FolderTree } from './slskd-folder-tree';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import {
    SlskdHierarchicalDirectory,
    SlskdHierarchicalFile,
} from '/@/renderer/api/slskd/slskd-types';
import {
    getAllFilesInDirectory,
    transformBrowseToHierarchical,
} from '/@/renderer/api/slskd/slskd-utils';
import { Modal as MantineModal } from '@mantine/core';

import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Paper } from '/@/shared/components/paper/paper';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';

interface SlskdUserBrowseModalProps {
    onClose: () => void;
    opened: boolean;
    username: string;
}

export const SlskdUserBrowseModal = ({ opened, onClose, username }: SlskdUserBrowseModalProps) => {
    const { t } = useTranslation();
    const [downloadingFolder, setDownloadingFolder] = useState<string | null>(null);

    const { data, error, isLoading } = useQuery({
        enabled: opened && !!username,
        queryFn: () => slskdApi.browseUser(username),
        queryKey: ['slskd', 'browse-user', username],
        retry: 1, // Only retry once since browse operations are slow
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const handleDownloadFile = async (file: SlskdHierarchicalFile) => {
        try {
            console.log('Starting file download:', { file, username });
            const files = [
                {
                    code: file.code,
                    filename: file.filename,
                    size: file.size,
                },
            ];
            await slskdApi.downloadFile(username, files);
            console.log(`Download started: ${file.filename} from ${username}`);
        } catch (error) {
            console.error('Failed to start download:', error);
            alert('Failed to start download. Please check your connection and try again.');
        }
    };

    const handleDownloadFolder = async (directory: SlskdHierarchicalDirectory) => {
        try {
            console.log('Starting folder download:', { directory, username });
            setDownloadingFolder(directory.path);

            const allFiles = getAllFilesInDirectory(directory);
            const files = allFiles.map((file) => ({
                code: file.code,
                filename: file.filename,
                size: file.size,
            }));

            await slskdApi.downloadFile(username, files);
            console.log(
                `Download started: ${allFiles.length} files from folder "${directory.name}" (${username})`,
            );
        } catch (error) {
            console.error('Failed to start folder download:', error);
            alert('Failed to start folder download. Please check your connection and try again.');
        } finally {
            setDownloadingFolder(null);
        }
    };

    const handleDownloadAll = async () => {
        if (!hierarchicalData) return;
        
        try {
            console.log('Starting download of all files from user:', username);
            for (const dir of hierarchicalData.directories) {
                await handleDownloadFolder(dir);
            }
        } catch (error) {
            console.error('Failed to download all files:', error);
        }
    };

    const hierarchicalData = data ? transformBrowseToHierarchical(data) : null;

    return (
        <MantineModal
            centered
            onClose={onClose}
            opened={opened}
            size="xl"
            title={
                <Group gap="sm">
                    <Icon icon="user" />
                    <Text fw={600}>Browse {username}'s Shared Folders</Text>
                </Group>
            }
        >
            <Stack gap="md" style={{ minHeight: '60vh' }}>
                {isLoading && (
                    <Center style={{ height: '50vh' }}>
                        <Stack gap="md">
                            <Spinner size={24} />
                            <Text>{t('soulseek.loading', { postProcess: 'titleCase' })}</Text>
                            <Text opacity={0.7} size="sm">
                                Loading shared folders from {username}...
                            </Text>
                        </Stack>
                    </Center>
                )}

                {error && (
                    <Center style={{ height: '50vh' }}>
                        <Paper
                            p="md"
                            style={{ border: '1px solid var(--mantine-color-error)', maxWidth: 500 }}
                        >
                            <Stack gap="sm">
                                <Group gap="sm">
                                    <Icon icon="warn" />
                                    <Text fw={600}>
                                        {t('error.genericError', { postProcess: 'titleCase' })}
                                    </Text>
                                </Group>
                                <Text size="sm">
                                    Failed to load user's shared folders. The user may be offline or
                                    their shares may be locked.
                                </Text>
                                <Text opacity={0.7} size="xs">
                                    {error instanceof Error ? error.message : 'Unknown error'}
                                </Text>
                            </Stack>
                        </Paper>
                    </Center>
                )}

                {!isLoading && !error && hierarchicalData && (
                    <>
                        <Group justify="space-between">
                            <Group gap="sm">
                                <Badge variant="light">
                                    {data?.directoryCount || 0} directories
                                </Badge>
                                <Badge variant="light">
                                    {data?.fileCount || 0} files
                                </Badge>
                            </Group>
                            <Button
                                onClick={handleDownloadAll}
                                size="sm"
                                variant="filled"
                            >
                                <Icon icon="download" size="0.9rem" />
                                <span style={{ marginLeft: '0.5rem' }}>Download All Files</span>
                            </Button>
                        </Group>

                        {hierarchicalData.directories.length === 0 ? (
                            <Center style={{ height: '40vh' }}>
                                <Stack gap="md">
                                    <Icon icon="folder" size="4rem" />
                                    <Text opacity={0.7} size="lg">
                                        No shared folders
                                    </Text>
                                    <Text opacity={0.5} size="sm">
                                        User {username} has no shared folders available
                                    </Text>
                                </Stack>
                            </Center>
                        ) : (
                            <ScrollArea style={{ flex: 1, maxHeight: '60vh' }}>
                                <Table>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>
                                                <Group gap="xs">
                                                    <Icon icon="folder" size="0.8rem" />
                                                    Folder / File
                                                </Group>
                                            </Table.Th>
                                            <Table.Th>
                                                <Group gap="xs">
                                                    <Icon icon="info" size="0.8rem" />
                                                    Size / Files
                                                </Group>
                                            </Table.Th>
                                            <Table.Th>
                                                <Group gap="xs">
                                                    <Icon icon="info" size="0.8rem" />
                                                    Quality
                                                </Group>
                                            </Table.Th>
                                            <Table.Th>
                                                <Group gap="xs">
                                                    <Icon icon="info" size="0.8rem" />
                                                    Duration
                                                </Group>
                                            </Table.Th>
                                            <Table.Th>
                                                <Group gap="xs">
                                                    <Icon icon="info" size="0.8rem" />
                                                    Details
                                                </Group>
                                            </Table.Th>
                                            <Table.Th>
                                                <Group gap="xs">
                                                    <Icon icon="download" size="0.8rem" />
                                                    Actions
                                                </Group>
                                            </Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {hierarchicalData.directories.map((directory) => (
                                            <FolderTree
                                                key={directory.path}
                                                directory={directory}
                                                level={0}
                                                onDownloadFile={handleDownloadFile}
                                                onDownloadFolder={handleDownloadFolder}
                                                username={username}
                                            />
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        )}
                    </>
                )}
            </Stack>
        </MantineModal>
    );
};
