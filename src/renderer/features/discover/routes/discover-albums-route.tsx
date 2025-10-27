import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef } from 'react';

import { ALBUM_CARD_ROWS } from '/@/renderer/components/card/card-rows';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSpotifySearch } from '/@/renderer/hooks/use-spotify-search';
import { useAlbumListFilter, useCurrentServer } from '/@/renderer/store';
import { Album } from '/@/shared/types/domain-types';
import { CardRow } from '/@/shared/types/types';

const DiscoverAlbumsRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();

    const detailKey = 'album_discover'; // Use separate key for detail store
    const pageKey = detailKey; // Use detailKey as pageKey now that store can handle it

    const albumListFilter = useAlbumListFilter({
        id: 'discover',
        key: detailKey,
    });

    // Get search term from the filter state (from the search bar)
    const searchTerm = albumListFilter.searchTerm || '';

    // Use Spotify search hook with the search term from the search bar
    // Always enabled for discover page
    const spotifySearchResult = useSpotifySearch({
        enabled: !!searchTerm.trim(), // Always enabled when there's a search term
        query: searchTerm,
        serverId: server?.id || '',
    });

    const handlePlayQueueAdd = usePlayQueueAdd();

    const handlePlay = useCallback(async () => {
        // In discover mode, playing is not possible
        window.alert('Play is not possible in Discover mode.');
    }, [handlePlayQueueAdd, spotifySearchResult.data]);

    // Calculate item count from Spotify results
    const itemCount = spotifySearchResult.data?.length || 0;

    // Define custom card rows for Discover Albums - always show artist name, album name, and release date
    const customCardRows: CardRow<Album>[] = useMemo(
        () => [
            ALBUM_CARD_ROWS.name, // Album name
            ALBUM_CARD_ROWS.albumArtists, // Artist name
            ALBUM_CARD_ROWS.releaseDate, // Release date
        ],
        [],
    );

    const providerValue = useMemo(() => {
        // Always use Spotify search results for discover page (similar to album-list-route with spotifyEnabled=true)
        const spotifyAlbums: Album[] = spotifySearchResult.data || [];

        return {
            customCardRows, // Pass custom card rows for enhanced display
            customFilters: undefined, // No custom filters for discover
            handlePlay,
            id: 'spotify:discover:albums', // Use spotify: prefix to indicate Spotify-only behavior
            pageKey,
            spotifyAlbums,
            spotifyEnabled: true, // Always enabled for discover
            spotifySearchQuery: searchTerm,
        };
    }, [handlePlay, pageKey, spotifySearchResult.data, searchTerm, customCardRows]);

    return (
        <AnimatedPage key={`discover-albums`}>
            <ListContext.Provider value={providerValue}>
                <AlbumListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    // Don't show Spotify toggle for discover page - omit onToggleSpotify
                    spotifyEnabled={true}
                    tableRef={tableRef}
                    title="Discover Albums"
                />
                {searchTerm ? (
                    <AlbumListContent gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} />
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
                        Search for albums using the search bar above to discover Spotify content
                    </div>
                )}
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default DiscoverAlbumsRoute;
