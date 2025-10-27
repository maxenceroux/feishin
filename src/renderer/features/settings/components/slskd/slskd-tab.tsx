import { SlskdServerSettings } from './slskd-server-settings';

import { Stack } from '/@/shared/components/stack/stack';

export const SlskdTab = () => {
    return (
        <Stack gap="md">
            <SlskdServerSettings />
        </Stack>
    );
};
