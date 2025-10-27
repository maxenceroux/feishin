import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SlskdSearchResults } from './slskd-search-results';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
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
import { TextInput } from '/@/shared/components/text-input/text-input';
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
    const [selectedSearchId, setSelectedSearchId] = useState<null | string>(null);
    const [newSearchQuery, setNewSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSort = (field: SearchSortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleNewSearch = async () => {
        if (!newSearchQuery.trim() || isSearching) return;

        setIsSearching(true);
        try {
            const searchId = await slskdApi.startSearch(newSearchQuery.trim());
            console.log('Started search with ID:', searchId);
            setSelectedSearchId(searchId);
            // Refetch the searches list to show the new search
            refetch();
        } catch (error) {
            console.error('Failed to start search:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleViewResults = (searchId: string) => {
        setSelectedSearchId(searchId);
    };

    const handleRefresh = () => {
        refetch();
    };

    const { data, error, isLoading, refetch } = useQuery({
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
                    <Text>{t('soulseek.loading', { postProcess: 'titleCase' })}</Text>
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

    // If viewing search results, show the results component
    if (selectedSearchId) {
        const selectedSearch = searches.find((s) => s.id === selectedSearchId);
        const searchText = selectedSearch?.searchText || newSearchQuery;

        return (
            <Stack gap="md" p="md" style={{ height: '100vh', overflow: 'hidden' }}>
                <Group justify="space-between">
                    <Button
                        leftSection={<Icon icon="arrowLeftS" />}
                        onClick={() => setSelectedSearchId(null)}
                        variant="subtle"
                    >
                        Back to Searches
                    </Button>
                </Group>
                <SlskdSearchResults searchId={selectedSearchId} searchText={searchText} />
            </Stack>
        );
    }

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
                    Soulseek Search
                </Text>
                <Group gap="sm">
                    <Badge variant="light">{searches.length} searches</Badge>
                    <RefreshButton onClick={handleRefresh} />
                </Group>
            </Group>

            {/* New Search Section */}
            <Paper p="md" withBorder>
                <Stack gap="sm">
                    <Text fw={500} size="md">
                        Start New Search
                    </Text>
                    <Group gap="sm">
                        <TextInput
                            onChange={(e) => setNewSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleNewSearch();
                                }
                            }}
                            placeholder="Enter search terms (artist, album, song...)"
                            style={{ flex: 1 }}
                            value={newSearchQuery}
                        />
                        <Button
                            disabled={!newSearchQuery.trim()}
                            leftSection={<Icon icon="search" />}
                            loading={isSearching}
                            onClick={handleNewSearch}
                        >
                            Search
                        </Button>
                    </Group>
                </Stack>
            </Paper>

            <ScrollArea style={{ flex: 1 }}>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <SortableHeader field="searchText">Search Text</SortableHeader>
                            <SortableHeader field="state">State</SortableHeader>
                            <SortableHeader field="results">Results</SortableHeader>
                            <SortableHeader field="files">Files</SortableHeader>
                            <SortableHeader field="started">Started</SortableHeader>
                            <Table.Th>Actions</Table.Th>
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
                                <Table.Td>
                                    <Button
                                        disabled={search.responseCount === 0}
                                        leftSection={<Icon icon="folder" />}
                                        onClick={() => handleViewResults(search.id)}
                                        size="xs"
                                        variant="filled"
                                    >
                                        View Results
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Stack>
    );
};
