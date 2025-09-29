import { useQuery } from '@tanstack/react-query';

import { spotifyClient } from '/@/renderer/api/spotify/spotify-client';
import { Album } from '/@/shared/types/domain-types';

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
            if (!query.trim()) {
                return [];
            }

            try {
                // In a real implementation, we would get the token from the backend
                // For now, we'll just return empty results if no token is available
                const spotifyAlbums = await spotifyClient.searchAlbums(query);
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

// Hook to set Spotify access token (would be called from a settings or auth component)
export const useSetSpotifyToken = () => {
    return {
        setToken: (token: string) => spotifyClient.setAccessToken(token),
    };
};
