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
    LibraryItem,
} from '/@/shared/types/domain-types';
import { CardRow, ListDisplayType } from '/@/shared/types/types';

export const DiscoverAlbumListGridView = ({ gridRef, itemCount, isLoading }: any) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { customFilters, id, pageKey, spotifyAlbums } = useListContext();
    const { display, filter, grid } = useListStoreByKey<AlbumListQuery>({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

    const handleFavorite = useHandleFavorite({ gridRef, server });

    // Get search term from filter for loading check
    const searchTerm = filter?.searchTerm || '';

    // Custom card rows for Discover Albums - always show artist name, album name, and release date
    const cardRows = useMemo(() => {
        const rows: CardRow<Album>[] = [
            ALBUM_CARD_ROWS.name,           // Album name
            ALBUM_CARD_ROWS.albumArtists,   // Artist name
            ALBUM_CARD_ROWS.releaseDate,    // Release date
        ];

        return rows;
    }, []);

    const fetchInitialData = useCallback(() => {
        // For Discover albums, we only show Spotify albums
        const totalItemCount = spotifyAlbums?.length || 0;

        // Initialize array with total count needed
        const itemData: Album[] = new Array(totalItemCount);

        // Add Spotify albums starting at position 0
        if (spotifyAlbums && spotifyAlbums.length > 0) {
            for (let i = 0; i < spotifyAlbums.length; i++) {
                itemData[i] = spotifyAlbums[i];
            }
        }

        return itemData;
    }, [spotifyAlbums]);

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            if (!server) {
                return { items: [], totalRecordCount: 0 };
            }

            // For Discover albums, we only return Spotify albums
            if (spotifyAlbums && spotifyAlbums.length > 0) {
                const spotifyEnd = Math.min(skip + take, spotifyAlbums.length);
                const spotifyItems = spotifyAlbums.slice(skip, spotifyEnd);
                return {
                    items: spotifyItems,
                    totalRecordCount: spotifyAlbums.length,
                };
            }

            // Fallback: return empty result
            return { items: [], totalRecordCount: 0 };
        },
        [server, spotifyAlbums],
    );

    // Reset grid cache when Spotify albums change
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.resetLoadMoreItemsCache();
        }
    }, [gridRef, spotifyAlbums]);

    const handleGridScroll = useCallback(
        (scrollProps: ListOnScrollProps) => {
            if (id) {
                setSearchParams(
                    (params) => {
                        params.set('scrollOffset', String(scrollProps.scrollOffset));
                        return params;
                    },
                    { replace: true },
                );
            } else {
                setGrid({
                    data: { scrollOffset: scrollProps.scrollOffset },
                    key: pageKey,
                });
            }
        },
        [id, pageKey, setGrid, setSearchParams],
    );

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
                        itemCount={spotifyAlbums?.length || 0}
                        itemGap={grid?.itemGap ?? 10}
                        itemSize={grid?.itemSize || 200}
                        itemType={LibraryItem.ALBUM}
                        key={`discover-album-list-${server?.id}-${display}-${spotifyAlbums?.length || 0}-${filter.searchTerm || 'no-search'}`}
                        loading={isLoading || !searchTerm.trim()}
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