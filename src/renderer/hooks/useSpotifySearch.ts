import { useCallback, useRef, useState } from 'react';

// Fetch a client credentials token from the backend
export async function getSpotifyClientToken(): Promise<string> {
    const backendUrl = 'http://192.168.1.31:3001';
    const res = await fetch(`${backendUrl}/api/spotify-token`);
    if (!res.ok) throw new Error('Failed to get Spotify token');
    const data = await res.json();
    return data.access_token;
}

// Search Spotify using the backend token
export async function spotifySearch(query: string, type: string, token: string) {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=12`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Spotify API error');
    return res.json();
}

export function useSpotifySearch() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);

    // Get token from backend
    const getToken = useCallback(async () => {
        if (tokenRef.current) return tokenRef.current;
        try {
            const token = await getSpotifyClientToken();
            tokenRef.current = token;
            return token;
        } catch (err: any) {
            setError(err.message || 'Unknown error');
            throw err;
        }
    }, []);

    // Search Spotify albums
    const searchSpotify = useCallback(
        async (query: string) => {
            setLoading(true);
            setError(null);
            try {
                const token = await getToken();
                const data = await spotifySearch(query, 'album', token);
                setResults(data.albums?.items || []);
            } catch (err: any) {
                setError(err.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        },
        [getToken],
    );

    return { results, loading, error, searchSpotify };
}
