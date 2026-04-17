import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useCurrentServer } from '/@/renderer/store';
import { useHiddenItems, useHiddenItemsActions } from '/@/renderer/store/hidden-items.store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';

const ITEM_TYPE_LABELS: Partial<Record<LibraryItem, string>> = {
    [LibraryItem.ALBUM]: 'entity.album',
    [LibraryItem.ALBUM_ARTIST]: 'entity.albumArtist',
    [LibraryItem.SONG]: 'entity.song',
};

export const HiddenItemsSettings = () => {
    const server = useCurrentServer();
    const serverId = server?.id || '';
    const { unhideAll, unhideItems } = useHiddenItemsActions();
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    const albumItems = useHiddenItems(serverId, LibraryItem.ALBUM);
    const artistItems = useHiddenItems(serverId, LibraryItem.ALBUM_ARTIST);
    const songItems = useHiddenItems(serverId, LibraryItem.SONG);

    const groupedItems = [
        { items: albumItems, type: LibraryItem.ALBUM },
        { items: artistItems, type: LibraryItem.ALBUM_ARTIST },
        { items: songItems, type: LibraryItem.SONG },
    ].filter((group) => group.items.length > 0);

    const totalCount = albumItems.length + artistItems.length + songItems.length;

    return (
        <>
            <SettingsOptions
                control={
                    <Button
                        disabled={!serverId}
                        onClick={() => setOpen(!open)}
                        size="compact-md"
                        variant="filled"
                    >
                        {t(open ? 'common.close' : 'common.edit', { postProcess: 'titleCase' })}
                    </Button>
                }
                description={t('setting.hiddenItems_description', {
                    postProcess: 'sentenceCase',
                })}
                title={`${t('setting.hiddenItems', { postProcess: 'sentenceCase' })} (${totalCount})`}
            />
            {open && (
                <Stack gap="sm">
                    {totalCount === 0 ? (
                        <Text isMuted isNoSelect size="sm">
                            {t('setting.hiddenItemsNone', { postProcess: 'sentenceCase' })}
                        </Text>
                    ) : (
                        <>
                            {groupedItems.map((group) => (
                                <Stack gap="xs" key={group.type}>
                                    <Text fw={600} size="sm">
                                        {t(ITEM_TYPE_LABELS[group.type] || group.type, {
                                            context: 'other',
                                            postProcess: 'titleCase',
                                        })}
                                    </Text>
                                    {group.items.map((item) => (
                                        <Group justify="space-between" key={item.id}>
                                            <Text size="sm">{item.name}</Text>
                                            <Button
                                                leftSection={<Icon icon="visibility" />}
                                                onClick={() =>
                                                    unhideItems(serverId, group.type, [item.id])
                                                }
                                                size="compact-xs"
                                                variant="subtle"
                                            >
                                                {t('setting.unhide', {
                                                    postProcess: 'sentenceCase',
                                                })}
                                            </Button>
                                        </Group>
                                    ))}
                                </Stack>
                            ))}
                            <Group justify="flex-end">
                                <Button
                                    color="red"
                                    onClick={() => unhideAll(serverId)}
                                    size="compact-sm"
                                    variant="subtle"
                                >
                                    {t('setting.unhideAll', { postProcess: 'sentenceCase' })}
                                </Button>
                            </Group>
                        </>
                    )}
                </Stack>
            )}
            <Divider />
        </>
    );
};
