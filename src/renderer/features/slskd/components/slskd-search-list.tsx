import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
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

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

type SearchSortField = 'files' | 'results' | 'searchText' | 'started' | 'state';
type SortDirection = 'asc' | 'desc';

export const SlskdSearchList = () => {
    const { t } = useTranslation();
    const [sortField, setSortField] = useState<SearchSortField>('started');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SearchSortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const { data, error, isLoading } = useQuery({
        queryFn: () => slskdApi.getRecentSearches(50),
        queryKey: ['slskd', 'searches'],
        refetchInterval: 30000, // Refetch every 30 seconds
        retry: 3,
    });

    console.log('SlskdSearchList component data:', data);
    console.log('SlskdSearchList component error:', error);
    console.log('SlskdSearchList component isLoading:', isLoading);

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

    const searches = data?.searches || [];
    console.log('SlskdSearchList searches array:', searches);
    console.log('SlskdSearchList searches length:', searches.length);

    if (searches.length === 0) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Icon icon="search" size="4rem" />
                    <Text opacity={0.7} size="lg">
                        No recent searches found
                    </Text>
                    <Text opacity={0.5} size="sm">
                        Debug: Data structure - {JSON.stringify(data, null, 2)}
                    </Text>
                </Stack>
            </Center>
        );
    }

    // Sort searches based on current sort settings
    const sortedSearches = [...searches].sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;

        switch (sortField) {
            case 'files':
                return direction * (a.fileCount - b.fileCount);
            case 'results':
                return direction * (a.responseCount - b.responseCount);
            case 'searchText':
                return direction * a.searchText.localeCompare(b.searchText);
            case 'started':
                return (
                    direction * (new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
                );
            case 'state':
                return direction * a.state.localeCompare(b.state);
            default:
                return 0;
        }
    });

    const SortableHeader = ({
        children,
        field,
    }: {
        children: React.ReactNode;
        field: SearchSortField;
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
                <Text fw={600} size="xl">
                    Recent Searches
                </Text>
                <Badge variant="light">{searches.length} searches</Badge>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <SortableHeader field="searchText">Search Text</SortableHeader>
                            <SortableHeader field="state">State</SortableHeader>
                            <SortableHeader field="results">Results</SortableHeader>
                            <SortableHeader field="files">Files</SortableHeader>
                            <SortableHeader field="started">Started</SortableHeader>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sortedSearches.map((search) => (
                            <Table.Tr key={search.id}>
                                <Table.Td>
                                    <Text fw={500} style={{ maxWidth: 200 }}>
                                        {search.searchText}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="subtle">{search.state}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{search.responseCount}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{search.fileCount}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text opacity={0.7} size="sm">
                                        {formatDate(search.startedAt)}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Stack>
    );
};
