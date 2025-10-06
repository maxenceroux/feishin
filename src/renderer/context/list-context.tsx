import { createContext, useContext } from 'react';

import { ListKey } from '/@/renderer/store';
import { Album, AlbumArtist, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface ListContextProps {
    customFilters?: Record<string, unknown>;
    handlePlay?: (args: { initialSongId?: string; playType: Play }) => void;
    id?: string;
    pageKey: ListKey;
    spotifyAlbums?: Album[];
    spotifyArtists?: AlbumArtist[];
    spotifyTracks?: Song[];
    spotifyEnabled?: boolean;
    spotifySearchQuery?: string;
}

export const ListContext = createContext<ListContextProps>({
    pageKey: '',
});

export const useListContext = () => {
    const ctxValue = useContext(ListContext);
    return ctxValue;
};
