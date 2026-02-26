import { RiMusicLine, RiUploadCloudLine } from 'react-icons/ri';

import { AlbumUploader } from '/@/renderer/features/settings/components/noiseport/album-uploader';
import { AnimatedPage } from '/@/renderer/features/shared';
import { Flex } from '/@/shared/components/flex/flex';
import { Paper } from '/@/shared/components/paper/paper';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const ImportRoute = () => {
    return (
        <AnimatedPage>
            <Flex
                direction="column"
                h="100%"
                p="xl"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)',
                }}
                w="100%"
            >
                <Stack
                    gap="xl"
                    style={{
                        margin: '0 auto',
                        maxWidth: '900px',
                        width: '100%',
                    }}
                >
                    {/* Header Section */}
                    <Paper
                        p="xl"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1) 0%, rgba(var(--primary-color-rgb), 0.05) 100%)',
                            border: '1px solid rgba(var(--primary-color-rgb), 0.2)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {/* Background decoration */}
                        <div
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(var(--primary-color-rgb), 0.1) 0%, transparent 70%)',
                                borderRadius: '50%',
                                height: '200px',
                                pointerEvents: 'none',
                                position: 'absolute',
                                right: '-50px',
                                top: '-50px',
                                width: '200px',
                            }}
                        />
                        <div
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(var(--primary-color-rgb), 0.08) 0%, transparent 70%)',
                                borderRadius: '50%',
                                bottom: '-30px',
                                height: '150px',
                                left: '-30px',
                                pointerEvents: 'none',
                                position: 'absolute',
                                width: '150px',
                            }}
                        />

                        <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                            <div
                                style={{
                                    alignItems: 'center',
                                    display: 'inline-flex',
                                    gap: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        alignItems: 'center',
                                        background:
                                            'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.2) 0%, rgba(var(--primary-color-rgb), 0.1) 100%)',
                                        border: '1px solid rgba(var(--primary-color-rgb), 0.3)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        height: '56px',
                                        justifyContent: 'center',
                                        width: '56px',
                                    }}
                                >
                                    <RiUploadCloudLine
                                        size={32}
                                        style={{ color: 'var(--primary-color)' }}
                                    />
                                </div>
                                <div>
                                    <Text fw={700} size="32px" style={{ lineHeight: 1.2 }}>
                                        Import Music
                                    </Text>
                                    <Text c="dimmed" mt="xs" size="md">
                                        Upload your audio files to NoisePort server
                                    </Text>
                                </div>
                            </div>

                            <Flex gap="lg" mt="md" style={{ flexWrap: 'wrap' }}>
                                <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                                    <RiMusicLine
                                        size={18}
                                        style={{ color: 'var(--primary-color)', opacity: 0.7 }}
                                    />
                                    <Text c="dimmed" size="sm">
                                        Auto-detect metadata from tags
                                    </Text>
                                </div>
                                <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                                    <RiUploadCloudLine
                                        size={18}
                                        style={{ color: 'var(--primary-color)', opacity: 0.7 }}
                                    />
                                    <Text c="dimmed" size="sm">
                                        Support for all major formats
                                    </Text>
                                </div>
                            </Flex>
                        </Stack>
                    </Paper>

                    {/* Uploader Component */}
                    <AlbumUploader />
                </Stack>
            </Flex>
        </AnimatedPage>
    );
};

export default ImportRoute;
