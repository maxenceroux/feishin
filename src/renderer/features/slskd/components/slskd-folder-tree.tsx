import { useState } from 'react';

import {
    SlskdHierarchicalDirectory,
    SlskdHierarchicalFile,
} from '/@/renderer/api/slskd/slskd-types';
import {
    formatBitRate,
    formatDuration,
    formatFileSize,
    formatSampleRate,
    getAllFilesInDirectory,
} from '/@/renderer/api/slskd/slskd-utils';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';

interface FolderTreeProps {
    directory: SlskdHierarchicalDirectory;
    level?: number;
    onDownloadFile: (file: SlskdHierarchicalFile) => void;
    onDownloadFolder: (directory: SlskdHierarchicalDirectory) => void;
    username: string;
}

export const FolderTree = ({
    directory,
    level = 0,
    onDownloadFile,
    onDownloadFolder,
}: FolderTreeProps) => {
    const [isExpanded, setIsExpanded] = useState(level === 0);
    const paddingLeft = level * 2;

    const hasContent = directory.files.length > 0 || directory.subdirectories.length > 0;

    return (
        <>
            {/* Folder row */}
            <Table.Tr
                key={`dir-${directory.path}`}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    backgroundColor:
                        level % 2 === 0 ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-dark-6)',
                    cursor: hasContent ? 'pointer' : 'default',
                }}
            >
                <Table.Td style={{ paddingLeft: `${paddingLeft + 1}rem` }}>
                    <Group gap="xs">
                        {hasContent && (
                            <Icon
                                icon={isExpanded ? 'arrowDownS' : 'arrowRightS'}
                                size="1rem"
                            />
                        )}
                        {!hasContent && <div style={{ width: '1rem' }} />}
                        <Icon color="yellow" icon="folder" size="1.2rem" />
                        <Text fw={500}>{directory.name}</Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Badge size="sm" variant="light">
                            {directory.totalFileCount} files
                        </Badge>
                        <Text opacity={0.7} size="sm">
                            {formatFileSize(directory.totalSize)}
                        </Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text opacity={0.5} size="sm">
                        -
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Text opacity={0.5} size="sm">
                        -
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Text opacity={0.5} size="sm">
                        -
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownloadFolder(directory);
                        }}
                        size="xs"
                        variant="light"
                    >
                        <Icon icon="download" size="0.9rem" />
                        <span style={{ marginLeft: '0.5rem' }}>Folder</span>
                    </Button>
                </Table.Td>
            </Table.Tr>

            {/* Expanded content: subdirectories and files */}
            {isExpanded && (
                <>
                    {/* Subdirectories */}
                    {directory.subdirectories.map((subdir) => (
                        <FolderTree
                            key={subdir.path}
                            directory={subdir}
                            level={level + 1}
                            onDownloadFile={onDownloadFile}
                            onDownloadFolder={onDownloadFolder}
                            username=""
                        />
                    ))}

                    {/* Files in this directory */}
                    {directory.files.map((file) => (
                        <Table.Tr
                            key={`${directory.path}-${file.filename}`}
                            style={{
                                backgroundColor:
                                    level % 2 === 0
                                        ? 'var(--mantine-color-dark-8)'
                                        : 'var(--mantine-color-dark-7)',
                            }}
                        >
                            <Table.Td style={{ paddingLeft: `${paddingLeft + 3}rem` }}>
                                <Group gap="xs">
                                    <Icon
                                        color={file.isLocked ? 'red' : 'blue'}
                                        icon={file.isLocked ? 'lock' : 'musicNote'}
                                        size="1rem"
                                    />
                                    <Stack gap={0}>
                                        <Text fw={400} size="sm">
                                            {file.name}
                                        </Text>
                                        {file.isLocked && (
                                            <Badge color="red" size="xs">
                                                Locked
                                            </Badge>
                                        )}
                                    </Stack>
                                </Group>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">{formatFileSize(file.size)}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">
                                    {formatBitRate(file.bitRate) || formatSampleRate(file.sampleRate) || '-'}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">{formatDuration(file.length)}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    {file.extension && (
                                        <Badge size="xs" variant="outline">
                                            {file.extension.toUpperCase()}
                                        </Badge>
                                    )}
                                    {file.bitDepth && (
                                        <Badge size="xs" variant="dot">
                                            {file.bitDepth}bit
                                        </Badge>
                                    )}
                                </Group>
                            </Table.Td>
                            <Table.Td>
                                <Button
                                    disabled={file.isLocked}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDownloadFile(file);
                                    }}
                                    size="xs"
                                    variant="filled"
                                >
                                    <Icon icon="download" size="0.9rem" />
                                </Button>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </>
            )}
        </>
    );
};

interface UserFolderTreeProps {
    hasFreeUploadSlot: boolean;
    onDownloadFile: (file: SlskdHierarchicalFile, username: string) => void;
    onDownloadFolder: (directory: SlskdHierarchicalDirectory, username: string) => void;
    queueLength: number;
    rootDirectories: SlskdHierarchicalDirectory[];
    totalFileCount: number;
    uploadSpeed: number;
    username: string;
}

export const UserFolderTree = ({
    hasFreeUploadSlot,
    onDownloadFile,
    onDownloadFolder,
    queueLength,
    rootDirectories,
    totalFileCount,
    uploadSpeed,
    username,
}: UserFolderTreeProps) => {
    const [isUserExpanded, setIsUserExpanded] = useState(true);

    const handleDownloadFile = (file: SlskdHierarchicalFile) => {
        onDownloadFile(file, username);
    };

    const handleDownloadFolder = (directory: SlskdHierarchicalDirectory) => {
        onDownloadFolder(directory, username);
    };

    const handleDownloadAllUserFiles = () => {
        // Download all files from all root directories
        rootDirectories.forEach((dir) => {
            onDownloadFolder(dir, username);
        });
    };

    return (
        <>
            {/* User header row */}
            <Table.Tr
                onClick={() => setIsUserExpanded(!isUserExpanded)}
                style={{
                    backgroundColor: 'var(--mantine-color-dark-5)',
                    cursor: 'pointer',
                    fontWeight: 600,
                }}
            >
                <Table.Td>
                    <Group gap="xs">
                        <Icon icon={isUserExpanded ? 'arrowDownS' : 'arrowRightS'} size="1.2rem" />
                        <Icon color="green" icon="user" size="1.2rem" />
                        <Text fw={700} size="md">
                            {username}
                        </Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text fw={600} size="sm">
                        {totalFileCount} files
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Text size="sm">
                        {uploadSpeed ? `${Math.round(uploadSpeed / 1024)} KB/s` : '-'}
                    </Text>
                </Table.Td>
                <Table.Td colSpan={2}>
                    <Group gap="xs">
                        {hasFreeUploadSlot && (
                            <Badge color="green" size="sm">
                                Free slot
                            </Badge>
                        )}
                        {queueLength > 0 && (
                            <Badge size="sm" variant="light">
                                Queue: {queueLength}
                            </Badge>
                        )}
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAllUserFiles();
                        }}
                        size="xs"
                        variant="gradient"
                    >
                        <Icon icon="download" size="1rem" />
                        <span style={{ marginLeft: '0.5rem' }}>All Files</span>
                    </Button>
                </Table.Td>
            </Table.Tr>

            {/* Expanded: Show folder tree */}
            {isUserExpanded &&
                rootDirectories.map((directory) => (
                    <FolderTree
                        key={directory.path}
                        directory={directory}
                        level={1}
                        onDownloadFile={handleDownloadFile}
                        onDownloadFolder={handleDownloadFolder}
                        username={username}
                    />
                ))}
        </>
    );
};
