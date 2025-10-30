import { useQuery } from '@tanstack/react-query';

import { spotifyClient } from '/@/renderer/api/spotify/spotify-client';
import { getSpotifyTokenUrl } from '/@/renderer/utils/noiseport-server';
import { Album, AlbumArtist, Song } from '/@/shared/types/domain-types';

interface UseSpotifySearchArgs {
    enabled?: boolean;
    query: string;
    serverId: string;
}

export const useSpotifySearch = ({ enabled = true, query, serverId }: UseSpotifySearchArgs) => {
    return useQuery({
        cacheTime: 1000 * 60 * 10, // 10 minutes
        enabled: enabled && !!query.trim(),
        queryFn: async (): Promise<Album[]> => {
            console.log('useSpotifySearch queryFn called with query:', query);
            if (!query.trim()) {
                return [];
            }

            try {
                // Fetch the token from the backend
                const tokenRes = await fetch(getSpotifyTokenUrl());
                const { access_token } = await tokenRes.json();
                await spotifyClient.setAccessToken(access_token);
                console.log('Spotify access token set');

                const spotifyAlbums = await spotifyClient.searchAlbums(query);
                console.log('Spotify search results:', spotifyAlbums);
                return spotifyAlbums.map((album) =>
                    spotifyClient.mapSpotifyAlbumToAlbum(album, serverId),
                );
            } catch (error) {
                console.error('Spotify search error:', error);
                return [];
            }
        },
        queryKey: ['spotify', 'search', 'albums', query],
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useSpotifyArtistSearch = ({
    enabled = true,
    query,
    serverId,
}: UseSpotifySearchArgs) => {
    return useQuery({
        cacheTime: 1000 * 60 * 10, // 10 minutes
        enabled: enabled && !!query.trim(),
        queryFn: async (): Promise<AlbumArtist[]> => {
            console.log('useSpotifyArtistSearch queryFn called with query:', query);
            if (!query.trim()) {
                return [];
            }

            try {
                // Fetch the token from the backend
                const tokenRes = await fetch(getSpotifyTokenUrl());
                const { access_token } = await tokenRes.json();
                await spotifyClient.setAccessToken(access_token);
                console.log('Spotify access token set');

                const spotifyArtists = await spotifyClient.searchArtists(query);
                console.log('Spotify artist search results:', spotifyArtists);
                return spotifyArtists.map((artist) =>
                    spotifyClient.mapSpotifyArtistToAlbumArtist(artist, serverId),
                );
            } catch (error) {
                console.error('Spotify artist search error:', error);
                return [];
            }
        },
        queryKey: ['spotify', 'search', 'artists', query],
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useSpotifyTrackSearch = ({
    enabled = true,
    query,
    serverId,
}: UseSpotifySearchArgs) => {
    return useQuery({
        cacheTime: 1000 * 60 * 10, // 10 minutes
        enabled: enabled && !!query.trim(),
        queryFn: async (): Promise<Song[]> => {
            console.log('useSpotifyTrackSearch queryFn called with query:', query);
            if (!query.trim()) {
                return [];
            }

            try {
                // Fetch the token from the backend
                const tokenRes = await fetch(getSpotifyTokenUrl());
                const { access_token } = await tokenRes.json();
                await spotifyClient.setAccessToken(access_token);
                console.log('Spotify access token set');

                const spotifyTracks = await spotifyClient.searchTracks(query);
                console.log('Spotify track search results:', spotifyTracks);

                // We need to map tracks to songs, but we need album info. For now, create a dummy album
                return spotifyTracks.map((track) => {
                    // Create a minimal album object for mapping
                    const dummyAlbum = {
                        album_type: 'single',
                        artists: track.artists,
                        external_urls: { spotify: '' },
                        href: '',
                        id: 'unknown',
                        images: [],
                        name: 'Unknown Album',
                        release_date: '',
                        release_date_precision: 'day',
                        total_tracks: 1,
                        type: 'album' as const,
                        uri: '',
                    };
                    return spotifyClient.mapSpotifyTrackToSong(track, dummyAlbum, serverId);
                });
            } catch (error) {
                console.error('Spotify track search error:', error);
                return [];
            }
        },
        queryKey: ['spotify', 'search', 'tracks', query],
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// Hook to set Spotify access token (would be called from a settings or auth component)
export const useSetSpotifyToken = () => {
    return {
        setToken: (token: string) => spotifyClient.setAccessToken(token),
    };
};
