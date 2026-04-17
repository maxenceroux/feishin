import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import {
    BodyScrollEvent,
    ColDef,
    GetRowIdParams,
    GridReadyEvent,
    IDatasource,
    PaginationChangedEvent,
    RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import orderBy from 'lodash/orderBy';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { api } from '/@/renderer/api';
import { queryKeys, QueryPagination } from '/@/renderer/api/query-keys';
import { getColumnDefs, VirtualTableProps } from '/@/renderer/components/virtual-table';
import { SetContextMenuItems, useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { AppRoute } from '/@/renderer/router/routes';
import { PersistedTableColumn, useHiddenItemsStore, useListStoreActions } from '/@/renderer/store';
import { ListKey, useListStoreByKey } from '/@/renderer/store/list.store';
import {
    BasePaginatedResponse,
    BaseQuery,
    LibraryItem,
    ServerListItem,
} from '/@/shared/types/domain-types';
import { ListDisplayType, TablePagination } from '/@/shared/types/types';

export type AgGridFetchFn<TResponse, TFilter> = (
    args: { filter: TFilter; limit: number; startIndex: number },
    signal?: AbortSignal,
) => Promise<TResponse>;

interface UseAgGridProps<TFilter> {
    columnType?: 'albumDetail' | 'generic';
    contextMenu: SetContextMenuItems;
    customFilters?: Partial<TFilter>;
    isClientSide?: boolean;
    isClientSideSort?: boolean;
    isSearchParams?: boolean;
    itemCount?: number;
    itemType: LibraryItem;
    pageKey: string;
    server: null | ServerListItem;
    showHiddenOnly?: boolean;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

const BLOCK_SIZE = 500;

export const useVirtualTable = <TFilter extends BaseQuery<any>>({
    columnType,
    contextMenu,
    customFilters,
    isClientSide,
    isClientSideSort,
    isSearchParams,
    itemCount,
    itemType,
    pageKey,
    server,
    showHiddenOnly,
    tableRef,
}: UseAgGridProps<TFilter>) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { setTable, setTablePagination } = useListStoreActions();
    const properties = useListStoreByKey<TFilter>({ filter: customFilters, key: pageKey });
    const [searchParams, setSearchParams] = useSearchParams();

    const scrollOffset = searchParams.get('scrollOffset');
    const pagination = useMemo(() => {
        return {
            currentPage: Number(searchParams.get('currentPage')),
            itemsPerPage: Number(searchParams.get('itemsPerPage')),
            totalItems: Number(searchParams.get('totalItems')),
            totalPages: Number(searchParams.get('totalPages')),
        };
    }, [searchParams]);

    const initialTableIndex =
        Number(isSearchParams ? scrollOffset : properties.table.scrollOffset) || 0;

    const isPaginationEnabled = properties.display === ListDisplayType.TABLE_PAGINATED;

    const columnDefs: ColDef[] = useMemo(() => {
        return getColumnDefs(properties.table.columns, true, columnType);
    }, [columnType, properties.table.columns]);

    const defaultColumnDefs: ColDef = useMemo(() => {
        return {
            lockPinned: true,
            lockVisible: true,
            resizable: true,
        };
    }, []);

    const onGridSizeChange = () => {
        if (properties.table.autoFit) {
            tableRef?.current?.api.sizeColumnsToFit();
        }
    };

    const queryKeyFn:
        | ((serverId: string, query: Record<any, any>, pagination: QueryPagination) => QueryKey)
        | null = useMemo(() => {
        switch (itemType) {
            case LibraryItem.ALBUM:
                return queryKeys.albums.list;
            case LibraryItem.ALBUM_ARTIST:
                return queryKeys.albumArtists.list;
            case LibraryItem.ARTIST:
                return queryKeys.artists.list;
            case LibraryItem.GENRE:
                return queryKeys.genres.list;
            case LibraryItem.PLAYLIST:
                return queryKeys.playlists.list;
            case LibraryItem.SONG:
                return queryKeys.songs.list;
            default:
                return null;
        }
    }, [itemType]);

    const queryFn: ((args: any) => Promise<BasePaginatedResponse<any> | null | undefined>) | null =
        useMemo(() => {
            switch (itemType) {
                case LibraryItem.ALBUM:
                    return api.controller.getAlbumList;
                case LibraryItem.ALBUM_ARTIST:
                    return api.controller.getAlbumArtistList;
                case LibraryItem.ARTIST:
                    return api.controller.getArtistList;
                case LibraryItem.GENRE:
                    return api.controller.getGenreList;
                case LibraryItem.PLAYLIST:
                    return api.controller.getPlaylistList;
                case LibraryItem.SONG:
                    return api.controller.getSongList;
                default:
                    return null;
            }
        }, [itemType]);

    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            const dataSource: IDatasource = {
                getRows: async (params) => {
                    const limit = params.endRow - params.startRow;
                    const startIndex = params.startRow;

                    const queryKey = queryKeyFn!(
                        server?.id || '',
                        {
                            ...(properties.filter as any),
                        },
                        {
                            limit,
                            startIndex,
                        },
                    );

                    const results = (await queryClient.fetchQuery(queryKey, async ({ signal }) => {
                        const res = await queryFn!({
                            apiClientProps: {
                                server,
                                signal,
                            },
                            query: {
                                ...properties.filter,
                                limit,
                                startIndex,
                            },
                        });

                        return res;
                    })) as BasePaginatedResponse<any>;

                    const hiddenIds = useHiddenItemsStore
                        .getState()
                        .actions.getHiddenIds(server?.id || '', itemType);
                    const filterHidden = (items: any[]) => {
                        if (hiddenIds.size === 0) {
                            return showHiddenOnly ? [] : items;
                        }
                        return showHiddenOnly
                            ? items.filter((item: any) => hiddenIds.has(item.id))
                            : items.filter((item: any) => !hiddenIds.has(item.id));
                    };
                    const adjustCount = (count: null | number | undefined) =>
                        count != null ? Math.max(0, count - hiddenIds.size) : count;

                    if (isClientSideSort && results?.items) {
                        const sortedResults = orderBy(
                            filterHidden(results.items),
                            [(item) => String(item[properties.filter.sortBy]).toLowerCase()],
                            properties.filter.sortOrder === 'DESC' ? ['desc'] : ['asc'],
                        );

                        params.successCallback(
                            sortedResults || [],
                            adjustCount(results?.totalRecordCount) || 0,
                        );
                        return;
                    }

                    if (results.totalRecordCount === null) {
                        const filteredItems = filterHidden(results?.items || []);
                        const hasMoreRows = results?.items?.length === BLOCK_SIZE;
                        const lastRowIndex = hasMoreRows
                            ? undefined
                            : params.startRow + filteredItems.length;

                        params.successCallback(
                            filteredItems,
                            hasMoreRows ? undefined : lastRowIndex,
                        );
                        return;
                    }

                    params.successCallback(
                        filterHidden(results?.items || []),
                        adjustCount(results?.totalRecordCount) || 0,
                    );
                },
                rowCount: undefined,
            };

            params.api.setDatasource(dataSource);
            params.api.ensureIndexVisible(initialTableIndex, 'top');
        },
        [
            initialTableIndex,
            queryKeyFn,
            server,
            showHiddenOnly,
            properties.filter,
            queryClient,
            isClientSideSort,
            queryFn,
        ],
    );

    const setParamsTablePagination = useCallback(
        (args: { data: Partial<TablePagination>; key: ListKey }) => {
            const { data } = args;

            setSearchParams(
                (params) => {
                    if (data.currentPage) params.set('currentPage', String(data.currentPage));
                    if (data.itemsPerPage) params.set('itemsPerPage', String(data.itemsPerPage));
                    if (data.totalItems) params.set('totalItems', String(data.totalItems));
                    if (data.totalPages) params.set('totalPages', String(data.totalPages));
                    return params;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    const onPaginationChanged = useCallback(
        (event: PaginationChangedEvent) => {
            if (!isPaginationEnabled || !event.api) return;

            try {
                // Scroll to top of page on pagination change
                const currentPageStartIndex =
                    properties.table.pagination.currentPage *
                    properties.table.pagination.itemsPerPage;
                event.api?.ensureIndexVisible(currentPageStartIndex, 'top');
            } catch (err) {
                console.error(err);
            }

            if (isSearchParams) {
                setSearchParams(
                    (params) => {
                        params.set('currentPage', String(event.api.paginationGetCurrentPage()));
                        params.set('itemsPerPage', String(event.api.paginationGetPageSize()));
                        params.set('totalItems', String(event.api.paginationGetRowCount()));
                        params.set('totalPages', String(event.api.paginationGetTotalPages() + 1));
                        return params;
                    },
                    { replace: true },
                );
            } else {
                setTablePagination({
                    data: {
                        itemsPerPage: event.api.paginationGetPageSize(),
                        totalItems: event.api.paginationGetRowCount(),
                        totalPages: event.api.paginationGetTotalPages() + 1,
                    },
                    key: pageKey,
                });
            }
        },
        [
            isPaginationEnabled,
            isSearchParams,
            properties.table.pagination.currentPage,
            properties.table.pagination.itemsPerPage,
            setSearchParams,
            setTablePagination,
            pageKey,
        ],
    );

    const onColumnMoved = useCallback(() => {
        const { columnApi } = tableRef?.current || {};
        const columnsOrder = columnApi?.getAllGridColumns();

        if (!columnsOrder) return;

        const columnsInSettings = properties.table.columns;
        const updatedColumns: PersistedTableColumn[] = [];
        for (const column of columnsOrder) {
            const columnInSettings = columnsInSettings.find(
                (c) => c.column === column.getColDef().colId,
            );

            if (columnInSettings) {
                updatedColumns.push({
                    ...columnInSettings,
                    ...(!properties.table.autoFit && {
                        width: column.getActualWidth(),
                    }),
                });
            }
        }

        setTable({ data: { columns: updatedColumns }, key: pageKey });
    }, [pageKey, properties.table.autoFit, properties.table.columns, setTable, tableRef]);

    const onColumnResized = debounce(onColumnMoved, 200);

    const onBodyScrollEnd = (e: BodyScrollEvent) => {
        const scrollOffset = Number((e.top / properties.table.rowHeight).toFixed(0));

        if (isSearchParams) {
            setSearchParams(
                (params) => {
                    params.set('scrollOffset', String(scrollOffset));
                    return params;
                },
                { replace: true },
            );
        } else {
            setTable({ data: { scrollOffset }, key: pageKey });
        }
    };

    const onCellContextMenu = useHandleTableContextMenu(itemType, contextMenu);

    const context = {
        itemType,
        onCellContextMenu,
    };

    const defaultTableProps: Partial<VirtualTableProps> = useMemo(() => {
        return {
            alwaysShowHorizontalScroll: true,
            autoFitColumns: properties.table.autoFit,
            blockLoadDebounceMillis: 200,
            cacheBlockSize: BLOCK_SIZE,
            getRowId: (data: GetRowIdParams<any>) => data.data.id,
            infiniteInitialRowCount: itemCount || 100,
            pagination: isPaginationEnabled,
            paginationAutoPageSize: isPaginationEnabled,
            paginationPageSize: properties.table.pagination.itemsPerPage || 100,
            paginationProps: isPaginationEnabled
                ? {
                      pageKey,
                      pagination: isSearchParams ? pagination : properties.table.pagination,
                      setPagination: isSearchParams ? setParamsTablePagination : setTablePagination,
                  }
                : undefined,
            rowBuffer: 20,
            rowHeight: properties.table.rowHeight || 40,
            rowModelType: isClientSide ? 'clientSide' : 'infinite',
            suppressRowDrag: true,
        };
    }, [
        isClientSide,
        isPaginationEnabled,
        isSearchParams,
        itemCount,
        pageKey,
        pagination,
        properties.table.autoFit,
        properties.table.pagination,
        properties.table.rowHeight,
        setParamsTablePagination,
        setTablePagination,
    ]);

    const onRowDoubleClicked = useCallback(
        (e: RowDoubleClickedEvent) => {
            switch (itemType) {
                case LibraryItem.ALBUM:
                    navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
                    break;
                case LibraryItem.ALBUM_ARTIST:
                    navigate(
                        generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                            albumArtistId: e.data.id,
                        }),
                    );
                    break;
                case LibraryItem.ARTIST:
                    navigate(
                        generatePath(AppRoute.LIBRARY_ARTISTS_DETAIL, {
                            artistId: e.data.id,
                        }),
                    );
                    break;
                case LibraryItem.PLAYLIST:
                    navigate(
                        generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: e.data.id }),
                    );
                    break;
                default:
                    break;
            }
        },
        [itemType, navigate],
    );

    return {
        columnDefs,
        context,
        defaultColumnDefs,
        onBodyScrollEnd,
        onCellContextMenu,
        onColumnMoved,
        onColumnResized,
        onGridReady,
        onGridSizeChange,
        onPaginationChanged,
        onRowDoubleClicked,
        ...defaultTableProps,
    };
};
