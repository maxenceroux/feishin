import { Album, LibraryItem, ServerType } from '/@/shared/types/domain-types';

export interface SpotifyAlbum {
    id: string;
    name: string;
    artists: Array<{
        id: string;
        name: string;
    }>;
    images: Array<{
        url: string;
        height: number;
        width: number;
    }>;
    release_date: string;
    total_tracks: number;
    album_type: string;
    external_urls: {
        spotify: string;
    };
}

export function mapSpotifyAlbumToInternalAlbum(spotifyAlbum: SpotifyAlbum): Album {
    const imageUrl = spotifyAlbum.images?.[0]?.url || null;
    const releaseYear = spotifyAlbum.release_date ? new Date(spotifyAlbum.release_date).getFullYear() : null;
    const artistNames = spotifyAlbum.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
    
    return {
        albumArtist: artistNames,
        albumArtists: spotifyAlbum.artists?.map(artist => ({
            id: `spotify-${artist.id}`,
            name: artist.name,
            imageUrl: null,
            itemType: LibraryItem.ALBUM_ARTIST,
        })) || [],
        artists: spotifyAlbum.artists?.map(artist => ({
            id: `spotify-${artist.id}`,
            name: artist.name,
            imageUrl: null,
            itemType: LibraryItem.ALBUM_ARTIST,
        })) || [],
        backdropImageUrl: null,
        comment: null,
        createdAt: new Date().toISOString(),
        duration: null,
        genres: [],
        id: `spotify-${spotifyAlbum.id}`,
        imagePlaceholderUrl: null,
        imageUrl,
        isCompilation: null,
        itemType: LibraryItem.ALBUM,
        lastPlayedAt: null,
        mbzId: null,
        name: spotifyAlbum.name,
        originalDate: spotifyAlbum.release_date,
        participants: null,
        playCount: null,
        releaseDate: spotifyAlbum.release_date,
        releaseYear,
        serverId: 'spotify',
        serverType: ServerType.SPOTIFY,
        size: null,
        songCount: spotifyAlbum.total_tracks,
        tags: null,
        uniqueId: `spotify-${spotifyAlbum.id}`,
        updatedAt: new Date().toISOString(),
        userFavorite: false,
        userRating: null,
        // Add a custom property to identify Spotify albums
        _isSpotifyAlbum: true,
        _spotifyUrl: spotifyAlbum.external_urls?.spotify,
    } as Album & { _isSpotifyAlbum: boolean; _spotifyUrl?: string };
}