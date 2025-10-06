import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { lazy, MutableRefObject, Suspense } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ListDisplayType } from '/@/shared/types/types';

const DiscoverAlbumListGridView = lazy(() =>
    import('/@/renderer/features/discover/components/discover-album-list-grid-view').then((module) => ({
        default: module.DiscoverAlbumListGridView,
    })),
);

const AlbumListTableView = lazy(() =>
    import('/@/renderer/features/albums/components/album-list-table-view').then((module) => ({
        default: module.AlbumListTableView,
    })),
);

interface DiscoverAlbumListContentProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    isLoading?: boolean;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const DiscoverAlbumListContent = ({ gridRef, itemCount, isLoading, tableRef }: DiscoverAlbumListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    return (
        <Suspense fallback={<Spinner container />}>
            {display === ListDisplayType.CARD || display === ListDisplayType.GRID ? (
                <DiscoverAlbumListGridView gridRef={gridRef} itemCount={itemCount} isLoading={isLoading} />
            ) : (
                <AlbumListTableView itemCount={itemCount} tableRef={tableRef} />
            )}
        </Suspense>
    );
};