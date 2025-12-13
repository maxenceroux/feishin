import { useRef, useState } from 'react';
import { RiUpload2Line, RiCloseLine, RiFileMusicLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';

import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Paper } from '/@/shared/components/paper/paper';
import { Divider } from '/@/shared/components/divider/divider';
import { useNoisePortSettings } from '/@/renderer/store/settings.store';

interface UploadedFile {
    file: File;
    id: string;
}

interface UploadResponse {
    success: boolean;
    message: string;
    task_id?: string;
    files_processed?: number;
    album_path?: string | null;
    detected_metadata?: {
        artist: string;
        album: string;
        source: 'tags' | 'user_provided';
    };
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

const ACCEPTED_FORMATS = ['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.wav'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export const AlbumUploader = () => {
    const noiseportSettings = useNoisePortSettings();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<UploadResponse | null>(null);
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [username, setUsername] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const validateFile = (file: File): string | null => {
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!ACCEPTED_FORMATS.includes(extension)) {
            return `Invalid file type: ${file.name}. Accepted formats: ${ACCEPTED_FORMATS.join(', ')}`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large: ${file.name} (${formatFileSize(file.size)}). Max size: 500MB`;
        }
        return null;
    };

    const validateTotalSize = (fileList: File[]): string | null => {
        const totalSize = fileList.reduce((sum, f) => sum + f.size, 0);
        if (totalSize > MAX_TOTAL_SIZE) {
            return `Total size too large: ${formatFileSize(totalSize)}. Max total size: 2GB`;
        }
        return null;
    };

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const newFiles: File[] = Array.from(fileList);
        
        // Validate each file
        for (const file of newFiles) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        // Validate total size
        const allFiles = [...files.map(f => f.file), ...newFiles];
        const totalSizeError = validateTotalSize(allFiles);
        if (totalSizeError) {
            setError(totalSizeError);
            return;
        }

        // Add files
        const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
            file,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
        }));

        setFiles((prev) => [...prev, ...uploadedFiles]);
        setError(null);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setError(null);
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError('Please select at least one audio file');
            return;
        }

        if (!noiseportSettings.serverIp) {
            setError('Please configure NoisePort server IP in settings first');
            return;
        }

        setUploadStatus('uploading');
        setUploadProgress(0);
        setError(null);
        setResponse(null);

        const formData = new FormData();
        formData.append('vpn_ip', '100.64.0.2'); // Default VPN IP
        
        // Add optional overrides if provided
        if (artist.trim()) formData.append('artist', artist.trim());
        if (album.trim()) formData.append('album', album.trim());
        if (username.trim()) formData.append('username', username.trim());

        // Add all files
        files.forEach((f) => {
            formData.append('files', f.file);
        });

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const data: UploadResponse = JSON.parse(xhr.responseText);
                        setResponse(data);
                        if (data.success) {
                            setUploadStatus('complete');
                            // Reset form
                            setFiles([]);
                            setArtist('');
                            setAlbum('');
                            setUsername('');
                        } else {
                            setUploadStatus('error');
                            setError(data.message || 'Upload failed');
                        }
                    } catch (err) {
                        setUploadStatus('error');
                        setError('Failed to parse server response');
                    }
                } else {
                    setUploadStatus('error');
                    setError(`Upload failed: ${xhr.status} ${xhr.statusText}`);
                }
            });

            xhr.addEventListener('error', () => {
                setUploadStatus('error');
                setError('Network error occurred during upload');
            });

            xhr.addEventListener('abort', () => {
                setUploadStatus('error');
                setError('Upload was aborted');
            });

            xhr.open('POST', `http://${noiseportSettings.serverIp}:8010/api/v1/uploads/upload`);
            xhr.send(formData);
        } catch (err) {
            setUploadStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
    };

    const resetUpload = () => {
        setUploadStatus('idle');
        setUploadProgress(0);
        setError(null);
        setResponse(null);
    };

    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

    return (
        <Stack gap="xl">
            {/* Server Status Banner */}
            {!noiseportSettings.serverIp && (
                <Paper
                    p="md"
                    style={{
                        backgroundColor: 'rgba(250, 176, 5, 0.1)',
                        border: '1px solid rgba(250, 176, 5, 0.3)',
                    }}
                >
                    <Group align="center" gap="sm">
                        <RiErrorWarningLine size={20} style={{ color: 'rgb(250, 176, 5)' }} />
                        <div>
                            <Text fw={500} size="sm">
                                NoisePort Server Not Configured
                            </Text>
                            <Text c="dimmed" size="xs">
                                Please configure your server IP in Settings → NoisePort Server to enable uploads
                            </Text>
                        </div>
                    </Group>
                </Paper>
            )}

            {/* Drag & Drop Zone */}
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    cursor: 'pointer',
                }}
            >
                <Paper
                    p="3rem"
                    style={{
                        border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'}`,
                        backgroundColor: isDragging ? 'rgba(var(--primary-color-rgb), 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.2s ease',
                        borderRadius: '12px',
                    }}
                >
                    <Stack align="center" gap="lg">
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: isDragging ? 'rgba(var(--primary-color-rgb), 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <RiUpload2Line
                                size={40}
                                style={{
                                    color: isDragging ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.4)',
                                    transition: 'all 0.2s ease',
                                }}
                            />
                        </div>
                        <div>
                            <Text fw={600} size="lg" ta="center">
                                Drop your music files here
                            </Text>
                            <Text c="dimmed" size="sm" ta="center" mt="xs">
                                or click to browse your computer
                            </Text>
                        </div>
                        <Group gap="xs" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                            {ACCEPTED_FORMATS.map((format) => (
                                <Paper
                                    key={format}
                                    p="xs"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                    }}
                                >
                                    <Text c="dimmed" size="xs" fw={500}>
                                        {format.toUpperCase()}
                                    </Text>
                                </Paper>
                            ))}
                        </Group>
                        <Text c="dimmed" size="xs" ta="center">
                            Max: 500MB per file • 2GB total
                        </Text>
                    </Stack>
                </Paper>
                <input
                    ref={fileInputRef}
                    accept={ACCEPTED_FORMATS.join(',')}
                    multiple
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                    type="file"
                />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
                <Paper
                    p="lg"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                    }}
                >
                    <Stack gap="md">
                        <Group align="center" justify="space-between">
                            <div>
                                <Text fw={600} size="md">
                                    Selected Files
                                </Text>
                                <Text c="dimmed" size="xs">
                                    {files.length} file{files.length > 1 ? 's' : ''} • {formatFileSize(totalSize)}
                                </Text>
                            </div>
                            <Button
                                onClick={() => setFiles([])}
                                size="xs"
                                variant="subtle"
                            >
                                Clear All
                            </Button>
                        </Group>
                        <Divider />
                        <Stack gap="xs" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {files.map((f, index) => (
                                <Paper
                                    key={f.id}
                                    p="sm"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <Group align="center" justify="space-between">
                                        <Group align="center" gap="sm">
                                            <div
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <RiFileMusicLine size={16} style={{ color: 'var(--primary-color)' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text size="sm" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {index + 1}. {f.file.name}
                                                </Text>
                                                <Text c="dimmed" size="xs">
                                                    {formatFileSize(f.file.size)}
                                                </Text>
                                            </div>
                                        </Group>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(f.id);
                                            }}
                                            size="xs"
                                            variant="subtle"
                                            style={{ flexShrink: 0 }}
                                        >
                                            <RiCloseLine size={18} />
                                        </Button>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Stack>
                </Paper>
            )}

            {/* Optional Overrides */}
            {files.length > 0 && uploadStatus === 'idle' && (
                <Paper
                    p="lg"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                    }}
                >
                    <Stack gap="md">
                        <div>
                            <Text fw={600} size="md">
                                Metadata Overrides
                            </Text>
                            <Text c="dimmed" size="xs">
                                Only fill these if your files are missing ID3 tags
                            </Text>
                        </div>
                        <Divider />
                        <Group grow>
                            <TextInput
                                description="Leave blank to auto-detect"
                                label="Artist"
                                onChange={(e) => setArtist(e.currentTarget.value)}
                                placeholder="e.g., Pink Floyd"
                                size="sm"
                                value={artist}
                            />
                            <TextInput
                                description="Leave blank to auto-detect"
                                label="Album"
                                onChange={(e) => setAlbum(e.currentTarget.value)}
                                placeholder="e.g., The Dark Side of the Moon"
                                size="sm"
                                value={album}
                            />
                        </Group>
                        <TextInput
                            description="Optional"
                            label="Username"
                            onChange={(e) => setUsername(e.currentTarget.value)}
                            placeholder="Your username (optional)"
                            size="sm"
                            value={username}
                        />
                    </Stack>
                </Paper>
            )}

            {/* Upload Progress */}
            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                <Paper
                    p="lg"
                    style={{
                        backgroundColor: 'rgba(var(--primary-color-rgb), 0.05)',
                        border: '1px solid rgba(var(--primary-color-rgb), 0.2)',
                        borderRadius: '12px',
                    }}
                >
                    <Stack gap="md">
                        <Group align="center" justify="space-between">
                            <div>
                                <Text fw={600} size="md">
                                    {uploadStatus === 'uploading' ? 'Uploading Files...' : 'Processing Upload...'}
                                </Text>
                                <Text c="dimmed" size="xs">
                                    Please wait while we process your music
                                </Text>
                            </div>
                            <Text fw={700} size="xl" style={{ color: 'var(--primary-color)' }}>
                                {uploadProgress.toFixed(0)}%
                            </Text>
                        </Group>
                        <div
                            style={{
                                width: '100%',
                                height: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    width: `${uploadProgress}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--primary-color), rgba(var(--primary-color-rgb), 0.7))',
                                    transition: 'width 0.3s ease',
                                    borderRadius: '6px',
                                }}
                            />
                        </div>
                    </Stack>
                </Paper>
            )}

            {/* Success Response */}
            {uploadStatus === 'complete' && response && (
                <Paper
                    p="lg"
                    style={{
                        backgroundColor: 'rgba(46, 213, 115, 0.1)',
                        border: '1px solid rgba(46, 213, 115, 0.3)',
                        borderRadius: '12px',
                    }}
                >
                    <Stack gap="md">
                        <Group align="center" gap="md">
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(46, 213, 115, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <RiCheckLine size={28} style={{ color: 'rgb(46, 213, 115)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text fw={600} size="lg" style={{ color: 'rgb(46, 213, 115)' }}>
                                    Upload Complete!
                                </Text>
                                <Text c="dimmed" size="sm">
                                    {response.message}
                                </Text>
                            </div>
                        </Group>
                        <Divider />
                        <Stack gap="sm">
                            {response.task_id && (
                                <Group gap="xs">
                                    <Text c="dimmed" size="xs" fw={500}>Task ID:</Text>
                                    <Text size="xs" style={{ fontFamily: 'monospace' }}>{response.task_id}</Text>
                                </Group>
                            )}
                            {response.files_processed && (
                                <Group gap="xs">
                                    <Text c="dimmed" size="xs" fw={500}>Files Processed:</Text>
                                    <Text size="xs">{response.files_processed}</Text>
                                </Group>
                            )}
                            {response.album_path && (
                                <Group gap="xs">
                                    <Text c="dimmed" size="xs" fw={500}>Album Path:</Text>
                                    <Text size="xs" style={{ fontFamily: 'monospace' }}>{response.album_path}</Text>
                                </Group>
                            )}
                            {response.detected_metadata && (
                                <div>
                                    <Text fw={500} size="sm" mb="xs">
                                        Detected Metadata:
                                    </Text>
                                    <Paper
                                        p="sm"
                                        style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <Stack gap="xs">
                                            <Group gap="xs">
                                                <Text c="dimmed" size="xs" fw={500}>Artist:</Text>
                                                <Text size="xs">{response.detected_metadata.artist}</Text>
                                            </Group>
                                            <Group gap="xs">
                                                <Text c="dimmed" size="xs" fw={500}>Album:</Text>
                                                <Text size="xs">{response.detected_metadata.album}</Text>
                                            </Group>
                                            <Group gap="xs">
                                                <Text c="dimmed" size="xs" fw={500}>Source:</Text>
                                                <Text size="xs" style={{ textTransform: 'capitalize' }}>{response.detected_metadata.source}</Text>
                                            </Group>
                                        </Stack>
                                    </Paper>
                                </div>
                            )}
                        </Stack>
                        <Button onClick={resetUpload} size="md" fullWidth>
                            Upload Another Album
                        </Button>
                    </Stack>
                </Paper>
            )}

            {/* Error Message */}
            {error && (
                <Paper
                    p="lg"
                    style={{
                        backgroundColor: 'rgba(235, 77, 75, 0.1)',
                        border: '1px solid rgba(235, 77, 75, 0.3)',
                        borderRadius: '12px',
                    }}
                >
                    <Stack gap="md">
                        <Group align="center" gap="md">
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(235, 77, 75, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <RiErrorWarningLine size={28} style={{ color: 'rgb(235, 77, 75)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text fw={600} size="lg" style={{ color: 'rgb(235, 77, 75)' }}>
                                    Upload Failed
                                </Text>
                                <Text c="dimmed" size="sm">
                                    {error}
                                </Text>
                            </div>
                        </Group>
                        {uploadStatus === 'error' && (
                            <>
                                <Divider />
                                <Button onClick={resetUpload} size="md" fullWidth variant="outline">
                                    Try Again
                                </Button>
                            </>
                        )}
                    </Stack>
                </Paper>
            )}

            {/* Upload Button */}
            {files.length > 0 && uploadStatus === 'idle' && (
                <Button
                    disabled={!noiseportSettings.serverIp}
                    leftSection={<RiUpload2Line size={20} />}
                    onClick={handleUpload}
                    size="lg"
                    fullWidth
                    style={{
                        height: '50px',
                        fontSize: '16px',
                        fontWeight: 600,
                    }}
                >
                    Upload {files.length} file{files.length > 1 ? 's' : ''}
                </Button>
            )}
        </Stack>
    );
};
