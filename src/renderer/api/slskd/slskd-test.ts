import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import { transformSearchResponseToHierarchical } from './slskd-utils';

// Test function to verify slskd API connectivity
export const testSlskdConnection = async (): Promise<boolean> => {
    try {
        const result = await slskdApi.testConnection();
        console.log('slskd connection test result:', result);
        return result;
    } catch (error) {
        console.error('slskd connection failed:', error);
        return false;
    }
};

// Test function to fetch sample data
export const testSlskdData = async () => {
    try {
        console.log('Testing slskd searches...');
        const searches = await slskdApi.getRecentSearches(10);
        console.log('Searches:', searches);

        console.log('Testing slskd downloads...');
        const downloads = await slskdApi.getRecentDownloads(10);
        console.log('Downloads:', downloads);

        return { downloads, searches };
    } catch (error) {
        console.error('Failed to fetch slskd data:', error);
        throw error;
    }
};

/**
 * Test function to verify hierarchical transformation works correctly
 */
export const testHierarchicalTransform = async (searchId: string) => {
    try {
        console.log('Testing hierarchical transformation for search:', searchId);

        // Get search results
        const results = await slskdApi.getSearchResults(searchId);
        console.log('Flat results:', results);

        // Transform to hierarchical
        const hierarchical = results.results.map(transformSearchResponseToHierarchical);
        console.log('Hierarchical results:', hierarchical);

        // Log structure for first result
        if (hierarchical.length > 0) {
            const first = hierarchical[0];
            console.log(`User: ${first.username}`);
            console.log(`Total files: ${first.totalFileCount}`);
            console.log(`Locked files: ${first.lockedFileCount}`);
            console.log(`Upload speed: ${first.uploadSpeed} bytes/sec`);
            console.log(`Directories:`, first.directories);

            // Log directory tree
            first.directories.forEach((dir) => {
                console.log(`  ${dir.name} (${dir.totalFileCount} files, ${dir.totalSize} bytes)`);
                dir.subdirectories.forEach((subdir) => {
                    console.log(
                        `    ${subdir.name} (${subdir.totalFileCount} files, ${subdir.totalSize} bytes)`,
                    );
                });
            });
        }

        return hierarchical;
    } catch (error) {
        console.error('Failed to test hierarchical transform:', error);
        throw error;
    }
};

/**
 * Test function to verify new API methods work correctly
 */
export const testNewApiMethods = async () => {
    try {
        console.log('Testing new API methods...');

        // Test getAllDownloads
        console.log('Getting all downloads...');
        const allDownloads = await slskdApi.getAllDownloads();
        console.log('All downloads:', allDownloads);

        // Test getSearchState if we have a search
        const searches = await slskdApi.getRecentSearches(1);
        if (searches.searches.length > 0) {
            const searchId = searches.searches[0].id;
            console.log('Getting search state for:', searchId);
            const searchState = await slskdApi.getSearchState(searchId);
            console.log('Search state:', searchState);

            // Test with responses included
            console.log('Getting search state with responses...');
            const searchStateWithResponses = await slskdApi.getSearchState(searchId, true);
            console.log('Search state with responses:', searchStateWithResponses);
        }

        return { allDownloads };
    } catch (error) {
        console.error('Failed to test new API methods:', error);
        throw error;
    }
};
