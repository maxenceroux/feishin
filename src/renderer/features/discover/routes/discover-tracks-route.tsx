import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSpotifyTrackSearch } from '/@/renderer/hooks/use-spotify-search';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { LibraryItem, Song, SongListQuery } from '/@/shared/types/domain-types';

const DiscoverTracksRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();

    const pageKey = LibraryItem.SONG;

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

    // Update item count when Spotify results change
    useEffect(() => {
        setItemCount(spotifySearchResult.data?.length || 0);
    }, [spotifySearchResult.data]);

    const handlePlayQueueAdd = usePlayQueueAdd();

    const handlePlay = useCallback(async () => {
        // In discover mode, playing is not possible
        window.alert('Play is not possible in Discover mode.');
    }, [handlePlayQueueAdd, spotifySearchResult.data]);

    const providerValue = useMemo(() => {
        // Use Spotify search results
        const spotifyTracks: Song[] = spotifySearchResult.data || [];

        return {
            customFilters: undefined,
            handlePlay,
            id: 'discoverTracks',
            pageKey,
            spotifyTracks,
        };
    }, [handlePlay, pageKey, spotifySearchResult.data]);

    return (
        <AnimatedPage key={`discover-tracks`}>
            <ListContext.Provider value={providerValue}>
                <SongListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title="Discover Tracks"
                />
                {searchTerm ? (
                    <SongListContent gridRef={gridRef} tableRef={tableRef} />
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '200px',
                            color: '#888',
                        }}
                    >
                        Search for tracks using the search bar above to discover Spotify content
                    </div>
                )}
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default DiscoverTracksRoute;
