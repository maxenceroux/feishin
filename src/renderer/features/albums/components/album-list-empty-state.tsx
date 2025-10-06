import { useNavigate } from 'react-router-dom';

import { AppRoute } from '/@/renderer/router/routes';
import { useListStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

interface AlbumListEmptyStateProps {
    searchTerm: string;
}

export const AlbumListEmptyState = ({ searchTerm }: AlbumListEmptyStateProps) => {
    const navigate = useNavigate();
    const { setFilter } = useListStoreActions();

    const handleSearchInDiscover = () => {
        // Set the search term in the discover filter
        setFilter({
            data: { searchTerm },
            itemType: 'album' as any,
            key: 'album_discover',
        });
        
        // Navigate to discover albums
        navigate(AppRoute.DISCOVER_ALBUMS);
    };

    return (
        <Stack align="center" gap="md" style={{ padding: '2rem', textAlign: 'center' }}>
            <Text size="lg" weight={500}>
                No albums found in your library
            </Text>
            <Text color="dimmed" size="sm">
                No results found for "{searchTerm}"
            </Text>
            <Button
                onClick={handleSearchInDiscover}
                variant="outline"
            >
                Search in Discover (Spotify)
            </Button>
        </Stack>
    );
};