import { AlbumUploader } from '/@/renderer/features/settings/components/noiseport/album-uploader';
import { AnimatedPage } from '/@/renderer/features/shared';
import { Flex } from '/@/shared/components/flex/flex';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Paper } from '/@/shared/components/paper/paper';
import { RiMusicLine, RiUploadCloudLine } from 'react-icons/ri';

const ImportRoute = () => {
    return (
        <AnimatedPage>
            <Flex
                direction="column"
                h="100%"
                p="xl"
                w="100%"
                style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)',
                }}
            >
                <Stack
                    gap="xl"
                    style={{
                        maxWidth: '900px',
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* Header Section */}
                    <Paper
                        p="xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1) 0%, rgba(var(--primary-color-rgb), 0.05) 100%)',
                            border: '1px solid rgba(var(--primary-color-rgb), 0.2)',
                            borderRadius: '16px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Background decoration */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '-50px',
                                right: '-50px',
                                width: '200px',
                                height: '200px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(var(--primary-color-rgb), 0.1) 0%, transparent 70%)',
                                pointerEvents: 'none',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '-30px',
                                left: '-30px',
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(var(--primary-color-rgb), 0.08) 0%, transparent 70%)',
                                pointerEvents: 'none',
                            }}
                        />
                        
                        <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.2) 0%, rgba(var(--primary-color-rgb), 0.1) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(var(--primary-color-rgb), 0.3)',
                                    }}
                                >
                                    <RiUploadCloudLine size={32} style={{ color: 'var(--primary-color)' }} />
                                </div>
                                <div>
                                    <Text fw={700} size="32px" style={{ lineHeight: 1.2 }}>
                                        Import Music
                                    </Text>
                                    <Text c="dimmed" size="md" mt="xs">
                                        Upload your audio files to NoisePort server
                                    </Text>
                                </div>
                            </div>
                            
                            <Flex gap="lg" mt="md" style={{ flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RiMusicLine size={18} style={{ color: 'var(--primary-color)', opacity: 0.7 }} />
                                    <Text c="dimmed" size="sm">
                                        Auto-detect metadata from tags
                                    </Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RiUploadCloudLine size={18} style={{ color: 'var(--primary-color)', opacity: 0.7 }} />
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
