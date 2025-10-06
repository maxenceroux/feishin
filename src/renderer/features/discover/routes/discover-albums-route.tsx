import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSpotifySearch } from '/@/renderer/hooks/use-spotify-search';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import {
    Album,
    AlbumListQuery,
    LibraryItem,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const DiscoverAlbumsRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const pageKey = LibraryItem.ALBUM;

    const albumListFilter = useListFilterByKey<AlbumListQuery>({
        key: pageKey,
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

    const handlePlay = useCallback(
        async (playType?: Play) => {
            const spotifyAlbums = spotifySearchResult.data || [];
            const albumIds = spotifyAlbums.map((a) => a.id);

            handlePlayQueueAdd?.({
                byItemType: {
                    id: albumIds,
                    type: LibraryItem.ALBUM,
                },
                playType,
            });
        },
        [handlePlayQueueAdd, spotifySearchResult.data],
    );

    // Calculate item count from Spotify results
    const itemCount = spotifySearchResult.data?.length || 0;

    const providerValue = useMemo(() => {
        // Always use Spotify search results for discover page (similar to album-list-route with spotifyEnabled=true)
        const spotifyAlbums: Album[] = spotifySearchResult.data || [];

        return {
            customFilters: undefined, // No custom filters for discover
            handlePlay,
            id: 'spotify:discover:albums', // Use spotify: prefix to indicate Spotify-only behavior
            pageKey,
            spotifyAlbums,
            spotifyEnabled: true, // Always enabled for discover
            spotifySearchQuery: searchTerm,
        };
    }, [
        handlePlay,
        pageKey,
        spotifySearchResult.data,
        searchTerm,
    ]);

    return (
        <AnimatedPage key={`discover-albums`}>
            <ListContext.Provider value={providerValue}>
                <AlbumListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title="Discover Albums"
                    // Don't show Spotify toggle for discover page - omit onToggleSpotify
                    spotifyEnabled={true}
                />
                {searchTerm ? (
                    <AlbumListContent
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
                        Search for albums using the search bar above to discover Spotify content
                    </div>
                )}
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default DiscoverAlbumsRoute;