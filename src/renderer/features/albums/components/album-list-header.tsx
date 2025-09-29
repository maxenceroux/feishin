import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import debounce from 'lodash/debounce';
import { type ChangeEvent, type MutableRefObject, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { useDisplayRefresh } from '/@/renderer/hooks/use-display-refresh';
import { AlbumListFilter, useCurrentServer, usePlayButtonBehavior } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { AlbumListQuery, LibraryItem } from '/@/shared/types/domain-types';
import { useSpotifySearch } from '/@/renderer/hooks/useSpotifySearch';

interface AlbumListHeaderProps {
    genreId?: string;
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
    title?: string;
}

export const AlbumListHeader = ({
    genreId,
    gridRef,
    itemCount,
    tableRef,
    title,
}: AlbumListHeaderProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const cq = useContainerQuery();
    const playButtonBehavior = usePlayButtonBehavior();
    const genreRef = useRef<string | undefined>(undefined);
    const { filter, handlePlay, refresh, search } = useDisplayRefresh<AlbumListQuery>({
        gridRef,
        itemCount,
        itemType: LibraryItem.ALBUM,
        server,
        tableRef,
    });
    const {
        results: spotifyResults,

        searchSpotify,
    } = useSpotifySearch();

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = search(e) as AlbumListFilter;
        refresh(updatedFilters);
    }, 500);

    // Independent handler for the second search bar
    const handleSecondSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        console.log('Searching Spotify for:', e.target.value);
        searchSpotify(e.target.value);
    }, 500);

    useEffect(() => {
        if (genreRef.current && genreRef.current !== genreId) {
            refresh(filter);
        }

        genreRef.current = genreId;
    }, [filter, genreId, refresh, tableRef]);

    // Log artist names from Spotify results
    useEffect(() => {
        if (spotifyResults && spotifyResults.length > 0) {
            const artistNames = spotifyResults.flatMap((album: any) =>
                album.artists?.map((a: any) => a.name),
            );
            // eslint-disable-next-line no-console
            console.log('Spotify artist names:', Array.from(new Set(artistNames)));
        }
    }, [spotifyResults]);

    return (
        <Stack gap={0} ref={cq.ref}>
            <PageHeader backgroundColor="var(--theme-colors-background)">
                <Flex justify="space-between" w="100%">
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.PlayButton
                            onClick={() => handlePlay?.({ playType: playButtonBehavior })}
                        />
                        <LibraryHeaderBar.Title>
                            {title ||
                                titleCase(t('page.albumList.title', { postProcess: 'titleCase' }))}
                        </LibraryHeaderBar.Title>
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                    </LibraryHeaderBar>
                    <Group>
                        <SearchInput defaultValue={filter.searchTerm} onChange={handleSearch} />
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                            }}
                        >
                            <SearchInput
                                placeholder="Spotify search..."
                                onChange={handleSecondSearch}
                            />
                        </div>
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <AlbumListHeaderFilters
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
