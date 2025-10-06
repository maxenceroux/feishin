import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSpotifyTrackSearch } from '/@/renderer/hooks/use-spotify-search';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import {
    LibraryItem,
    Song,
    SongListQuery,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const DiscoverTracksRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const pageKey = 'discoverTracks';

    const songListFilter = useListFilterByKey<SongListQuery>({
        key: pageKey,
    });

    // Get search term from the filter state (from the search bar)
    const searchTerm = songListFilter.searchTerm || '';

    // Use Spotify search hook with the search term from the search bar
    const spotifySearchResult = useSpotifyTrackSearch({
        enabled: !!searchTerm.trim(),
        query: searchTerm,
        serverId: server?.id || '',
    });

    const [itemCount, setItemCount] = useState(0);

    const handlePlayQueueAdd = usePlayQueueAdd();

    const handlePlay = useCallback(
        async (playType?: Play) => {
            const spotifyTracks = spotifySearchResult.data || [];
            const trackIds = spotifyTracks.map((t) => t.id);

            handlePlayQueueAdd?.({
                byItemType: {
                    id: trackIds,
                    type: LibraryItem.SONG,
                },
                playType,
            });
        },
        [handlePlayQueueAdd, spotifySearchResult.data],
    );

    const providerValue = useMemo(() => {
        // Use Spotify search results
        const spotifyTracks: Song[] = spotifySearchResult.data || [];

        return {
            customFilters: undefined,
            customFiltersByKey: undefined,
            display: songListFilter.display,
            filter: songListFilter,
            handlePlay,
            id: 'discoverTracks',
            itemCount,
            pageKey,
            searchQuery: songListFilter.searchTerm,
            setFilter: () => {}, // Disabled for discover
            spotifyTracks,
        };
    }, [
        songListFilter,
        handlePlay,
        itemCount,
        spotifySearchResult.data,
    ]);

    return (
        <AnimatedPage key={`discover-tracks`}>
            <ListContext.Provider value={providerValue}>
                <SongListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title="Discover Tracks"
                    titlePrefix="Spotify"
                />
                <SongListContent
                    gridRef={gridRef}
                    setItemCount={setItemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default DiscoverTracksRoute;