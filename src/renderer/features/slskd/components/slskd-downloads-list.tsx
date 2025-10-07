import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import { SlskdDownload } from '/@/renderer/api/slskd/slskd-types';
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

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number | undefined): string => {
    if (!bytesPerSecond || bytesPerSecond === 0) return '-';
    return `${formatFileSize(bytesPerSecond)}/s`;
};

const formatTime = (seconds: number | undefined): string => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
};

// Calculate aggregated stats for a directory
const calculateDirectoryStats = (files: SlskdDownload[]) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalTransferred = files.reduce((sum, file) => sum + file.bytesTransferred, 0);
    const overallProgress = totalSize > 0 ? (totalTransferred / totalSize) * 100 : 0;

    // Improved state aggregation logic
    const states = files.map((f) => f.state);
    let aggregatedState = '';

    // Check for any errored items first
    if (states.some((state) => state.includes('Error') || state.includes('Failed'))) {
        aggregatedState = 'Error';
    }
    // Check if all are completed successfully (no error states)
    else if (states.every((state) => state.includes('Completed') && !state.includes('Error'))) {
        aggregatedState = 'Completed';
    }
    // Check for any in progress
    else if (states.some((state) => state.includes('InProgress') || state.includes('Queued'))) {
        aggregatedState = 'In Progress';
    }
    // Fallback
    else {
        aggregatedState = states[0] || 'Unknown';
    }

    // Calculate average speed
    const activeSpeeds = files
        .map((f) => f.averageSpeed)
        .filter((speed): speed is number => speed !== undefined && speed > 0);
    const avgSpeed =
        activeSpeeds.length > 0
            ? activeSpeeds.reduce((sum, speed) => sum + speed, 0) / activeSpeeds.length
            : 0;

    // Find the earliest start time for the directory
    const startTimes = files
        .map((f) => f.startedAt || f.requestedAt || f.enqueuedAt)
        .filter((time): time is string => time !== undefined)
        .map((time) => new Date(time).getTime())
        .filter((time) => !isNaN(time));

    const earliestStartTime =
        startTimes.length > 0 ? new Date(Math.min(...startTimes)).toISOString() : undefined;

    return {
        aggregatedState,
        avgSpeed,
        earliestStartTime,
        fileCount: files.length,
        overallProgress,
        totalSize,
        totalTransferred,
    };
};

interface ExpandableDirectoryRowProps {
    directory: { directory: string; fileCount: number; files: SlskdDownload[] };
    username: string;
    onRemoveDownload: (username: string, downloadId: string) => Promise<void>;
    onRemoveDirectory: (username: string, directory: string) => Promise<void>;
}
type SortDirection = 'asc' | 'desc';

type SortField = 'album' | 'progress' | 'size' | 'speed' | 'startTime' | 'state' | 'user';

const ExpandableDirectoryRow = ({ directory, username, onRemoveDownload, onRemoveDirectory }: ExpandableDirectoryRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleRemoveDownload = async (downloadId: string) => {
        await onRemoveDownload(username, downloadId);
    };

    const handleRemoveDirectory = async () => {
        await onRemoveDirectory(username, directory.directory);
    };
    const stats = calculateDirectoryStats(directory.files);

    // Extract album name from directory path
    const albumName = directory.directory.split('\\').pop() || directory.directory;

    return (
        <>
            {/* Directory/Album row */}
            <Table.Tr
                key={`dir-${directory.directory}`}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    cursor: 'pointer',
                }}
            >
                <Table.Td>
                    <Group gap="xs">
                        <Icon icon={isExpanded ? 'arrowDownS' : 'arrowRightS'} size="1rem" />
                        <Icon icon="folder" />
                        <Text fw={600} style={{ maxWidth: 300 }}>
                            {albumName}
                        </Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text size="sm">{username}</Text>
                </Table.Td>
                <Table.Td>
                    <Badge variant="subtle">{stats.aggregatedState}</Badge>
                </Table.Td>
                <Table.Td>
                    <Stack gap={2}>
                        <div
                            style={{
                                backgroundColor: 'var(--theme-colors-border)',
                                borderRadius: '2px',
                                height: '4px',
                                overflow: 'hidden',
                                width: '60px',
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: 'var(--theme-colors-primary)',
                                    height: '100%',
                                    transition: 'width 0.3s',
                                    width: `${stats.overallProgress}%`,
                                }}
                            />
                        </div>
                        <Text opacity={0.7} size="xs">
                            {stats.overallProgress.toFixed(1)}%
                        </Text>
                    </Stack>
                </Table.Td>
                <Table.Td>
                    <Text size="sm">
                        {formatFileSize(stats.totalTransferred)} / {formatFileSize(stats.totalSize)}
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Text opacity={0.7} size="sm">
                        {formatSpeed(stats.avgSpeed)}
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Text opacity={0.7} size="sm">
                        {formatDate(stats.earliestStartTime)}
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Button
                            size="xs"
                            variant="filled"
                            color="red"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDirectory();
                            }}
                        >
                            Remove Folder
                        </Button>
                        <Text opacity={0.7} size="sm">
                            {stats.fileCount} files
                        </Text>
                    </Group>
                </Table.Td>
            </Table.Tr>

            {/* Individual file rows when expanded */}
            {isExpanded &&
                directory.files.map((download) => (
                    <Table.Tr key={download.id}>
                        <Table.Td>
                            <Group gap="xs" pl="2rem">
                                <Icon icon="track" size="0.8rem" />
                                <Text size="sm" style={{ maxWidth: 280 }}>
                                    {download.filename.split('\\').pop() || download.filename}
                                </Text>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">{download.username}</Text>
                        </Table.Td>
                        <Table.Td>
                            <Badge size="sm" variant="subtle">
                                {download.state}
                            </Badge>
                        </Table.Td>
                        <Table.Td>
                            <Stack gap={2}>
                                <div
                                    style={{
                                        backgroundColor: 'var(--theme-colors-border)',
                                        borderRadius: '2px',
                                        height: '4px',
                                        overflow: 'hidden',
                                        width: '60px',
                                    }}
                                >
                                    <div
                                        style={{
                                            backgroundColor: 'var(--theme-colors-primary)',
                                            height: '100%',
                                            transition: 'width 0.3s',
                                            width: `${download.percentComplete}%`,
                                        }}
                                    />
                                </div>
                                <Text opacity={0.7} size="xs">
                                    {download.percentComplete.toFixed(1)}%
                                </Text>
                            </Stack>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">
                                {formatFileSize(download.bytesTransferred)} /{' '}
                                {formatFileSize(download.size)}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                            <Text opacity={0.7} size="sm">
                                {formatSpeed(download.averageSpeed)}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                            <Text opacity={0.7} size="sm">
                                {formatDate(
                                    download.startedAt ||
                                        download.requestedAt ||
                                        download.enqueuedAt,
                                )}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs">
                                <Button
                                    size="xs"
                                    variant="filled"
                                    color="red"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveDownload(download.id);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Stack gap={2}>
                                    <Text opacity={0.7} size="xs">
                                        {download.state.includes('InProgress') && download.remainingTime
                                            ? `ETA: ${formatTime(download.remainingTime)}`
                                            : download.elapsedTime
                                              ? `Elapsed: ${formatTime(download.elapsedTime)}`
                                              : '-'}
                                    </Text>
                                </Stack>
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                ))}
        </>
    );
};

export const SlskdDownloadsList = () => {
    const { t } = useTranslation();
    const [sortField, setSortField] = useState<SortField>('album');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [isRemoving, setIsRemoving] = useState(false);

    const { data, error, isLoading, refetch } = useQuery({
        queryFn: () => slskdApi.getRecentDownloads(50),
        queryKey: ['slskd', 'downloads'],
        refetchInterval: 5000, // Refetch every 5 seconds for live updates
        retry: 3,
    });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleRemoveSucceeded = async () => {
        setIsRemoving(true);
        try {
            await slskdApi.removeCompletedDownloads();
            // Refetch data after successful removal
            refetch();
        } catch (error) {
            console.error('Failed to remove completed downloads:', error);
        } finally {
            setIsRemoving(false);
        }
    };

    const handleRemoveDownload = async (username: string, downloadId: string) => {
        try {
            await slskdApi.removeDownload(username, downloadId);
            await refetch(); // Refresh the data after removal
        } catch (error) {
            console.error('Failed to remove download:', error);
        }
    };

    const handleRemoveDirectory = async (username: string, directory: string) => {
        try {
            await slskdApi.removeDirectory(username, directory);
            await refetch(); // Refresh the data after removal
        } catch (error) {
            console.error('Failed to remove directory:', error);
        }
    };

    console.log('SlskdDownloadsList component data:', data);
    console.log('SlskdDownloadsList component error:', error);
    console.log('SlskdDownloadsList component isLoading:', isLoading);

    if (isLoading) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Spinner size={24} />
                    <Text>{t('common.loading', { postProcess: 'titleCase' })}</Text>
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
                            Failed to connect to slskd server. Please check your connection and try
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

    const downloads = data?.downloads || [];
    console.log('SlskdDownloadsList downloads array:', downloads);
    console.log('SlskdDownloadsList downloads length:', downloads.length);

    if (downloads.length === 0) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Icon icon="download" size="4rem" />
                    <Text opacity={0.7} size="lg">
                        No recent downloads found
                    </Text>
                    <Text opacity={0.5} size="sm">
                        Debug: Data structure - {JSON.stringify(data, null, 2)}
                    </Text>
                </Stack>
            </Center>
        );
    }

    // Calculate total count of all directories from all download groups
    const totalDirectories = downloads.reduce((sum, group) => {
        return sum + (group.directories?.length || 0);
    }, 0);

    // Flatten and sort data for sorting functionality
    const allDirectories = downloads.flatMap(
        (group) =>
            group.directories?.map((directory) => ({
                ...directory,
                stats: calculateDirectoryStats(directory.files),
                username: group.username,
            })) || [],
    );

    // Sort directories based on current sort settings
    const sortedDirectories = [...allDirectories].sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;

        switch (sortField) {
            case 'album':
                return (
                    direction *
                    (a.directory.split('\\').pop() || '').localeCompare(
                        b.directory.split('\\').pop() || '',
                    )
                );
            case 'progress':
                return direction * (a.stats.overallProgress - b.stats.overallProgress);
            case 'size':
                return direction * (a.stats.totalSize - b.stats.totalSize);
            case 'speed':
                return direction * (a.stats.avgSpeed - b.stats.avgSpeed);
            case 'startTime': {
                const timeA = a.stats.earliestStartTime
                    ? new Date(a.stats.earliestStartTime).getTime()
                    : 0;
                const timeB = b.stats.earliestStartTime
                    ? new Date(b.stats.earliestStartTime).getTime()
                    : 0;
                return direction * (timeA - timeB);
            }
            case 'state':
                return direction * a.stats.aggregatedState.localeCompare(b.stats.aggregatedState);
            case 'user':
                return direction * a.username.localeCompare(b.username);
            default:
                return 0;
        }
    });

    const SortableHeader = ({
        children,
        field,
    }: {
        children: React.ReactNode;
        field: SortField;
    }) => (
        <Table.Th
            onClick={() => handleSort(field)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
        >
            <Group gap="xs">
                {children}
                {sortField === field && (
                    <Icon
                        icon={sortDirection === 'asc' ? 'arrowUpS' : 'arrowDownS'}
                        size="0.8rem"
                    />
                )}
            </Group>
        </Table.Th>
    );

    return (
        <Stack gap="md" p="md" style={{ height: '100vh', overflow: 'hidden' }}>
            <Group justify="space-between">
                <Group gap="md">
                    <Text fw={600} size="xl">
                        Recent Downloads
                    </Text>
                    <Badge variant="light">{totalDirectories} albums</Badge>
                </Group>
                <Button
                    leftSection={<Icon icon="remove" />}
                    loading={isRemoving}
                    onClick={handleRemoveSucceeded}
                    size="sm"
                    variant="filled"
                >
                    Remove All Succeeded
                </Button>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <SortableHeader field="album">Album / Track</SortableHeader>
                            <SortableHeader field="user">User</SortableHeader>
                            <SortableHeader field="state">State</SortableHeader>
                            <SortableHeader field="progress">Progress</SortableHeader>
                            <SortableHeader field="size">Size</SortableHeader>
                            <SortableHeader field="speed">Speed</SortableHeader>
                            <SortableHeader field="startTime">Started</SortableHeader>
                            <Table.Th>Info</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sortedDirectories.map((directory) => (
                            <ExpandableDirectoryRow
                                directory={directory}
                                key={`${directory.username}-${directory.directory}`}
                                username={directory.username}
                                onRemoveDownload={handleRemoveDownload}
                                onRemoveDirectory={handleRemoveDirectory}
                            />
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Stack>
    );
};
