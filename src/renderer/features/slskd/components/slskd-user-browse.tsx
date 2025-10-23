import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { AlbumListGridView } from '/@/renderer/features/albums/components/album-list-grid-view';
import { ListContext } from '/@/renderer/context/list-context';
import { useCurrentServer } from '/@/renderer/store';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Paper } from '/@/shared/components/paper/paper';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Album } from '/@/shared/types/domain-types';
import { ALBUM_CARD_ROWS } from '/@/renderer/components/card/card-rows';
import { CardRow, Play } from '/@/shared/types/types';

export const SlskdUserBrowse = () => {
    const { t } = useTranslation();
    const { username } = useParams<{ username: string }>();
    const server = useCurrentServer();

    const { data: browseData, error, isLoading, refetch } = useQuery({
        queryFn: () => slskdApi.browse(username!),
        queryKey: ['slskd', 'browse', username],
        enabled: !!username,
        retry: 3,
    });

    // Extract directory names for Spotify searching
    const directoryQueries = useMemo(() => {
        if (!browseData) return [];
        
        return browseData
            .map((dir: any) => {
                const dirName = dir.directory || '';
                // Extract album name from directory path
                const parts = dirName.split(/[/\\]/);
                const albumPart = parts[parts.length - 1] || parts[parts.length - 2] || '';
                
                // Clean up common patterns like "(year)" and "[format]"
                const cleaned = albumPart
                    .replace(/\(\d{4}\)/g, '') // Remove (year)
                    .replace(/\[\w+\]/g, '') // Remove [format]
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                
                return cleaned;
            })
            .filter((query: string) => query.length > 2); // Only search for meaningful queries
    }, [browseData]);

    // Search Spotify for each directory
    const spotifySearchResults = useQuery({
        queryFn: async (): Promise<Album[]> => {
            if (!directoryQueries.length || !server?.id) return [];

            console.log('Searching Spotify for directories:', directoryQueries);
            
            try {
                // Fetch the token from the backend
                const tokenRes = await fetch('http://100.98.104.55:3001/api/spotify-token');
                const { access_token } = await tokenRes.json();
                
                // Import Spotify client dynamically to avoid circular deps
                const { spotifyClient } = await import('/@/renderer/api/spotify/spotify-client');
                await spotifyClient.setAccessToken(access_token);

                const allAlbums: Album[] = [];
                
                // Search for each directory query
                for (const query of directoryQueries.slice(0, 20)) { // Limit to first 20 to avoid rate limits
                    try {
                        const spotifyAlbums = await spotifyClient.searchAlbums(query, 1); // Get best match only
                        if (spotifyAlbums.length > 0) {
                            const mappedAlbum = spotifyClient.mapSpotifyAlbumToAlbum(spotifyAlbums[0], server.id);
                            allAlbums.push(mappedAlbum);
                        }
                    } catch (error) {
                        console.warn(`Failed to search Spotify for "${query}":`, error);
                    }
                }

                console.log('Spotify search results:', allAlbums);
                return allAlbums;
            } catch (error) {
                console.error('Spotify search error:', error);
                return [];
            }
        },
        queryKey: ['spotify', 'browse-search', username, directoryQueries],
        enabled: directoryQueries.length > 0 && !!server?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const handleRefresh = () => {
        refetch();
        spotifySearchResults.refetch();
    };

    if (isLoading) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Spinner size={24} />
                    <Text>{t('common.loading', { postProcess: 'titleCase' })}</Text>
                    <Text size="sm" opacity={0.7}>
                        Loading albums for user "{username}"
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
                            Failed to load albums for user "{username}". Please check your connection and try again.
                        </Text>
                        <Text opacity={0.7} size="xs">
                            {error instanceof Error ? error.message : 'Unknown error'}
                        </Text>
                        <Button onClick={handleRefresh} variant="outline" size="sm">
                            Try Again
                        </Button>
                    </Stack>
                </Paper>
            </Center>
        );
    }

    const directories = browseData || [];
    const albums = spotifySearchResults.data || [];

    if (directories.length === 0) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Icon icon="folder" size="4rem" />
                    <Text opacity={0.7} size="lg">
                        No directories found
                    </Text>
                    <Text opacity={0.5} size="sm">
                        User "{username}" has no shared directories
                    </Text>
                </Stack>
            </Center>
        );
    }

    if (albums.length === 0 && !spotifySearchResults.isLoading) {
        return (
            <Center style={{ height: '50vh' }}>
                <Stack gap="md">
                    <Icon icon="album" size="4rem" />
                    <Text opacity={0.7} size="lg">
                        No albums found
                    </Text>
                    <Text opacity={0.5} size="sm">
                        No albums could be matched for user "{username}"
                    </Text>
                    <Group gap="sm">
                        <Badge variant="light">{directories.length} directories found</Badge>
                        <Badge variant="light">0 albums matched</Badge>
                    </Group>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                        Retry Search
                    </Button>
                </Stack>
            </Center>
        );
    }

    // Custom card rows for this view
    const customCardRows: CardRow<Album>[] = [
        ALBUM_CARD_ROWS.name,
        ALBUM_CARD_ROWS.albumArtists,
        ALBUM_CARD_ROWS.releaseYear,
    ];

    // Create list context provider value
    const listContextValue = {
        customFilters: undefined,
        handlePlay: ({ playType }: { initialSongId?: string; playType: Play }) => {
            // Albums from Spotify don't have playable content in this context
            console.log('Play functionality not available for Spotify albums in browse view', playType);
        },
        id: `slskd-user-browse-${username}`,
        pageKey: `slskd-user-browse-${username}`,
        spotifyAlbums: albums,
        customCardRows,
    };

    return (
        <Stack gap="md" p="md" style={{ height: '100vh', overflow: 'hidden' }}>
            <Group justify="space-between">
                <Stack gap={2}>
                    <Text fw={600} size="xl">
                        Albums by {username}
                    </Text>
                    <Text size="sm" opacity={0.7}>
                        Matched albums from shared directories
                    </Text>
                </Stack>
                <Group gap="sm">
                    <Badge variant="light">{directories.length} directories</Badge>
                    <Badge variant="light">{albums.length} albums matched</Badge>
                    {spotifySearchResults.isLoading && (
                        <Badge variant="light" color="blue">
                            <Group gap="xs">
                                <Spinner size={12} />
                                Matching...
                            </Group>
                        </Badge>
                    )}
                    <RefreshButton onClick={handleRefresh} />
                </Group>
            </Group>

            <ListContext.Provider value={listContextValue}>
                <AlbumListGridView 
                    gridRef={{ current: null }} 
                    itemCount={albums.length}
                />
            </ListContext.Provider>
        </Stack>
    );
};