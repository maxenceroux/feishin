import { NoisePortServerSettings } from './noiseport-server-settings';

import { Stack } from '/@/shared/components/stack/stack';

export const NoisePortTab = () => {
    return (
        <Stack gap="md">
            <NoisePortServerSettings />
        </Stack>
    );
};
