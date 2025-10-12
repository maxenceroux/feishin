import { Stack } from '/@/shared/components/stack/stack';

import { SlskdServerSettings } from './slskd-server-settings';

export const SlskdTab = () => {
    return (
        <Stack gap="md">
            <SlskdServerSettings />
        </Stack>
    );
};