import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';

import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { ALBUM_CARD_ROWS } from '/@/renderer/components/card/card-rows';
import {
    VirtualGridAutoSizerContainer,
    VirtualInfiniteGrid,
} from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useHandleFavorite } from '/@/renderer/features/shared/hooks/use-handle-favorite';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import {
    Album,
    AlbumListQuery,
    AlbumListResponse,
    AlbumListSort,
    LibraryItem,
} from '/@/shared/types/domain-types';
import { CardRow, ListDisplayType } from '/@/shared/types/types';

export const AlbumListGridView = ({ gridRef, itemCount }: any) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { customCardRows, customFilters, id, pageKey, spotifyAlbums } = useListContext();
    const { display, filter, grid } = useListStoreByKey<AlbumListQuery>({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

    const handleFavorite = useHandleFavorite({ gridRef, server });

    const cardRows = useMemo(() => {
        // If custom card rows are provided (e.g., for Discover), use them
        if (customCardRows) {
            return customCardRows;
        }

        // Otherwise, use the original dynamic logic based on sort
        const rows: CardRow<Album>[] = [ALBUM_CARD_ROWS.name];

        switch (filter.sortBy) {
            case AlbumListSort.ALBUM_ARTIST:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.releaseYear);
                break;
            case AlbumListSort.ARTIST:
                rows.push(ALBUM_CARD_ROWS.artists);
                rows.push(ALBUM_CARD_ROWS.releaseYear);
                break;
            case AlbumListSort.COMMUNITY_RATING:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                break;
            case AlbumListSort.DURATION:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.duration);
                break;
            case AlbumListSort.FAVORITED:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.releaseYear);
                break;
            case AlbumListSort.NAME:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.releaseYear);
                break;
            case AlbumListSort.PLAY_COUNT:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.playCount);
                break;
            case AlbumListSort.RANDOM:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.releaseYear);
                break;
            case AlbumListSort.RATING:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.rating);
                break;
            case AlbumListSort.RECENTLY_ADDED:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.createdAt);
                break;
            case AlbumListSort.RECENTLY_PLAYED:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.lastPlayedAt);
                break;
            case AlbumListSort.SONG_COUNT:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.songCount);
                break;
            case AlbumListSort.YEAR:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.releaseYear);
                break;
            case AlbumListSort.RELEASE_DATE:
                rows.push(ALBUM_CARD_ROWS.albumArtists);
                rows.push(ALBUM_CARD_ROWS.releaseDate);
        }

        return rows;
    }, [filter.sortBy, customCardRows]);

    const handleGridScroll = useCallback(
        (e: ListOnScrollProps) => {
            if (id) {
                setSearchParams(
                    (params) => {
                        params.set('scrollOffset', String(e.scrollOffset));
                        return params;
                    },
                    { replace: true },
                );
            } else {
                setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
            }
        },
        [id, pageKey, setGrid, setSearchParams],
    );

    const fetchInitialData = useCallback(() => {
        // Check if we're displaying a Spotify artist's discography
        const isSpotifyArtist = id?.startsWith('spotify:');

        const query: AlbumListQuery = {
            ...filter,
            ...customFilters,
        };

        const queryKey = queryKeys.albums.list(server?.id || '', query, id);

        const queriesFromCache: [QueryKey, AlbumListResponse][] = queryClient.getQueriesData({
            exact: false,
            fetchStatus: 'idle',
            queryKey,
            stale: false,
        });

        // For Spotify artists, we have no local albums, only Spotify albums
        const localItemCount = isSpotifyArtist ? 0 : itemCount || 0;
        const totalItemCount = localItemCount + (spotifyAlbums?.length || 0);

        // Initialize array with total count needed
        const itemData: Album[] = new Array(totalItemCount);

        // Fill local albums from cache (only for non-Spotify artists)
        if (!isSpotifyArtist) {
            for (const [, data] of queriesFromCache) {
                const { items, startIndex } = data || {};
                if (items && items.length > 0 && startIndex !== undefined) {
                    let itemIndex = 0;
                    for (
                        let rowIndex = startIndex;
                        rowIndex < startIndex + items.length;
                        rowIndex += 1
                    ) {
                        itemData[rowIndex] = items[itemIndex];
                        itemIndex += 1;
                    }
                }
            }
        }

        // Add Spotify albums at the correct position
        if (spotifyAlbums && spotifyAlbums.length > 0) {
            for (let i = 0; i < spotifyAlbums.length; i++) {
                itemData[localItemCount + i] = spotifyAlbums[i];
            }
        }

        console.log('fetchInitialData returning items:', itemData.length);
        console.log('fetchInitialData isSpotifyArtist:', isSpotifyArtist);
        console.log('fetchInitialData localItemCount:', localItemCount);
        console.log('fetchInitialData spotifyAlbums count:', spotifyAlbums?.length || 0);
        return itemData;
    }, [customFilters, filter, id, queryClient, server?.id, spotifyAlbums, itemCount]);

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            if (!server) {
                return { items: [], totalRecordCount: 0 };
            }

            // Check if we're displaying a Spotify artist's discography
            const isSpotifyArtist = id?.startsWith('spotify:');
            const localItemCount = isSpotifyArtist ? 0 : itemCount || 0;
            const totalItemCount = localItemCount + (spotifyAlbums?.length || 0);

            // If this is a Spotify artist, return Spotify albums directly
            if (isSpotifyArtist && spotifyAlbums && spotifyAlbums.length > 0) {
                const spotifyEnd = Math.min(skip + take, spotifyAlbums.length);
                const spotifyItems = spotifyAlbums.slice(skip, spotifyEnd);
                console.log(
                    'fetch returning Spotify items for Spotify artist:',
                    spotifyItems.length,
                );
                return {
                    items: spotifyItems,
                    totalRecordCount: spotifyAlbums.length,
                };
            }

            // If request is entirely within Spotify range (for non-Spotify artists with Spotify search)
            if (skip >= localItemCount && spotifyAlbums && spotifyAlbums.length > 0) {
                const spotifyStart = skip - localItemCount;
                const spotifyEnd = Math.min(spotifyStart + take, spotifyAlbums.length);
                const spotifyItems = spotifyAlbums.slice(spotifyStart, spotifyEnd);
                console.log('fetch returning Spotify search items:', spotifyItems.length);
                return {
                    items: spotifyItems,
                    totalRecordCount: totalItemCount,
                };
            }

            // If request is entirely within local range or overlaps
            if (skip < localItemCount) {
                const localTake = Math.min(take, localItemCount - skip);

                const query: AlbumListQuery = {
                    limit: localTake,
                    ...filter,
                    ...customFilters,
                    startIndex: skip,
                };

                const queryKey = queryKeys.albums.list(server?.id || '', query, id);

                const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
                    controller.getAlbumList({
                        apiClientProps: {
                            server,
                            signal,
                        },
                        query,
                    }),
                );

                // If request overlaps into Spotify range, append Spotify items
                const remainingTake = take - localTake;
                if (
                    remainingTake > 0 &&
                    spotifyAlbums &&
                    spotifyAlbums.length > 0 &&
                    albums?.items
                ) {
                    const spotifyItems = spotifyAlbums.slice(
                        0,
                        Math.min(remainingTake, spotifyAlbums.length),
                    );
                    return {
                        ...albums,
                        items: [...albums.items, ...spotifyItems],
                        totalRecordCount: totalItemCount,
                    };
                }
                console.log('fetch returning local albums:', albums);
                return {
                    ...albums,
                    totalRecordCount: totalItemCount,
                };
            }

            // Fallback: return empty result

            return { items: [], totalRecordCount: totalItemCount };
        },
        [customFilters, filter, id, queryClient, server, spotifyAlbums, itemCount],
    );

    // Reset grid cache when Spotify albums change to ensure proper merging
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.resetLoadMoreItemsCache();
            // Also directly update the grid's data to ensure it reflects the new state
            const newData = fetchInitialData();
            gridRef.current.setItemData(newData);
        }
    }, [spotifyAlbums, gridRef, fetchInitialData]);

    return (
        <VirtualGridAutoSizerContainer>
            <AutoSizer>
                {({ height, width }: Size) => (
                    <VirtualInfiniteGrid
                        cardRows={cardRows}
                        display={display || ListDisplayType.CARD}
                        fetchFn={fetch}
                        fetchInitialData={fetchInitialData}
                        handleFavorite={handleFavorite}
                        handlePlayQueueAdd={handlePlayQueueAdd}
                        height={height}
                        initialScrollOffset={initialScrollOffset}
                        itemCount={
                            id?.startsWith('spotify:')
                                ? spotifyAlbums?.length || 0 // For Spotify-only routes, use only Spotify count
                                : (itemCount || 0) + (spotifyAlbums?.length || 0) // For regular routes, add both
                        }
                        itemGap={grid?.itemGap ?? 10}
                        itemSize={grid?.itemSize || 200}
                        itemType={LibraryItem.ALBUM}
                        key={`album-list-${server?.id}-${display}-spotify-${!!spotifyAlbums && spotifyAlbums.length > 0 ? 'enabled' : 'disabled'}-${spotifyAlbums?.length || 0}-${filter.searchTerm || 'no-search'}`}
                        loading={itemCount === undefined || itemCount === null}
                        minimumBatchSize={40}
                        onScroll={handleGridScroll}
                        ref={gridRef}
                        route={{
                            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                            slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                        }}
                        width={width}
                    />
                )}
            </AutoSizer>
        </VirtualGridAutoSizerContainer>
    );
};
