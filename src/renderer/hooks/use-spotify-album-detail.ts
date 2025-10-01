import { useQuery } from '@tanstack/react-query';

import { spotifyClient } from '/@/renderer/api/spotify/spotify-client';
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
                const tokenRes = await fetch('http://100.98.104.55:3001/api/spotify-token');
                const { access_token } = await tokenRes.json();
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
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
