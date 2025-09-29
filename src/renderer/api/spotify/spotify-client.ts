import axios, { AxiosInstance } from 'axios';

import { Album, LibraryItem, ServerType } from '/@/shared/types/domain-types';

export interface SpotifyAlbum {
    album_type: string;
    artists: Array<{
        external_urls: { spotify: string };
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
    }>;
    external_urls: { spotify: string };
    href: string;
    id: string;
    images: Array<{
        height: number;
        url: string;
        width: number;
    }>;
    name: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: 'album';
    uri: string;
}

export interface SpotifySearchResponse {
    albums: {
        href: string;
        items: SpotifyAlbum[];
        limit: number;
        next: null | string;
        offset: number;
        previous: null | string;
        total: number;
    };
}

class SpotifyClient {
    private accessToken: null | string = null;
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.spotify.com/v1',
            timeout: 10000,
        });

        // Add request interceptor to attach token
        this.client.interceptors.request.use((config) => {
            if (this.accessToken) {
                config.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return config;
        });
    }

    public mapSpotifyAlbumToAlbum(spotifyAlbum: SpotifyAlbum, serverId: string): Album {
        const primaryArtist = spotifyAlbum.artists[0];
        const releaseYear = spotifyAlbum.release_date
            ? new Date(spotifyAlbum.release_date).getFullYear()
            : null;

        return {
            // Mark as Spotify source for identification
            __isSpotify: true,
            albumArtist: primaryArtist?.name || 'Unknown Artist',
            albumArtists: spotifyAlbum.artists.map((artist) => ({
                id: artist.id,
                imageUrl: null,
                itemType: LibraryItem.ALBUM_ARTIST,
                name: artist.name,
            })),
            artists: spotifyAlbum.artists.map((artist) => ({
                id: artist.id,
                imageUrl: null,
                itemType: LibraryItem.ARTIST,
                name: artist.name,
            })),
            backdropImageUrl: null,
            comment: null,
            createdAt: new Date().toISOString(),
            duration: null,
            genres: [],
            id: `spotify:${spotifyAlbum.id}`,
            imagePlaceholderUrl: null,
            imageUrl: spotifyAlbum.images?.[0]?.url || null,
            isCompilation: spotifyAlbum.album_type === 'compilation',
            itemType: LibraryItem.ALBUM,
            lastPlayedAt: null,
            mbzId: null,
            name: spotifyAlbum.name,
            originalDate: spotifyAlbum.release_date || null,
            participants: null,
            playCount: null,
            releaseDate: spotifyAlbum.release_date || null,
            releaseYear,
            serverId,
            serverType: ServerType.SUBSONIC, // Using as placeholder since Spotify isn't a server type
            size: null,
            songCount: spotifyAlbum.total_tracks,
            tags: null,
            uniqueId: `spotify:${spotifyAlbum.id}:${serverId}`,
            updatedAt: new Date().toISOString(),
            userFavorite: false,
            userRating: null,
        } as Album & { __isSpotify: boolean };
    }

    public async searchAlbums(query: string, limit = 20): Promise<SpotifyAlbum[]> {
        if (!this.accessToken) {
            throw new Error('Spotify access token not set');
        }

        const response = await this.client.get<SpotifySearchResponse>('/search', {
            params: {
                limit,
                q: query,
                type: 'album',
            },
        });

        return response.data.albums.items;
    }

    public async setAccessToken(token: string): Promise<void> {
        this.accessToken = token;
    }
}

export const spotifyClient = new SpotifyClient();
