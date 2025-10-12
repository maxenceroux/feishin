import { useQuery } from '@tanstack/react-query';

import { spotifyClient } from '/@/renderer/api/spotify/spotify-client';
import { AlbumArtist } from '/@/shared/types/domain-types';

interface UseSpotifyArtistDetailArgs {
    artistId: string;
    enabled?: boolean;
    serverId: string;
}

export const useSpotifyArtistDetail = ({
    artistId,
    enabled = true,
    serverId,
}: UseSpotifyArtistDetailArgs) => {
    return useQuery({
        cacheTime: 1000 * 60 * 10, // 10 minutes
        enabled: enabled && !!artistId && artistId.startsWith('spotify:'),
        queryFn: async (): Promise<AlbumArtist | null> => {
            if (!artistId.startsWith('spotify:')) {
                return null;
            }

            try {
                // Fetch the token from the backend with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                const tokenRes = await fetch('http://100.98.104.55:3001/api/spotify-token', {
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (!tokenRes.ok) {
                    throw new Error(`Failed to fetch Spotify token: ${tokenRes.status}`);
                }

                const { access_token } = await tokenRes.json();

                if (!access_token) {
                    throw new Error('No access token received from backend');
                }

                await spotifyClient.setAccessToken(access_token);

                const spotifyArtistDetails = await spotifyClient.getArtistDetails(artistId);
                const artist = spotifyClient.mapSpotifyArtistToAlbumArtist(
                    spotifyArtistDetails,
                    serverId,
                );

                return artist;
            } catch (error) {
                console.error('Spotify artist detail error:', error);
                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        throw new Error('Spotify backend request timed out - backend may not be available');
                    }
                    throw new Error(`Spotify backend error: ${error.message}`);
                }
                throw error;
            }
        },
        queryKey: ['spotify', 'artist', 'detail', artistId],
        retry: (failureCount, error) => {
            // Don't retry timeout errors or network errors
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('backend'))) {
                return false;
            }
            return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
