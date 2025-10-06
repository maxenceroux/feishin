import axios from 'axios';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';

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

        return { searches, downloads };
    } catch (error) {
        console.error('Failed to fetch slskd data:', error);
        throw error;
    }
};