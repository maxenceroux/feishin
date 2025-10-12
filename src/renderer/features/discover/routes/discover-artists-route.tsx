import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { AlbumArtistListContent } from '/@/renderer/features/artists/components/album-artist-list-content';
import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSpotifyArtistSearch } from '/@/renderer/hooks/use-spotify-search';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import {
    AlbumArtist,
    AlbumArtistListQuery,
    LibraryItem,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

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
    }, [
        handlePlay,
        pageKey,
        spotifySearchResult.data,
    ]);

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
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
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            height: '200px',
                            color: '#888'
                        }}>
                            Search for artists using the search bar above to discover Spotify content
                        </div>
                    )}
                </ListContext.Provider>
            </AnimatedPage>
        </ErrorBoundary>
    );
};

export default DiscoverArtistsRoute;