import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import isEmpty from 'lodash/isEmpty';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListEmptyState } from '/@/renderer/features/albums/components/album-list-empty-state';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { useAlbumListCount } from '/@/renderer/features/albums/queries/album-list-count-query';
import { useGenreList } from '/@/renderer/features/genres';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSpotifyArtistAlbums } from '/@/renderer/hooks/use-spotify-artist-albums';
import { useSpotifySearch } from '/@/renderer/hooks/use-spotify-search';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { getSpotifyToggleState, setSpotifyToggleState } from '/@/renderer/utils';
import {
    Album,
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

    // State for Spotify integration toggle - initialize from stored preference
    const [spotifyEnabled, setSpotifyEnabled] = useState(() => getSpotifyToggleState());

    // Check if this is a Spotify artist discography
    const isSpotifyArtist = albumArtistId?.startsWith('spotify:');

    // Hook for Spotify artist albums (discography)
    const spotifyArtistAlbums = useSpotifyArtistAlbums({
        artistId: albumArtistId || '',
        enabled: isSpotifyArtist,
        options: {
            include_groups: 'album,single', // Get albums and singles
            limit: 50,
        },
        serverId: server?.id || '',
    });

    const toggleSpotify = useCallback(() => {
        setSpotifyEnabled((prev) => {
            const newValue = !prev;
            // Persist the new state
            setSpotifyToggleState(newValue);
            return newValue;
        });
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
            // Disable the query for Spotify artists since we get count from the albums result
            enabled: !isSpotifyArtist,
            staleTime: 1000 * 60,
        },
        query: {
            ...albumListFilter,
        },
        serverId: server?.id,
    });

    // For Spotify artists, use the length of the albums array as item count
    const itemCount = isSpotifyArtist
        ? spotifyArtistAlbums.data?.length
        : itemCountCheck.data === null
          ? undefined
          : itemCountCheck.data;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            if (!itemCount || itemCount === 0) return;
            const { playType } = args;

            let albumIds: string[] = [];

            if (isSpotifyArtist) {
                // For Spotify artists, use the albums from the Spotify API result
                albumIds = spotifyArtistAlbums.data?.map((a) => a.id) || [];
            } else {
                // For regular albums, fetch from the backend API
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

                albumIds = albumListRes?.items?.map((a) => a.id) || [];
            }

            handlePlayQueueAdd?.({
                byItemType: {
                    id: albumIds,
                    type: LibraryItem.ALBUM,
                },
                playType,
            });
        },
        [
            albumListFilter,
            customFilters,
            handlePlayQueueAdd,
            isSpotifyArtist,
            itemCount,
            server,
            spotifyArtistAlbums.data,
        ],
    );

    const providerValue = useMemo(() => {
        // For Spotify artists, use their discography albums
        // For search, use search results when Spotify is enabled
        // Otherwise, empty array
        let spotifyAlbums: Album[] = [];
        if (isSpotifyArtist) {
            spotifyAlbums = spotifyArtistAlbums.data || [];
        } else if (spotifyEnabled) {
            spotifyAlbums = spotifySearchResult.data || [];
        }

        return {
            customFilters,
            handlePlay,
            id: albumArtistId ?? genreId,
            pageKey,
            spotifyAlbums,
            spotifyEnabled: spotifyEnabled || isSpotifyArtist, // Enable Spotify display for Spotify artists
            spotifySearchQuery: searchTerm,
        };
    }, [
        albumArtistId,
        customFilters,
        genreId,
        handlePlay,
        isSpotifyArtist,
        pageKey,
        spotifyArtistAlbums.data,
        spotifyEnabled,
        spotifySearchResult.data,
        searchTerm,
    ]);

    const artist = searchParams.get('artistName');
    const title = artist ? artist : genreId ? genreTitle : undefined;

    // Check if we should show empty state (no results found and there's a search term)
    const shouldShowEmptyState = (itemCount === 0) && searchTerm.trim() && !isSpotifyArtist;

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <AlbumListHeader
                    genreId={genreId}
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={title}
                />
                {shouldShowEmptyState ? (
                    <AlbumListEmptyState searchTerm={searchTerm} />
                ) : (
                    <AlbumListContent gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} />
                )}
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumListRoute;
