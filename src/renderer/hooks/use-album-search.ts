import { useCallback, useMemo, useState } from 'react';

import { useSpotifySearch } from './useSpotifySearch';

import { mapSpotifyAlbumToInternalAlbum, SpotifyAlbum } from '/@/renderer/utils/spotify-mapper';
import { Album } from '/@/shared/types/domain-types';

interface UseAlbumSearchProps {
    localAlbumCount?: number;
}

export function useAlbumSearch({ localAlbumCount }: UseAlbumSearchProps) {
    const { loading: spotifyLoading, results: spotifyResults, searchSpotify } = useSpotifySearch();
    const [spotifyQuery, setSpotifyQuery] = useState<string>('');

    // Convert Spotify results to internal Album format
    const mappedSpotifyAlbums = useMemo(() => {
        if (!spotifyResults || spotifyResults.length === 0) return [];

        return spotifyResults.map((spotifyAlbum: SpotifyAlbum) =>
            mapSpotifyAlbumToInternalAlbum(spotifyAlbum),
        );
    }, [spotifyResults]);

    // Calculate total item count including Spotify results
    const totalItemCount = useMemo(() => {
        const localCount = localAlbumCount || 0;
        const spotifyCount = mappedSpotifyAlbums.length;
        return localCount + spotifyCount;
    }, [localAlbumCount, mappedSpotifyAlbums.length]);

    const handleSpotifySearch = useCallback(
        (query: string) => {
            setSpotifyQuery(query);
            if (query.trim()) {
                searchSpotify(query);
            }
        },
        [searchSpotify],
    );

    const clearSpotifySearch = useCallback(() => {
        setSpotifyQuery('');
    }, []);

    return {
        clearSpotifySearch,
        handleSpotifySearch,
        hasSpotifyResults: mappedSpotifyAlbums.length > 0,
        spotifyAlbums: mappedSpotifyAlbums as Album[],
        spotifyLoading,
        spotifyQuery,
        totalItemCount,
    };
}
