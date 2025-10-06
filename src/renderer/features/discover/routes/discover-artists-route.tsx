import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
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
    const [searchParams] = useSearchParams();
    const pageKey = 'discoverArtists';

    const artistListFilter = useListFilterByKey<AlbumArtistListQuery>({
        key: pageKey,
    });

    // Get search term from the filter state (from the search bar)
    const searchTerm = artistListFilter.searchTerm || '';

    // Use Spotify search hook with the search term from the search bar
    const spotifySearchResult = useSpotifyArtistSearch({
        enabled: !!searchTerm.trim(),
        query: searchTerm,
        serverId: server?.id || '',
    });

    const [itemCount, setItemCount] = useState(0);

    const handlePlayQueueAdd = usePlayQueueAdd();

    const handlePlay = useCallback(
        async (playType?: Play) => {
            const spotifyArtists = spotifySearchResult.data || [];
            const artistIds = spotifyArtists.map((a) => a.id);

            handlePlayQueueAdd?.({
                byItemType: {
                    id: artistIds,
                    type: LibraryItem.ALBUM_ARTIST,
                },
                playType,
            });
        },
        [handlePlayQueueAdd, spotifySearchResult.data],
    );

    const providerValue = useMemo(() => {
        // Use Spotify search results
        const spotifyArtists: AlbumArtist[] = spotifySearchResult.data || [];

        return {
            customFilters: undefined,
            customFiltersByKey: undefined,
            display: artistListFilter.display,
            filter: artistListFilter,
            handlePlay,
            id: 'discoverArtists',
            itemCount,
            pageKey,
            searchQuery: artistListFilter.searchTerm,
            setFilter: () => {}, // Disabled for discover
            spotifyArtists,
        };
    }, [
        artistListFilter,
        handlePlay,
        itemCount,
        spotifySearchResult.data,
    ]);

    return (
        <AnimatedPage key={`discover-artists`}>
            <ListContext.Provider value={providerValue}>
                <AlbumArtistListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title="Discover Artists"
                    titlePrefix="Spotify"
                />
                <AlbumArtistListContent
                    gridRef={gridRef}
                    setItemCount={setItemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default DiscoverArtistsRoute;