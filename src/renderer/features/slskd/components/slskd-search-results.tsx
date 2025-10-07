import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import { SlskdSearchResult, SlskdSearchResultFile } from '/@/renderer/api/slskd/slskd-types';
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

interface SlskdSearchResultsProps {
    searchId: string;
    searchText: string;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

const formatBitrate = (bitrate?: number): string => {
    return bitrate ? `${bitrate} kbps` : '-';
};

const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface ExpandableUserRowProps {
    result: SlskdSearchResult;
    onDownload: (file: SlskdSearchResultFile, username: string) => void;
}

const ExpandableUserRow = ({ result, onDownload }: ExpandableUserRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { username, files, uploadSpeed, hasFreeUploadSlot, queueLength } = result;

    const handleDownload = (file: SlskdSearchResultFile) => {
        onDownload(file, username);
    };

    return (
        <>
            {/* User row */}
            <Table.Tr
                key={`user-${username}`}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    cursor: 'pointer',
                    backgroundColor: 'var(--mantine-color-gray-0)',
                    borderLeft: '3px solid var(--mantine-color-blue-5)',
                }}
            >
                <Table.Td>
                    <Group gap="xs">
                        <Icon icon={isExpanded ? 'arrowDownS' : 'arrowRightS'} size="1rem" />
                        <Icon icon="user" color="var(--mantine-color-blue-6)" />
                        <Text fw={600}>{username}</Text>
                        {/* Note: Country code not available in current API response */}
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Icon icon="folder" size="0.875rem" />
                        <Text size="sm">{files.length} files</Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Icon icon="speed" size="0.875rem" />
                        <Text size="sm">
                            {uploadSpeed ? `${Math.round(uploadSpeed / 1024)} KB/s` : '-'}
                        </Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text size="sm">-</Text> {/* Client version not available in current API */}
                </Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        {hasFreeUploadSlot && <Badge size="xs" color="green">Free slot</Badge>}
                        {queueLength !== undefined && (
                            <Badge size="xs" variant="light">
                                Queue: {queueLength}
                            </Badge>
                        )}
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text size="xs" opacity={0.7}>
                        Click to {isExpanded ? 'collapse' : 'expand'}
                    </Text>
                </Table.Td>
            </Table.Tr>

            {/* Expanded files */}
            {isExpanded &&
                files.map((file, index) => (
                    <Table.Tr 
                        key={`${username}-${file.filename}-${index}`} 
                        style={{ 
                            backgroundColor: 'var(--mantine-color-gray-0)',
                            borderLeft: '3px solid var(--mantine-color-blue-2)',
                        }}
                    >
                        <Table.Td style={{ paddingLeft: '2.5rem' }}>
                            <Group gap="xs">
                                <Icon icon="music" size="0.875rem" color="var(--mantine-color-green-6)" />
                                <Stack gap={1}>
                                    <Text size="sm" fw={500} style={{ maxWidth: 300 }}>
                                        {file.filename.split('/').pop() || file.filename}
                                    </Text>
                                    {(file.artist || file.album) && (
                                        <Text size="xs" opacity={0.7}>
                                            {file.artist && file.album
                                                ? `${file.artist} - ${file.album}`
                                                : file.artist || file.album}
                                        </Text>
                                    )}
                                </Stack>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs">
                                <Icon icon="fileText" size="0.875rem" />
                                <Text size="sm">{formatFileSize(file.size)}</Text>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs">
                                <Icon icon="headphone" size="0.875rem" />
                                <Text size="sm">{formatBitrate(file.bitRate)}</Text>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs">
                                <Icon icon="time" size="0.875rem" />
                                <Text size="sm">{formatDuration(file.length)}</Text>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs">
                                {file.track && (
                                    <Badge size="xs" variant="light">
                                        Track {file.track}
                                    </Badge>
                                )}
                                {file.sampleRate && (
                                    <Badge size="xs" variant="outline">
                                        {file.sampleRate} Hz
                                    </Badge>
                                )}
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Button
                                size="xs"
                                variant="light"
                                color="green"
                                leftSection={<Icon icon="download" size="0.75rem" />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file);
                                }}
                            >
                                Download
                            </Button>
                        </Table.Td>
                    </Table.Tr>
                ))}
        </>
    );
};

export const SlskdSearchResults = ({ searchId, searchText }: SlskdSearchResultsProps) => {
    const { t } = useTranslation();

    const { data, error, isLoading } = useQuery({
        queryFn: () => slskdApi.getSearchResults(searchId),
        queryKey: ['slskd', 'search-results', searchId],
        refetchInterval: 5000, // Refetch every 5 seconds while search is active
        retry: 3,
    });

    const handleDownload = async (file: SlskdSearchResultFile, username: string) => {
        try {
            console.log('Starting download:', { file, username });
            await slskdApi.downloadFile(username, file.filename, file.token);
            
            // Show success feedback
            console.log(`Download started: ${file.filename} from ${username}`);
            // TODO: Add toast notification or other UI feedback
        } catch (error) {
            console.error('Failed to start download:', error);
            // TODO: Add proper error handling UI
            alert('Failed to start download. Please check your connection and try again.');
        }
    };

    if (isLoading) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Spinner size={24} />
                    <Text>{t('common.loading', { postProcess: 'titleCase' })}</Text>
                    <Text size="sm" opacity={0.7}>
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
                            Failed to load search results. Please check your connection and try again.
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
    const totalFiles = results.reduce((sum, result) => sum + result.files.length, 0);

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
                    <Text size="sm" opacity={0.7}>
                        "{searchText}"
                    </Text>
                </Stack>
                <Group gap="sm">
                    <Badge variant="light">{results.length} users</Badge>
                    <Badge variant="light">{totalFiles} files</Badge>
                </Group>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>User / File</Table.Th>
                            <Table.Th>Size / Files</Table.Th>
                            <Table.Th>Speed / Bitrate</Table.Th>
                            <Table.Th>Client / Duration</Table.Th>
                            <Table.Th>Info</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {results.map((result) => (
                            <ExpandableUserRow
                                key={result.username}
                                result={result}
                                onDownload={handleDownload}
                            />
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Stack>
    );
};