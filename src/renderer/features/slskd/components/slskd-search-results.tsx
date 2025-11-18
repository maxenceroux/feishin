import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UserFolderTree } from './slskd-folder-tree';
import { SlskdUserBrowseModal } from './slskd-user-browse-modal';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import {
    SlskdHierarchicalDirectory,
    SlskdHierarchicalFile,
} from '/@/renderer/api/slskd/slskd-types';
import {
    getAllFilesInDirectory,
    transformSearchResultsToHierarchical,
} from '/@/renderer/api/slskd/slskd-utils';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { Badge } from '/@/shared/components/badge/badge';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Paper } from '/@/shared/components/paper/paper';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';

interface SlskdSearchResultsProps {
    searchId: string;
    searchText: string;
}

export const SlskdSearchResults = ({ searchId, searchText }: SlskdSearchResultsProps) => {
    const { t } = useTranslation();
    const [browseUsername, setBrowseUsername] = useState<string | null>(null);

    const { data, error, isLoading, refetch } = useQuery({
        queryFn: () => slskdApi.getSearchResults(searchId),
        queryKey: ['slskd', 'search-results', searchId],
        // Pause auto-refresh when browse modal is open to avoid concurrent API calls
        // that can cause timeouts and slow response times
        refetchInterval: browseUsername ? false : 5000,
        retry: 3,
    });

    const handleRefresh = () => {
        refetch();
    };

    const handleBrowseUser = (username: string) => {
        setBrowseUsername(username);
    };

    const handleCloseBrowse = () => {
        setBrowseUsername(null);
    };

    const handleDownloadFile = async (file: SlskdHierarchicalFile, username: string) => {
        try {
            console.log('Starting file download:', { file, username });
            // Prepare files array for API
            const files = [
                {
                    code: file.code,
                    filename: file.filename,
                    size: file.size,
                },
            ];
            await slskdApi.downloadFile(username, files);

            // Show success feedback
            console.log(`Download started: ${file.filename} from ${username}`);
            // TODO: Add toast notification or other UI feedback
        } catch (error) {
            console.error('Failed to start download:', error);
            // TODO: Add proper error handling UI
            alert('Failed to start download. Please check your connection and try again.');
        }
    };

    const handleDownloadFolder = async (
        directory: SlskdHierarchicalDirectory,
        username: string,
    ) => {
        try {
            console.log('Starting folder download:', { directory, username });

            // Get all files in the directory and subdirectories
            const allFiles = getAllFilesInDirectory(directory);

            // Prepare files array for API
            const files = allFiles.map((file) => ({
                code: file.code,
                filename: file.filename,
                size: file.size,
            }));

            await slskdApi.downloadFile(username, files);

            // Show success feedback
            console.log(
                `Download started: ${allFiles.length} files from folder "${directory.name}" (${username})`,
            );
            // TODO: Add toast notification or other UI feedback
        } catch (error) {
            console.error('Failed to start folder download:', error);
            // TODO: Add proper error handling UI
            alert('Failed to start folder download. Please check your connection and try again.');
        }
    };

    if (isLoading) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Spinner size={24} />
                    <Text>{t('soulseek.loading', { postProcess: 'titleCase' })}</Text>
                    <Text opacity={0.7} size="sm">
                        Loading search results for "{searchText}"
                    </Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
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
                            Failed to load search results. Please check your connection and try
                            again.
                        </Text>
                        <Text opacity={0.7} size="xs">
                            {error instanceof Error ? error.message : 'Unknown error'}
                        </Text>
                    </Stack>
                </Paper>
            </Center>
        );
    }

    const results = data?.results || [];

    // Transform flat search results to hierarchical structure
    const hierarchicalResults = transformSearchResultsToHierarchical(results);

    const totalFiles = hierarchicalResults.reduce(
        (sum, result) => sum + result.totalFileCount,
        0,
    );

    if (results.length === 0) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Icon icon="search" size="4rem" />
                    <Text opacity={0.7} size="lg">
                        No results found
                    </Text>
                    <Text opacity={0.5} size="sm">
                        No files found for search "{searchText}"
                    </Text>
                </Stack>
            </Center>
        );
    }

    return (
        <Stack gap="md" p="md" style={{ height: '100vh', overflow: 'hidden' }}>
            <Group justify="space-between">
                <Stack gap={2}>
                    <Text fw={600} size="xl">
                        Search Results
                    </Text>
                    <Text opacity={0.7} size="sm">
                        "{searchText}"
                    </Text>
                </Stack>
                <Group gap="sm">
                    <Badge variant="light">{results.length} users</Badge>
                    <Badge variant="light">{totalFiles} files</Badge>
                    <RefreshButton onClick={handleRefresh} />
                </Group>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>
                                <Group gap="xs">
                                    <Icon icon="folder" size="0.8rem" />
                                    User / Folder / File
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
                                    Speed / Quality
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
                        {hierarchicalResults.map((result) => (
                            <UserFolderTree
                                key={result.username}
                                hasFreeUploadSlot={result.hasFreeUploadSlot}
                                onBrowseUser={handleBrowseUser}
                                onDownloadFile={handleDownloadFile}
                                onDownloadFolder={handleDownloadFolder}
                                queueLength={result.queueLength}
                                rootDirectories={result.directories}
                                totalFileCount={result.totalFileCount}
                                uploadSpeed={result.uploadSpeed}
                                username={result.username}
                            />
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>

            {browseUsername && (
                <SlskdUserBrowseModal
                    onClose={handleCloseBrowse}
                    opened={!!browseUsername}
                    username={browseUsername}
                />
            )}
        </Stack>
    );
};
