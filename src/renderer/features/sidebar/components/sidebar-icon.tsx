import {
    RiAlbumFill,
    RiAlbumLine,
    RiDownload2Fill,
    RiDownload2Line,
    RiFlag2Fill,
    RiFlag2Line,
    RiFolder3Fill,
    RiFolder3Line,
    RiHome6Fill,
    RiHome6Line,
    RiMusic2Fill,
    RiMusic2Line,
    RiPlayFill,
    RiPlayLine,
    RiPlayListFill,
    RiPlayListLine,
    RiSearchFill,
    RiSearchLine,
    RiSettings2Fill,
    RiSettings2Line,
    RiUpload2Fill,
    RiUpload2Line,
    RiUserVoiceFill,
    RiUserVoiceLine,
} from 'react-icons/ri';
import { generatePath } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';
import { LibraryItem } from '/@/shared/types/domain-types';

interface SidebarIconProps {
    active?: boolean;
    route: string;
    size?: string;
}

export const SidebarIcon = ({ active, route, size }: SidebarIconProps) => {
    switch (route) {
        case AppRoute.DISCOVER_ALBUMS:
            if (active) return <RiAlbumFill size={size} />;
            return <RiAlbumLine size={size} />;
        case AppRoute.DISCOVER_ARTISTS:
            if (active) return <RiUserVoiceFill size={size} />;
            return <RiUserVoiceLine size={size} />;
        case AppRoute.DISCOVER_TRACKS:
            if (active) return <RiMusic2Fill size={size} />;
            return <RiMusic2Line size={size} />;
        case AppRoute.HOME:
            if (active) return <RiHome6Fill size={size} />;
            return <RiHome6Line size={size} />;
        case AppRoute.IMPORT:
            if (active) return <RiUpload2Fill size={size} />;
            return <RiUpload2Line size={size} />;
        case AppRoute.LIBRARY_ALBUM_ARTISTS:
            if (active) return <RiUserVoiceFill size={size} />;
            return <RiUserVoiceLine size={size} />;
        case AppRoute.LIBRARY_ALBUMS:
            if (active) return <RiAlbumFill size={size} />;
            return <RiAlbumLine size={size} />;
        case AppRoute.LIBRARY_ARTISTS:
            if (active) return <RiUserVoiceFill size={size} />;
            return <RiUserVoiceLine size={size} />;
        case AppRoute.LIBRARY_FOLDERS:
            if (active) return <RiFolder3Fill size={size} />;
            return <RiFolder3Line size={size} />;
        case AppRoute.LIBRARY_GENRES:
            if (active) return <RiFlag2Fill size={size} />;
            return <RiFlag2Line size={size} />;
        case AppRoute.LIBRARY_SONGS:
            if (active) return <RiMusic2Fill size={size} />;
            return <RiMusic2Line size={size} />;
        case AppRoute.NOW_PLAYING:
            if (active) return <RiPlayFill size={size} />;
            return <RiPlayLine size={size} />;
        case AppRoute.PLAYLISTS:
            if (active) return <RiPlayListFill size={size} />;
            return <RiPlayListLine size={size} />;
        case AppRoute.SETTINGS:
            if (active) return <RiSettings2Fill size={size} />;
            return <RiSettings2Line size={size} />;
        case AppRoute.SLSKD_DOWNLOADS:
            if (active) return <RiDownload2Fill size={size} />;
            return <RiDownload2Line size={size} />;
        case AppRoute.SLSKD_SEARCH:
            if (active) return <RiSearchFill size={size} />;
            return <RiSearchLine size={size} />;
        case generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG }):
            if (active) return <RiSearchFill size={size} />;
            return <RiSearchLine size={size} />;
        default:
            return <RiHome6Line size={size} />;
    }
};
