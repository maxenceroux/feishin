import { useSettingsStore } from '/@/renderer/store/settings.store';

/**
 * Get the configured NoisePort server IP address
 */
export const getNoisePortServerIp = (): string => {
    return useSettingsStore.getState().noiseport.serverIp;
};

/**
 * Get the Spotify token endpoint URL
 */
export const getSpotifyTokenUrl = (): string => {
    const serverIp = getNoisePortServerIp();
    if (!serverIp) {
        console.warn('NoisePort server IP not configured, using default');
        return 'http://100.98.104.55:3001/api/spotify-token';
    }
    return `http://${serverIp}:3001/api/spotify-token`;
};

/**
 * Get the download endpoint URL
 */
export const getDownloadUrl = (): string => {
    const serverIp = getNoisePortServerIp();
    if (!serverIp) {
        console.warn('NoisePort server IP not configured, using default');
        return 'http://100.98.104.55:8000/api/v1/downloads/download';
    }
    return `http://${serverIp}:8000/api/v1/downloads/download`;
};
