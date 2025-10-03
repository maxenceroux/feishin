import isElectron from 'is-electron';

const localSettings = isElectron() ? window.api.localSettings : null;

const SPOTIFY_TOGGLE_KEY = 'spotifyToggleEnabled';

export const getSpotifyToggleState = (): boolean => {
    if (localSettings) {
        // Use electron-store for Electron app
        const stored = localSettings.get(SPOTIFY_TOGGLE_KEY);
        return typeof stored === 'boolean' ? stored : false;
    } else {
        // Use localStorage for web version
        const stored = localStorage.getItem(SPOTIFY_TOGGLE_KEY);
        return stored === 'true';
    }
};

export const setSpotifyToggleState = (enabled: boolean): void => {
    if (localSettings) {
        // Use electron-store for Electron app
        localSettings.set(SPOTIFY_TOGGLE_KEY, enabled);
    } else {
        // Use localStorage for web version
        localStorage.setItem(SPOTIFY_TOGGLE_KEY, enabled.toString());
    }
};
