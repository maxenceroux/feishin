/**
 * Example data structures for slskd API responses
 * This file demonstrates how search results are structured, both in their
 * flat API format and the hierarchical format for tree views.
 */

import {
    SlskdHierarchicalSearchResult,
    SlskdSearchResponse,
} from './slskd-types';
import { transformSearchResponseToHierarchical } from './slskd-utils';

/**
 * Example flat search response from slskd API
 * This is what the API actually returns
 */
export const exampleFlatSearchResponse: SlskdSearchResponse = {
    username: 'musiclover42',
    fileCount: 8,
    files: [
        {
            filename: 'Music/Rock/The Beatles/Abbey Road/01 Come Together.flac',
            size: 28567234,
            code: 1,
            extension: 'flac',
            bitDepth: 24,
            sampleRate: 96000,
            length: 259,
        },
        {
            filename: 'Music/Rock/The Beatles/Abbey Road/02 Something.flac',
            size: 24893456,
            code: 2,
            extension: 'flac',
            bitDepth: 24,
            sampleRate: 96000,
            length: 182,
        },
        {
            filename: 'Music/Rock/The Beatles/Abbey Road/03 Maxwell\'s Silver Hammer.flac',
            size: 26234789,
            code: 3,
            extension: 'flac',
            bitDepth: 24,
            sampleRate: 96000,
            length: 207,
        },
        {
            filename: 'Music/Rock/Pink Floyd/Dark Side of the Moon/01 Speak to Me.mp3',
            size: 4234567,
            code: 4,
            extension: 'mp3',
            bitRate: 320,
            sampleRate: 44100,
            length: 90,
        },
        {
            filename: 'Music/Rock/Pink Floyd/Dark Side of the Moon/02 Breathe.mp3',
            size: 7234567,
            code: 5,
            extension: 'mp3',
            bitRate: 320,
            sampleRate: 44100,
            length: 163,
        },
        {
            filename: 'Music/Jazz/Miles Davis/Kind of Blue/01 So What.mp3',
            size: 15234567,
            code: 6,
            extension: 'mp3',
            bitRate: 320,
            sampleRate: 44100,
            length: 544,
        },
        {
            filename: 'Music/Jazz/Miles Davis/Kind of Blue/02 Freddie Freeloader.mp3',
            size: 13234567,
            code: 7,
            extension: 'mp3',
            bitRate: 320,
            sampleRate: 44100,
            length: 472,
        },
        {
            filename: 'Music/Jazz/John Coltrane/A Love Supreme/01 Acknowledgement.flac',
            size: 45234567,
            code: 8,
            extension: 'flac',
            bitDepth: 16,
            sampleRate: 44100,
            length: 462,
        },
    ],
    hasFreeUploadSlot: true,
    lockedFileCount: 2,
    lockedFiles: [
        {
            filename: 'Music/Rock/Led Zeppelin/IV/01 Black Dog.flac',
            size: 38234567,
            code: 9,
            extension: 'flac',
            isLocked: true,
            bitDepth: 24,
            sampleRate: 96000,
            length: 295,
        },
        {
            filename: 'Music/Rock/Led Zeppelin/IV/02 Rock and Roll.flac',
            size: 29234567,
            code: 10,
            extension: 'flac',
            isLocked: true,
            bitDepth: 24,
            sampleRate: 96000,
            length: 220,
        },
    ],
    queueLength: 3,
    token: 12345,
    uploadSpeed: 524288, // 512 KB/s in bytes
};

/**
 * Example hierarchical search result
 * This is what you get after transforming the flat response
 */
export const exampleHierarchicalSearchResult: SlskdHierarchicalSearchResult =
    transformSearchResponseToHierarchical(exampleFlatSearchResponse);

/**
 * Manual example showing the hierarchical structure for documentation
 * This shows what the hierarchical result looks like for UI display
 */
export const exampleHierarchicalStructure: SlskdHierarchicalSearchResult = {
    username: 'musiclover42',
    uploadSpeed: 524288,
    hasFreeUploadSlot: true,
    queueLength: 3,
    totalFileCount: 10,
    lockedFileCount: 2,
    token: 12345,
    directories: [
        {
            name: 'Music',
            path: 'Music',
            files: [],
            totalFileCount: 10,
            totalSize: 234134289,
            subdirectories: [
                {
                    name: 'Rock',
                    path: 'Music/Rock',
                    files: [],
                    totalFileCount: 7,
                    totalSize: 154633180,
                    subdirectories: [
                        {
                            name: 'The Beatles',
                            path: 'Music/Rock/The Beatles',
                            files: [],
                            totalFileCount: 3,
                            totalSize: 79695479,
                            subdirectories: [
                                {
                                    name: 'Abbey Road',
                                    path: 'Music/Rock/The Beatles/Abbey Road',
                                    files: [
                                        {
                                            filename:
                                                'Music/Rock/The Beatles/Abbey Road/01 Come Together.flac',
                                            name: '01 Come Together.flac',
                                            size: 28567234,
                                            code: 1,
                                            extension: 'flac',
                                            bitDepth: 24,
                                            sampleRate: 96000,
                                            length: 259,
                                            isLocked: false,
                                        },
                                        {
                                            filename:
                                                'Music/Rock/The Beatles/Abbey Road/02 Something.flac',
                                            name: '02 Something.flac',
                                            size: 24893456,
                                            code: 2,
                                            extension: 'flac',
                                            bitDepth: 24,
                                            sampleRate: 96000,
                                            length: 182,
                                            isLocked: false,
                                        },
                                        {
                                            filename:
                                                "Music/Rock/The Beatles/Abbey Road/03 Maxwell's Silver Hammer.flac",
                                            name: "03 Maxwell's Silver Hammer.flac",
                                            size: 26234789,
                                            code: 3,
                                            extension: 'flac',
                                            bitDepth: 24,
                                            sampleRate: 96000,
                                            length: 207,
                                            isLocked: false,
                                        },
                                    ],
                                    subdirectories: [],
                                    totalFileCount: 3,
                                    totalSize: 79695479,
                                },
                            ],
                        },
                        {
                            name: 'Pink Floyd',
                            path: 'Music/Rock/Pink Floyd',
                            files: [],
                            totalFileCount: 2,
                            totalSize: 11469134,
                            subdirectories: [
                                {
                                    name: 'Dark Side of the Moon',
                                    path: 'Music/Rock/Pink Floyd/Dark Side of the Moon',
                                    files: [
                                        {
                                            filename:
                                                'Music/Rock/Pink Floyd/Dark Side of the Moon/01 Speak to Me.mp3',
                                            name: '01 Speak to Me.mp3',
                                            size: 4234567,
                                            code: 4,
                                            extension: 'mp3',
                                            bitRate: 320,
                                            sampleRate: 44100,
                                            length: 90,
                                            isLocked: false,
                                        },
                                        {
                                            filename:
                                                'Music/Rock/Pink Floyd/Dark Side of the Moon/02 Breathe.mp3',
                                            name: '02 Breathe.mp3',
                                            size: 7234567,
                                            code: 5,
                                            extension: 'mp3',
                                            bitRate: 320,
                                            sampleRate: 44100,
                                            length: 163,
                                            isLocked: false,
                                        },
                                    ],
                                    subdirectories: [],
                                    totalFileCount: 2,
                                    totalSize: 11469134,
                                },
                            ],
                        },
                        {
                            name: 'Led Zeppelin',
                            path: 'Music/Rock/Led Zeppelin',
                            files: [],
                            totalFileCount: 2,
                            totalSize: 67469134,
                            subdirectories: [
                                {
                                    name: 'IV',
                                    path: 'Music/Rock/Led Zeppelin/IV',
                                    files: [
                                        {
                                            filename:
                                                'Music/Rock/Led Zeppelin/IV/01 Black Dog.flac',
                                            name: '01 Black Dog.flac',
                                            size: 38234567,
                                            code: 9,
                                            extension: 'flac',
                                            bitDepth: 24,
                                            sampleRate: 96000,
                                            length: 295,
                                            isLocked: true,
                                        },
                                        {
                                            filename:
                                                'Music/Rock/Led Zeppelin/IV/02 Rock and Roll.flac',
                                            name: '02 Rock and Roll.flac',
                                            size: 29234567,
                                            code: 10,
                                            extension: 'flac',
                                            bitDepth: 24,
                                            sampleRate: 96000,
                                            length: 220,
                                            isLocked: true,
                                        },
                                    ],
                                    subdirectories: [],
                                    totalFileCount: 2,
                                    totalSize: 67469134,
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'Jazz',
                    path: 'Music/Jazz',
                    files: [],
                    totalFileCount: 3,
                    totalSize: 73703701,
                    subdirectories: [
                        {
                            name: 'Miles Davis',
                            path: 'Music/Jazz/Miles Davis',
                            files: [],
                            totalFileCount: 2,
                            totalSize: 28469134,
                            subdirectories: [
                                {
                                    name: 'Kind of Blue',
                                    path: 'Music/Jazz/Miles Davis/Kind of Blue',
                                    files: [
                                        {
                                            filename:
                                                'Music/Jazz/Miles Davis/Kind of Blue/01 So What.mp3',
                                            name: '01 So What.mp3',
                                            size: 15234567,
                                            code: 6,
                                            extension: 'mp3',
                                            bitRate: 320,
                                            sampleRate: 44100,
                                            length: 544,
                                            isLocked: false,
                                        },
                                        {
                                            filename:
                                                'Music/Jazz/Miles Davis/Kind of Blue/02 Freddie Freeloader.mp3',
                                            name: '02 Freddie Freeloader.mp3',
                                            size: 13234567,
                                            code: 7,
                                            extension: 'mp3',
                                            bitRate: 320,
                                            sampleRate: 44100,
                                            length: 472,
                                            isLocked: false,
                                        },
                                    ],
                                    subdirectories: [],
                                    totalFileCount: 2,
                                    totalSize: 28469134,
                                },
                            ],
                        },
                        {
                            name: 'John Coltrane',
                            path: 'Music/Jazz/John Coltrane',
                            files: [],
                            totalFileCount: 1,
                            totalSize: 45234567,
                            subdirectories: [
                                {
                                    name: 'A Love Supreme',
                                    path: 'Music/Jazz/John Coltrane/A Love Supreme',
                                    files: [
                                        {
                                            filename:
                                                'Music/Jazz/John Coltrane/A Love Supreme/01 Acknowledgement.flac',
                                            name: '01 Acknowledgement.flac',
                                            size: 45234567,
                                            code: 8,
                                            extension: 'flac',
                                            bitDepth: 16,
                                            sampleRate: 44100,
                                            length: 462,
                                            isLocked: false,
                                        },
                                    ],
                                    subdirectories: [],
                                    totalFileCount: 1,
                                    totalSize: 45234567,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

/**
 * Example showing how to use the hierarchical structure for downloads
 */
export const exampleDownloadUsage = {
    // Download a single file
    downloadSingleFile: {
        username: 'musiclover42',
        files: [
            {
                filename: 'Music/Rock/The Beatles/Abbey Road/01 Come Together.flac',
                size: 28567234,
                code: 1,
            },
        ],
    },

    // Download an entire directory (all files in that directory and subdirectories)
    downloadDirectory: {
        username: 'musiclover42',
        files: [
            // All files from "Music/Rock/The Beatles/Abbey Road"
            {
                filename: 'Music/Rock/The Beatles/Abbey Road/01 Come Together.flac',
                size: 28567234,
                code: 1,
            },
            {
                filename: 'Music/Rock/The Beatles/Abbey Road/02 Something.flac',
                size: 24893456,
                code: 2,
            },
            {
                filename: "Music/Rock/The Beatles/Abbey Road/03 Maxwell's Silver Hammer.flac",
                size: 26234789,
                code: 3,
            },
        ],
    },

    // Download an entire subdirectory tree
    downloadSubtree: {
        username: 'musiclover42',
        files: [
            // All files from "Music/Jazz" and subdirectories
            {
                filename: 'Music/Jazz/Miles Davis/Kind of Blue/01 So What.mp3',
                size: 15234567,
                code: 6,
            },
            {
                filename: 'Music/Jazz/Miles Davis/Kind of Blue/02 Freddie Freeloader.mp3',
                size: 13234567,
                code: 7,
            },
            {
                filename: 'Music/Jazz/John Coltrane/A Love Supreme/01 Acknowledgement.flac',
                size: 45234567,
                code: 8,
            },
        ],
    },
};
