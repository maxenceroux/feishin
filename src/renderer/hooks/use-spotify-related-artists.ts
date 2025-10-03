import { useQuery } from '@tanstack/react-query';

import { spotifyClient } from '/@/renderer/api/spotify/spotify-client';
import { RelatedArtist } from '/@/shared/types/domain-types';

interface UseSpotifyRelatedArtistsArgs {
    artistId: string;
    enabled?: boolean;
}

export const useSpotifyRelatedArtists = ({
    artistId,
    enabled = true,
}: UseSpotifyRelatedArtistsArgs) => {
    return useQuery({
        cacheTime: 1000 * 60 * 15, // 15 minutes (related artists don't change often)
        enabled: enabled && !!artistId && artistId.startsWith('spotify:'),
        queryFn: async (): Promise<RelatedArtist[]> => {
            if (!artistId.startsWith('spotify:')) {
                return [];
            }

            try {
                // Fetch the token from the backend
                const tokenRes = await fetch('http://100.98.104.55:3001/api/spotify-token');

                if (!tokenRes.ok) {
                    throw new Error(`Failed to fetch Spotify token: ${tokenRes.status}`);
                }

                const { access_token } = await tokenRes.json();

                if (!access_token) {
                    throw new Error('No access token received from backend');
                }

                await spotifyClient.setAccessToken(access_token);

                const relatedArtistsResponse = await spotifyClient.getRelatedArtists(artistId);
                const relatedArtists = spotifyClient.mapSpotifyRelatedArtists(
                    relatedArtistsResponse.artists,
                );

                return relatedArtists;
            } catch (error) {
                console.error('Spotify related artists error:', error);
                throw error;
            }
        },
        queryKey: ['spotify', 'artist', 'related', artistId],
        retry: 2, // Retry twice on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
