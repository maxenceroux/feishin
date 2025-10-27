import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import type { FallbackProps } from 'react-error-boundary';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumArtistListContent } from '/@/renderer/features/artists/components/album-artist-list-content';
import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSpotifyArtistSearch } from '/@/renderer/hooks/use-spotify-search';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { AlbumArtist, AlbumArtistListQuery, LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

// Error fallback component for the DiscoverArtistsRoute
const DiscoverArtistsErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const { t } = useTranslation();

    return (
        <Center style={{ height: '400px' }}>
            <Stack style={{ maxWidth: '50%' }}>
                <Group gap="xs">
                    <Icon fill="error" icon="error" size="lg" />
                    <Text size="lg">{t('error.genericError')}</Text>
                </Group>
                <Text>{error?.message}</Text>
                <Button onClick={resetErrorBoundary} variant="filled">
                    {t('common.reload')}
                </Button>
            </Stack>
        </Center>
    );
};

const DiscoverArtistsRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const pageKey = 'artist_discover';

    const artistListFilter = useListFilterByKey<AlbumArtistListQuery>({
        key: pageKey,
    });

    // Get search term from the filter state (from the search bar)
    const searchTerm = artistListFilter?.searchTerm || '';

    // Use Spotify search hook with the search term from the search bar
    const spotifySearchResult = useSpotifyArtistSearch({
        enabled: !!searchTerm.trim(),
        query: searchTerm,
        serverId: server?.id || '',
    });

    const [itemCount, setItemCount] = useState(0);

    // Update item count when Spotify results change
    useEffect(() => {
        setItemCount(spotifySearchResult.data?.length || 0);
    }, [spotifySearchResult.data]);

    const handlePlayQueueAdd = usePlayQueueAdd();

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            const spotifyArtists = spotifySearchResult.data || [];
            const artistIds = spotifyArtists.map((a) => a.id);

            handlePlayQueueAdd?.({
                byItemType: {
                    id: artistIds,
                    type: LibraryItem.ALBUM_ARTIST,
                },
                playType: args.playType,
            });
        },
        [handlePlayQueueAdd, spotifySearchResult.data],
    );

    const providerValue = useMemo(() => {
        // Use Spotify search results
        const spotifyArtists: AlbumArtist[] = spotifySearchResult.data || [];

        return {
            customFilters: undefined,
            handlePlay,
            id: 'spotify:discover:artists',
            pageKey,
            spotifyArtists,
        };
    }, [handlePlay, pageKey, spotifySearchResult.data]);

    return (
        <ErrorBoundary
            FallbackComponent={DiscoverArtistsErrorFallback}
            onError={(error, errorInfo) => {
                console.error('DiscoverArtistsRoute error:', error, errorInfo);
            }}
        >
            <AnimatedPage key={`discover-artists`}>
                <ListContext.Provider value={providerValue}>
                    <AlbumArtistListHeader
                        gridRef={gridRef}
                        itemCount={itemCount}
                        tableRef={tableRef}
                    />
                    {searchTerm ? (
                        <AlbumArtistListContent
                            gridRef={gridRef}
                            itemCount={itemCount}
                            tableRef={tableRef}
                        />
                    ) : (
                        <div
                            style={{
                                alignItems: 'center',
                                color: '#888',
                                display: 'flex',
                                height: '200px',
                                justifyContent: 'center',
                            }}
                        >
                            Search for artists using the search bar above to discover Spotify
                            content
                        </div>
                    )}
                </ListContext.Provider>
            </AnimatedPage>
        </ErrorBoundary>
    );
};

export default DiscoverArtistsRoute;
