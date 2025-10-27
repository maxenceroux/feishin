import { Stack } from '/@/shared/components/stack/stack';

import { NoisePortServerSettings } from './noiseport-server-settings';

export const NoisePortTab = () => {
    return (
        <Stack gap="md">
            <NoisePortServerSettings />
        </Stack>
    );
};
