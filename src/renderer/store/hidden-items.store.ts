import merge from 'lodash/merge';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { LibraryItem } from '/@/shared/types/domain-types';

export interface HiddenItemRecord {
    hiddenAt: number;
    id: string;
    imageUrl?: string;
    name: string;
}

export interface HiddenItemsSlice extends HiddenItemsState {
    actions: {
        getHiddenIds: (serverId: string, itemType: LibraryItem) => Set<string>;
        hideItems: (serverId: string, itemType: LibraryItem, records: HiddenItemRecord[]) => void;
        unhideAll: (serverId: string, itemType?: LibraryItem) => void;
        unhideItems: (serverId: string, itemType: LibraryItem, ids: string[]) => void;
    };
}

export interface HiddenItemsState {
    items: Record<string, Partial<Record<LibraryItem, HiddenItemRecord[]>>>;
}

export const useHiddenItemsStore = createWithEqualityFn<HiddenItemsSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    getHiddenIds: (serverId: string, itemType: LibraryItem): Set<string> => {
                        const records = get().items[serverId]?.[itemType] || [];
                        return new Set(records.map((r) => r.id));
                    },
                    hideItems: (
                        serverId: string,
                        itemType: LibraryItem,
                        records: HiddenItemRecord[],
                    ) => {
                        set((state) => {
                            if (!state.items[serverId]) {
                                state.items[serverId] = {};
                            }
                            if (!state.items[serverId][itemType]) {
                                state.items[serverId][itemType] = [];
                            }
                            const existing = state.items[serverId][itemType]!;
                            const existingIds = new Set(existing.map((r) => r.id));
                            for (const record of records) {
                                if (!existingIds.has(record.id)) {
                                    existing.push(record);
                                }
                            }
                        });
                    },
                    unhideAll: (serverId: string, itemType?: LibraryItem) => {
                        set((state) => {
                            if (!state.items[serverId]) return;
                            if (itemType) {
                                state.items[serverId][itemType] = [];
                            } else {
                                state.items[serverId] = {};
                            }
                        });
                    },
                    unhideItems: (serverId: string, itemType: LibraryItem, ids: string[]) => {
                        set((state) => {
                            const records = state.items[serverId]?.[itemType];
                            if (!records) return;
                            const idsToRemove = new Set(ids);
                            state.items[serverId][itemType] = records.filter(
                                (r) => !idsToRemove.has(r.id),
                            );
                        });
                    },
                },
                items: {},
            })),
            { name: 'store_hidden_items' },
        ),
        {
            merge: (persistedState, currentState) => {
                return merge(currentState, persistedState);
            },
            name: 'store_hidden_items',
            version: 1,
        },
    ),
);

export const useHiddenItemsActions = () => useHiddenItemsStore((state) => state.actions);

export const useHiddenIds = (serverId: string, itemType: LibraryItem): Set<string> => {
    const records = useHiddenItemsStore(
        (state) => state.items[serverId]?.[itemType] || [],
        shallow,
    );
    return new Set(records.map((r) => r.id));
};

export const useHiddenItemCount = (serverId: string, itemType: LibraryItem): number => {
    return useHiddenItemsStore((state) => state.items[serverId]?.[itemType]?.length || 0);
};

export const useHiddenItems = (serverId: string, itemType?: LibraryItem): HiddenItemRecord[] => {
    return useHiddenItemsStore((state) => {
        const serverItems = state.items[serverId];
        if (!serverItems) return [];
        if (itemType) return serverItems[itemType] || [];
        return Object.values(serverItems).flat() as HiddenItemRecord[];
    }, shallow);
};
