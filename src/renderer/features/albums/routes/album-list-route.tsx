import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import isEmpty from 'lodash/isEmpty';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { useAlbumListCount } from '/@/renderer/features/albums/queries/album-list-count-query';
import { useGenreList } from '/@/renderer/features/genres';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSpotifySearch } from '/@/renderer/hooks/use-spotify-search';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import {
    AlbumListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const AlbumListRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const { albumArtistId, genreId } = useParams();
    const pageKey = albumArtistId ? `albumArtistAlbum` : 'album';
    const handlePlayQueueAdd = usePlayQueueAdd();

    // State for Spotify integration toggle
    const [spotifyEnabled, setSpotifyEnabled] = useState(false);

    const toggleSpotify = useCallback(() => {
        setSpotifyEnabled((prev) => !prev);
        // Invalidate cache to force refresh when toggle state changes
        queryClient.invalidateQueries(queryKeys.albums.list(server?.id || ''));
        // Reset grid cache as well
        if (gridRef.current) {
            gridRef.current.resetLoadMoreItemsCache();
        }
    }, [server?.id]);

    const customFilters = useMemo(() => {
        const value = {
            ...(albumArtistId && { artistIds: [albumArtistId] }),
            ...(genreId && {
                genres: [genreId],
            }),
        };

        if (isEmpty(value)) {
            return undefined;
        }

        return value;
    }, [albumArtistId, genreId]);

    const albumListFilter = useListFilterByKey<AlbumListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    // Get search term from the filter state (from the search bar)
    const searchTerm = albumListFilter.searchTerm || '';

    // Use Spotify search hook with the search term from the search bar
    const spotifySearchResult = useSpotifySearch({
        enabled: !!searchTerm.trim() && spotifyEnabled,
        query: searchTerm,
        serverId: server?.id || 'default',
    });

    const genreList = useGenreList({
        options: {
            cacheTime: 1000 * 60 * 60,
            enabled: !!genreId,
        },
        query: {
            sortBy: GenreListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const genreTitle = useMemo(() => {
        if (!genreList.data) return '';
        const genre = genreList.data.items.find((g) => g.id === genreId);

        if (!genre) return 'Unknown';

        return genre?.name;
    }, [genreId, genreList.data]);

    const itemCountCheck = useAlbumListCount({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: {
            ...albumListFilter,
        },
        serverId: server?.id,
    });

    const itemCount = itemCountCheck.data === null ? undefined : itemCountCheck.data;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            if (!itemCount || itemCount === 0) return;
            const { playType } = args;
            const query = {
                ...albumListFilter,
                ...customFilters,
                startIndex: 0,
            };
            const queryKey = queryKeys.albums.list(server?.id || '', query);

            const albumListRes = await queryClient.fetchQuery({
                queryFn: ({ signal }) => {
                    return api.controller.getAlbumList({
                        apiClientProps: { server, signal },
                        query,
                    });
                },
                queryKey,
            });

            const albumIds = albumListRes?.items?.map((a) => a.id) || [];

            handlePlayQueueAdd?.({
                byItemType: {
                    id: albumIds,
                    type: LibraryItem.ALBUM,
                },
                playType,
            });
        },
        [albumListFilter, customFilters, handlePlayQueueAdd, itemCount, server],
    );

    const providerValue = useMemo(() => {
        return {
            customFilters,
            handlePlay,
            id: albumArtistId ?? genreId,
            pageKey,
            spotifyAlbums: spotifyEnabled ? spotifySearchResult.data || [] : [],
            spotifyEnabled,
            spotifySearchQuery: searchTerm,
        };
    }, [
        albumArtistId,
        customFilters,
        genreId,
        handlePlay,
        pageKey,
        spotifyEnabled,
        spotifySearchResult.data,
        searchTerm,
    ]);

    const artist = searchParams.get('artistName');
    const title = artist ? artist : genreId ? genreTitle : undefined;

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <AlbumListHeader
                    genreId={genreId}
                    gridRef={gridRef}
                    itemCount={itemCount}
                    onToggleSpotify={toggleSpotify}
                    spotifyEnabled={spotifyEnabled}
                    tableRef={tableRef}
                    title={title}
                />
                <AlbumListContent gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumListRoute;
