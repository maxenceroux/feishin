import { useCallback, useMemo, useState, useEffect } from 'react';
import { Album } from '/@/shared/types/domain-types';
import { useSpotifySearch } from './useSpotifySearch';
import { mapSpotifyAlbumToInternalAlbum, SpotifyAlbum } from '/@/renderer/utils/spotify-mapper';

interface UseAlbumSearchProps {
    localAlbumCount?: number;
}

export function useAlbumSearch({ localAlbumCount }: UseAlbumSearchProps) {
    const { results: spotifyResults, searchSpotify, loading: spotifyLoading } = useSpotifySearch();
    const [spotifyQuery, setSpotifyQuery] = useState<string>('');

    // Convert Spotify results to internal Album format
    const mappedSpotifyAlbums = useMemo(() => {
        if (!spotifyResults || spotifyResults.length === 0) return [];
        
        return spotifyResults.map((spotifyAlbum: SpotifyAlbum) => 
            mapSpotifyAlbumToInternalAlbum(spotifyAlbum)
        );
    }, [spotifyResults]);

    // Calculate total item count including Spotify results
    const totalItemCount = useMemo(() => {
        const localCount = localAlbumCount || 0;
        const spotifyCount = mappedSpotifyAlbums.length;
        return localCount + spotifyCount;
    }, [localAlbumCount, mappedSpotifyAlbums.length]);

    const handleSpotifySearch = useCallback((query: string) => {
        setSpotifyQuery(query);
        if (query.trim()) {
            searchSpotify(query);
        }
    }, [searchSpotify]);

    const clearSpotifySearch = useCallback(() => {
        setSpotifyQuery('');
    }, []);

    return {
        spotifyAlbums: mappedSpotifyAlbums,
        totalItemCount,
        spotifyQuery,
        spotifyLoading,
        handleSpotifySearch,
        clearSpotifySearch,
        hasSpotifyResults: mappedSpotifyAlbums.length > 0,
    };
}