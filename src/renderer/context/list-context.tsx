import { createContext, useContext } from 'react';

import { ListKey } from '/@/renderer/store';
import { Album, AlbumArtist, Song } from '/@/shared/types/domain-types';
import { CardRow, Play } from '/@/shared/types/types';

interface ListContextProps {
    customCardRows?: CardRow<Album>[]; // Add support for custom card rows
    customFilters?: Record<string, unknown>;
    handlePlay?: (args: { initialSongId?: string; playType: Play }) => void;
    id?: string;
    pageKey: ListKey;
    setShowHiddenOnly?: (value: boolean) => void;
    showHiddenOnly?: boolean;
    spotifyAlbums?: Album[];
    spotifyArtists?: AlbumArtist[];
    spotifyEnabled?: boolean;
    spotifySearchQuery?: string;
    spotifyTracks?: Song[];
}

export const ListContext = createContext<ListContextProps>({
    pageKey: '',
});

export const useListContext = () => {
    const ctxValue = useContext(ListContext);
    return ctxValue;
};
