import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef, useState } from 'react';
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
    const pageKey = 'discoverAlbums';

    const albumListFilter = useListFilterByKey<AlbumListQuery>({
        key: pageKey,
    });

    // Get search term from the filter state (from the search bar)
    const searchTerm = albumListFilter.searchTerm || '';

    // Use Spotify search hook with the search term from the search bar
    const spotifySearchResult = useSpotifySearch({
        enabled: !!searchTerm.trim(),
        query: searchTerm,
        serverId: server?.id || '',
    });

    const [itemCount, setItemCount] = useState(0);

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

    const providerValue = useMemo(() => {
        // Use Spotify search results
        const spotifyAlbums: Album[] = spotifySearchResult.data || [];

        return {
            customFilters: undefined,
            customFiltersByKey: undefined,
            display: albumListFilter.display,
            filter: albumListFilter,
            handlePlay,
            id: 'discoverAlbums',
            itemCount,
            pageKey,
            searchQuery: albumListFilter.searchTerm,
            setFilter: () => {}, // Disabled for discover
            spotifyAlbums,
        };
    }, [
        albumListFilter,
        handlePlay,
        itemCount,
        spotifySearchResult.data,
    ]);

    return (
        <AnimatedPage key={`discover-albums`}>
            <ListContext.Provider value={providerValue}>
                <AlbumListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title="Discover Albums"
                    titlePrefix="Spotify"
                />
                <AlbumListContent
                    gridRef={gridRef}
                    setItemCount={setItemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default DiscoverAlbumsRoute;