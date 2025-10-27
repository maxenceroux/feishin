import { useQuery } from '@tanstack/react-query';

import { spotifyClient } from '/@/renderer/api/spotify/spotify-client';
import { getSpotifyTokenUrl } from '/@/renderer/utils/noiseport-server';
import { Album, Song } from '/@/shared/types/domain-types';

interface UseSpotifyAlbumDetailArgs {
    albumId: string;
    enabled?: boolean;
    serverId: string;
}

export const useSpotifyAlbumDetail = ({
    albumId,
    enabled = true,
    serverId,
}: UseSpotifyAlbumDetailArgs) => {
    return useQuery({
        cacheTime: 1000 * 60 * 10, // 10 minutes
        enabled: enabled && !!albumId && albumId.startsWith('spotify:'),
        queryFn: async (): Promise<(Album & { songs: Song[] }) | null> => {
            if (!albumId.startsWith('spotify:')) {
                return null;
            }

            try {
                // Fetch the token from the backend
                const tokenRes = await fetch(getSpotifyTokenUrl());

                if (!tokenRes.ok) {
                    throw new Error(`Failed to fetch Spotify token: ${tokenRes.status}`);
                }

                const { access_token } = await tokenRes.json();

                if (!access_token) {
                    throw new Error('No access token received from backend');
                }

                await spotifyClient.setAccessToken(access_token);

                const spotifyAlbumDetails = await spotifyClient.getAlbumDetails(albumId);
                const album = spotifyClient.mapSpotifyAlbumToAlbum(spotifyAlbumDetails, serverId);

                // Map tracks to songs
                const songs = spotifyAlbumDetails.tracks.items.map((track) =>
                    spotifyClient.mapSpotifyTrackToSong(track, spotifyAlbumDetails, serverId),
                );

                return {
                    ...album,
                    songs,
                } as Album & { songs: Song[] };
            } catch (error) {
                console.error('Spotify album detail error:', error);
                throw error;
            }
        },
        queryKey: ['spotify', 'album', 'detail', albumId],
        retry: 2, // Retry twice on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
