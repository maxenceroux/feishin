/**
 * Example usage of the new hierarchical folder tree component
 * 
 * This demonstrates how to use the FolderTree and UserFolderTree components
 * with the transformed hierarchical data from slskd API responses.
 */

import { useQuery } from '@tanstack/react-query';

import { UserFolderTree } from './slskd-folder-tree';

import { slskdApi } from '/@/renderer/api/slskd/slskd-api';
import {
    SlskdHierarchicalDirectory,
    SlskdHierarchicalFile,
} from '/@/renderer/api/slskd/slskd-types';
import {
    getAllFilesInDirectory,
    transformSearchResultsToHierarchical,
} from '/@/renderer/api/slskd/slskd-utils';
import { Table } from '/@/shared/components/table/table';

/**
 * Example component showing how to display hierarchical search results
 */
export const ExampleHierarchicalSearchResults = ({ searchId }: { searchId: string }) => {
    // Fetch search results from API
    const { data } = useQuery({
        queryFn: () => slskdApi.getSearchResults(searchId),
        queryKey: ['slskd', 'search-results', searchId],
    });

    const results = data?.results || [];

    // Transform flat API responses to hierarchical structure
    const hierarchicalResults = transformSearchResultsToHierarchical(results);

    // Handler for downloading a single file
    const handleDownloadFile = async (file: SlskdHierarchicalFile, username: string) => {
        console.log('Downloading file:', file.filename, 'from user:', username);
        
        const files = [
            {
                code: file.code,
                filename: file.filename,
                size: file.size,
            },
        ];
        
        await slskdApi.downloadFile(username, files);
    };

    // Handler for downloading an entire folder (including all subdirectories and files)
    const handleDownloadFolder = async (
        directory: SlskdHierarchicalDirectory,
        username: string,
    ) => {
        console.log('Downloading folder:', directory.name, 'from user:', username);
        
        // Get all files in the directory tree
        const allFiles = getAllFilesInDirectory(directory);
        
        console.log(`Folder contains ${allFiles.length} total files`);
        
        // Prepare files array for API
        const files = allFiles.map((file) => ({
            code: file.code,
            filename: file.filename,
            size: file.size,
        }));
        
        await slskdApi.downloadFile(username, files);
    };

    return (
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>User / Folder / File</Table.Th>
                    <Table.Th>Size / Files</Table.Th>
                    <Table.Th>Quality</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {hierarchicalResults.map((result) => (
                    <UserFolderTree
                        key={result.username}
                        hasFreeUploadSlot={result.hasFreeUploadSlot}
                        onDownloadFile={handleDownloadFile}
                        onDownloadFolder={handleDownloadFolder}
                        queueLength={result.queueLength}
                        rootDirectories={result.directories}
                        totalFileCount={result.totalFileCount}
                        uploadSpeed={result.uploadSpeed}
                        username={result.username}
                    />
                ))}
            </Table.Tbody>
        </Table>
    );
};

/**
 * Example showing the structure of hierarchical data:
 * 
 * hierarchicalResult = {
 *   username: "musiclover42",
 *   uploadSpeed: 524288,
 *   hasFreeUploadSlot: true,
 *   queueLength: 3,
 *   totalFileCount: 10,
 *   lockedFileCount: 2,
 *   token: 12345,
 *   directories: [
 *     {
 *       name: "Music",
 *       path: "Music",
 *       files: [],
 *       subdirectories: [
 *         {
 *           name: "Rock",
 *           path: "Music/Rock",
 *           files: [],
 *           subdirectories: [
 *             {
 *               name: "The Beatles",
 *               path: "Music/Rock/The Beatles",
 *               files: [],
 *               subdirectories: [
 *                 {
 *                   name: "Abbey Road",
 *                   path: "Music/Rock/The Beatles/Abbey Road",
 *                   files: [
 *                     {
 *                       filename: "Music/Rock/The Beatles/Abbey Road/01 Come Together.flac",
 *                       name: "01 Come Together.flac",
 *                       size: 28567234,
 *                       code: 1,
 *                       extension: "flac",
 *                       bitDepth: 24,
 *                       sampleRate: 96000,
 *                       length: 259,
 *                       isLocked: false
 *                     }
 *                   ],
 *                   subdirectories: [],
 *                   totalFileCount: 3,
 *                   totalSize: 79695479
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
