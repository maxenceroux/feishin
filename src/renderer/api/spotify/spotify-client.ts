import axios, { AxiosInstance } from 'axios';

import {
    Album,
    AlbumArtist,
    LibraryItem,
    RelatedArtist,
    ServerType,
    Song,
} from '/@/shared/types/domain-types';

export interface SpotifyAlbum {
    album_type: string;
    artists: SpotifyArtist[];
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

export interface SpotifyAlbumDetails extends SpotifyAlbum {
    tracks: {
        href: string;
        items: SpotifyTrack[];
        limit: number;
        next: null | string;
        offset: number;
        previous: null | string;
        total: number;
    };
}

export interface SpotifyArtist {
    external_urls: { spotify: string };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

export interface SpotifyArtistAlbumsResponse {
    href: string;
    items: SpotifyAlbum[];
    limit: number;
    next: null | string;
    offset: number;
    previous: null | string;
    total: number;
}

export interface SpotifyArtistDetails {
    external_urls: { spotify: string };
    followers: {
        href: null | string;
        total: number;
    };
    genres: string[];
    href: string;
    id: string;
    images: Array<{
        height: number;
        url: string;
        width: number;
    }>;
    name: string;
    popularity: number;
    type: 'artist';
    uri: string;
}

export interface SpotifyRelatedArtistsResponse {
    artists: SpotifyArtistDetails[];
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
    artists: {
        href: string;
        items: SpotifyArtistDetails[];
        limit: number;
        next: null | string;
        offset: number;
        previous: null | string;
        total: number;
    };
    tracks: {
        href: string;
        items: SpotifyTrack[];
        limit: number;
        next: null | string;
        offset: number;
        previous: null | string;
        total: number;
    };
}

export interface SpotifyTrack {
    artists: SpotifyArtist[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_urls: { spotify: string };
    href: string;
    id: string;
    is_local: boolean;
    name: string;
    preview_url: null | string;
    track_number: number;
    type: 'track';
    uri: string;
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

    public async getAlbumDetails(albumId: string): Promise<SpotifyAlbumDetails> {
        if (!this.accessToken) {
            throw new Error('Spotify access token not set');
        }

        if (!albumId) {
            throw new Error('Album ID is required');
        }

        // Extract Spotify ID from our ID format if needed
        const spotifyId = albumId.startsWith('spotify:') ? albumId.split(':')[1] : albumId;

        if (!spotifyId) {
            throw new Error('Invalid Spotify album ID format');
        }

        try {
            const response = await this.client.get<SpotifyAlbumDetails>(`/albums/${spotifyId}`);
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch Spotify album details: ${error.message}`);
            }
            throw error;
        }
    }

    public async getArtistAlbums(
        artistId: string,
        options: {
            include_groups?: 'album' | 'appears_on' | 'compilation' | 'single' | string;
            limit?: number;
            offset?: number;
        } = {},
    ): Promise<SpotifyArtistAlbumsResponse> {
        if (!this.accessToken) {
            throw new Error('Spotify access token not set');
        }

        if (!artistId) {
            throw new Error('Artist ID is required');
        }

        // Extract Spotify ID from our ID format if needed
        const spotifyId = artistId.startsWith('spotify:') ? artistId.split(':')[1] : artistId;

        if (!spotifyId) {
            throw new Error('Invalid Spotify artist ID format');
        }

        try {
            const response = await this.client.get<SpotifyArtistAlbumsResponse>(
                `/artists/${spotifyId}/albums`,
                {
                    params: {
                        include_groups: options.include_groups || 'album,single',
                        limit: options.limit || 50,
                        market: 'US', // Add market parameter for better results
                        offset: options.offset || 0,
                    },
                },
            );
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch Spotify artist albums: ${error.message}`);
            }
            throw error;
        }
    }

    public async getArtistDetails(artistId: string): Promise<SpotifyArtistDetails> {
        if (!this.accessToken) {
            throw new Error('Spotify access token not set');
        }

        if (!artistId) {
            throw new Error('Artist ID is required');
        }

        // Extract Spotify ID from our ID format if needed
        const spotifyId = artistId.startsWith('spotify:') ? artistId.split(':')[1] : artistId;

        if (!spotifyId) {
            throw new Error('Invalid Spotify artist ID format');
        }

        try {
            const response = await this.client.get<SpotifyArtistDetails>(`/artists/${spotifyId}`);
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch Spotify artist details: ${error.message}`);
            }
            throw error;
        }
    }

    public async getRelatedArtists(artistId: string): Promise<SpotifyRelatedArtistsResponse> {
        if (!this.accessToken) {
            throw new Error('Spotify access token not set');
        }

        if (!artistId) {
            throw new Error('Artist ID is required');
        }

        // Extract Spotify ID from our ID format if needed
        const spotifyId = artistId.startsWith('spotify:') ? artistId.split(':')[1] : artistId;

        if (!spotifyId) {
            throw new Error('Invalid Spotify artist ID format');
        }

        try {
            const response = await this.client.get<SpotifyRelatedArtistsResponse>(
                `/artists/${spotifyId}/related-artists`,
            );
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch Spotify related artists: ${error.message}`);
            }
            throw error;
        }
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
                id: `spotify:${artist.id}`,
                imageUrl: null,
                itemType: LibraryItem.ALBUM_ARTIST,
                name: artist.name,
            })),
            artists: spotifyAlbum.artists.map((artist) => ({
                id: `spotify:${artist.id}`,
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

    public mapSpotifyArtistToAlbumArtist(
        spotifyArtist: SpotifyArtistDetails,
        serverId: string,
    ): AlbumArtist {
        return {
            // Mark as Spotify source for identification
            __isSpotify: true,
            albumCount: null, // Spotify doesn't provide album count in artist details
            backgroundImageUrl: null,
            biography: null, // Spotify doesn't provide biography in basic details
            duration: null,
            genres: spotifyArtist.genres.map((genre) => ({
                id: genre,
                imageUrl: null,
                itemType: LibraryItem.GENRE,
                name: genre,
            })),
            id: `spotify:${spotifyArtist.id}`,
            imageUrl: spotifyArtist.images?.[0]?.url || null,
            itemType: LibraryItem.ALBUM_ARTIST,
            lastPlayedAt: null,
            mbz: null,
            name: spotifyArtist.name,
            playCount: null,
            serverId,
            serverType: ServerType.SUBSONIC, // Using as placeholder since Spotify isn't a server type
            similarArtists: null,
            songCount: null,
            userFavorite: false,
            userRating: null,
        } as AlbumArtist & { __isSpotify: boolean };
    }

    public mapSpotifyRelatedArtists(relatedArtists: SpotifyArtistDetails[]): RelatedArtist[] {
        return relatedArtists.map((artist) => ({
            id: `spotify:${artist.id}`,
            imageUrl: artist.images?.[0]?.url || null,
            name: artist.name,
        }));
    }

    public mapSpotifyTrackToSong(
        spotifyTrack: SpotifyTrack,
        album: SpotifyAlbum,
        serverId: string,
    ): Song {
        if (!spotifyTrack || !album || !serverId) {
            throw new Error('Invalid parameters for mapping Spotify track to song');
        }

        const primaryArtist = spotifyTrack.artists?.[0];

        return {
            album: album.name || 'Unknown Album',
            albumArtists: (album.artists || []).map((artist) => ({
                id: `spotify:${artist.id || ''}`,
                imageUrl: null,
                itemType: LibraryItem.ALBUM_ARTIST,
                name: artist.name || 'Unknown Artist',
            })),
            albumId: `spotify:${album.id}`,
            artistName: primaryArtist?.name || 'Unknown Artist',
            artists: (spotifyTrack.artists || []).map((artist) => ({
                id: `spotify:${artist.id || ''}`,
                imageUrl: null,
                itemType: LibraryItem.ARTIST,
                name: artist.name || 'Unknown Artist',
            })),
            bitDepth: null,
            bitRate: 0, // Spotify doesn't provide bit rate info
            bpm: null,
            channels: null,
            comment: null,
            compilation: album.album_type === 'compilation',
            container: null,
            createdAt: new Date().toISOString(),
            discNumber: spotifyTrack.disc_number || 1,
            discSubtitle: null,
            duration: Math.round((spotifyTrack.duration_ms || 0) / 1000), // Convert to seconds
            gain: null,
            genres: [],
            id: `spotify:${spotifyTrack.id}`,
            imagePlaceholderUrl: null,
            imageUrl: album.images?.[0]?.url || null,
            itemType: LibraryItem.SONG,
            lastPlayedAt: null,
            lyrics: null,
            name: spotifyTrack.name || 'Unknown Track',
            participants: null,
            path: null,
            peak: null,
            playCount: 0,
            releaseDate: album.release_date || null,
            releaseYear: album.release_date
                ? new Date(album.release_date).getFullYear().toString()
                : null,
            sampleRate: null,
            serverId,
            serverType: ServerType.SUBSONIC, // Using as placeholder
            size: 0,
            streamUrl: spotifyTrack.preview_url || '', // Spotify only provides 30s previews
            tags: null,
            trackNumber: spotifyTrack.track_number || 1,
            uniqueId: `spotify:${spotifyTrack.id}:${serverId}`,
            updatedAt: new Date().toISOString(),
            userFavorite: false,
            userRating: null,
        } as Song;
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

    public async searchArtists(query: string, limit = 20): Promise<SpotifyArtistDetails[]> {
        if (!this.accessToken) {
            throw new Error('Spotify access token not set');
        }

        const response = await this.client.get<SpotifySearchResponse>('/search', {
            params: {
                limit,
                q: query,
                type: 'artist',
            },
        });

        return response.data.artists.items;
    }

    public async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
        if (!this.accessToken) {
            throw new Error('Spotify access token not set');
        }

        const response = await this.client.get<SpotifySearchResponse>('/search', {
            params: {
                limit,
                q: query,
                type: 'track',
            },
        });

        return response.data.tracks.items;
    }

    public async setAccessToken(token: string): Promise<void> {
        this.accessToken = token;
    }
}

export const spotifyClient = new SpotifyClient();
