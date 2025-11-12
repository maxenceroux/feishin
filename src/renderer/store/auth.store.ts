import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { useAlbumArtistListDataStore } from '/@/renderer/store/album-artist-list-data.store';
import { useAlbumListDataStore } from '/@/renderer/store/album-list-data.store';
import { useListStore } from '/@/renderer/store/list.store';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { ServerListItem, ServerType } from '/@/shared/types/domain-types';

export interface AuthSlice extends AuthState {
    actions: {
        addServer: (args: ServerListItem) => void;
        deleteServer: (id: string) => void;
        getServer: (id: string) => null | ServerListItem;
        setCurrentServer: (server: null | ServerListItem) => void;
        updateServer: (id: string, args: Partial<ServerListItem>) => void;
    };
}

export interface AuthState {
    currentServer: null | ServerListItem;
    deviceId: string;
    serverList: Record<string, ServerListItem>;
}

/**
 * Extracts the hostname or IP address from a server URL
 * For example: "http://100.64.0.3:4533" returns "100.64.0.3"
 */
const extractHostFromUrl = (url: string): null | string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    }
};

/**
 * Auto-populates Slskd and NoisePort settings when connecting to a Navidrome server
 */
const autoPopulateSettingsForNavidrome = (server: ServerListItem) => {
    if (server.type !== ServerType.NAVIDROME) {
        return;
    }

    const settingsStore = useSettingsStore.getState();
    const host = extractHostFromUrl(server.url);

    if (!host) {
        return;
    }

    // Auto-populate NoisePort server IP
    settingsStore.actions.setNoisePortServerIp(host);

    // Auto-populate Slskd server only if no servers exist
    if (settingsStore.slskd.servers.length === 0) {
        const defaultSlskdServer = {
            baseUrl: `http://${host}:5030`,
            id: nanoid(),
            name: 'noiseport',
            password: 'slskd',
            username: 'slskd',
        };

        settingsStore.actions.addSlskdServer(defaultSlskdServer);
        settingsStore.actions.setSelectedSlskdServer(defaultSlskdServer.id);
    }
};

export const useAuthStore = createWithEqualityFn<AuthSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    addServer: (args) => {
                        set((state) => {
                            state.serverList[args.id] = args;
                        });
                    },
                    deleteServer: (id) => {
                        set((state) => {
                            delete state.serverList[id];

                            if (state.currentServer?.id === id) {
                                state.currentServer = null;
                            }
                        });
                    },
                    getServer: (id) => {
                        const server = get().serverList[id];
                        if (server) return server;
                        return null;
                    },
                    setCurrentServer: (server) => {
                        set((state) => {
                            state.currentServer = server;

                            if (server) {
                                // Reset list filters
                                useListStore.getState()._actions.resetFilter();

                                // Reset persisted grid list stores
                                useAlbumListDataStore.getState().actions.setItemData([]);
                                useAlbumArtistListDataStore.getState().actions.setItemData([]);

                                // Auto-populate Slskd and NoisePort settings for Navidrome
                                autoPopulateSettingsForNavidrome(server);
                            }
                        });
                    },
                    updateServer: (id: string, args: Partial<ServerListItem>) => {
                        set((state) => {
                            const updatedServer = {
                                ...state.serverList[id],
                                ...args,
                            };

                            state.serverList[id] = updatedServer;
                            state.currentServer = updatedServer;
                        });
                    },
                },
                currentServer: null,
                deviceId: nanoid(),
                serverList: {},
            })),
            { name: 'store_authentication' },
        ),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_authentication',
            version: 2,
        },
    ),
);

export const useCurrentServerId = () => useAuthStore((state) => state.currentServer)?.id || '';

export const useCurrentServer = () => useAuthStore((state) => state.currentServer);

export const useServerList = () => useAuthStore((state) => state.serverList);

export const useAuthStoreActions = () => useAuthStore((state) => state.actions);

export const getServerById = (id?: string) => {
    if (!id) {
        return null;
    }

    return useAuthStore.getState().actions.getServer(id);
};
