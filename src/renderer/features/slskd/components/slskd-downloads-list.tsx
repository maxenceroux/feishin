import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import { SlskdDownload } from '/@/renderer/api/slskd/slskd-types';
import { Badge } from '/@/shared/components/badge/badge';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Paper } from '/@/shared/components/paper/paper';
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

    // Determine aggregated state
    const states = files.map((f) => f.state);
    const uniqueStates = [...new Set(states)];
    let aggregatedState = '';

    if (uniqueStates.every((state) => state.includes('Completed'))) {
        aggregatedState = 'Completed';
    } else if (
        uniqueStates.some((state) => state.includes('InProgress') || state.includes('Queued'))
    ) {
        aggregatedState = 'In Progress';
    } else if (uniqueStates.some((state) => state.includes('Failed') || state.includes('Error'))) {
        aggregatedState = 'Failed';
    } else {
        aggregatedState = uniqueStates[0] || 'Unknown';
    }

    // Calculate average speed
    const activeSpeeds = files
        .map((f) => f.averageSpeed)
        .filter((speed): speed is number => speed !== undefined && speed > 0);
    const avgSpeed =
        activeSpeeds.length > 0
            ? activeSpeeds.reduce((sum, speed) => sum + speed, 0) / activeSpeeds.length
            : 0;

    return {
        aggregatedState,
        avgSpeed,
        fileCount: files.length,
        overallProgress,
        totalSize,
        totalTransferred,
    };
};

interface ExpandableDirectoryRowProps {
    directory: { directory: string; fileCount: number; files: SlskdDownload[] };
    username: string;
}

const ExpandableDirectoryRow = ({ directory, username }: ExpandableDirectoryRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
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
                    backgroundColor: 'var(--mantine-color-gray-0)',
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
                                backgroundColor: 'var(--mantine-color-gray-3)',
                                borderRadius: '2px',
                                height: '4px',
                                overflow: 'hidden',
                                width: '60px',
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: 'var(--mantine-color-blue-5)',
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
                        {stats.fileCount} files
                    </Text>
                </Table.Td>
            </Table.Tr>

            {/* Individual file rows when expanded */}
            {isExpanded &&
                directory.files.map((download) => (
                    <Table.Tr
                        key={download.id}
                        style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}
                    >
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
                                        backgroundColor: 'var(--mantine-color-gray-3)',
                                        borderRadius: '2px',
                                        height: '4px',
                                        overflow: 'hidden',
                                        width: '60px',
                                    }}
                                >
                                    <div
                                        style={{
                                            backgroundColor: 'var(--mantine-color-blue-5)',
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
                            <Stack gap={2}>
                                <Text opacity={0.7} size="xs">
                                    {download.state.includes('InProgress') && download.remainingTime
                                        ? `ETA: ${formatTime(download.remainingTime)}`
                                        : formatDate(download.startedAt)}
                                </Text>
                                {download.elapsedTime && (
                                    <Text opacity={0.7} size="xs">
                                        Elapsed: {formatTime(download.elapsedTime)}
                                    </Text>
                                )}
                            </Stack>
                        </Table.Td>
                    </Table.Tr>
                ))}
        </>
    );
};

export const SlskdDownloadsList = () => {
    const { t } = useTranslation();

    const { data, error, isLoading } = useQuery({
        queryFn: () => slskdApi.getRecentDownloads(50),
        queryKey: ['slskd', 'downloads'],
        refetchInterval: 5000, // Refetch every 5 seconds for live updates
        retry: 3,
    });

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

    return (
        <Stack gap="md" p="md">
            <Group justify="space-between">
                <Text fw={600} size="xl">
                    Recent Downloads
                </Text>
                <Badge variant="light">{totalDirectories} albums</Badge>
            </Group>

            <Paper p="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Album / Track</Table.Th>
                            <Table.Th>User</Table.Th>
                            <Table.Th>State</Table.Th>
                            <Table.Th>Progress</Table.Th>
                            <Table.Th>Size</Table.Th>
                            <Table.Th>Speed</Table.Th>
                            <Table.Th>Info</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {downloads.map((group) =>
                            group.directories?.map((directory) => (
                                <ExpandableDirectoryRow
                                    directory={directory}
                                    key={`${group.username}-${directory.directory}`}
                                    username={group.username}
                                />
                            )),
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Stack>
    );
};
