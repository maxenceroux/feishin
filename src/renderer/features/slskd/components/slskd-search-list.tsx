import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import { Badge } from '/@/shared/components/badge/badge';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Paper } from '/@/shared/components/paper/paper';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

export const SlskdSearchList = () => {
    const { t } = useTranslation();

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

    return (
        <Stack gap="md" p="md">
            <Group justify="space-between">
                <Text fw={600} size="xl">
                    Recent Searches
                </Text>
                <Badge variant="light">{searches.length} searches</Badge>
            </Group>

            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Search Text</Table.Th>
                        <Table.Th>State</Table.Th>
                        <Table.Th>Results</Table.Th>
                        <Table.Th>Files</Table.Th>
                        <Table.Th>Started</Table.Th>
                        <Table.Th>Duration</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {searches.map((search) => (
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
                                <Text opacity={0.7} size="sm">
                                    {search.elapsedTime
                                        ? `${Math.round(search.elapsedTime / 1000)}s`
                                        : '-'}
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Stack>
    );
};
