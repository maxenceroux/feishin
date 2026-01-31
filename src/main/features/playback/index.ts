/**
 * Playback feature initialization
 * Registers MPD IPC handlers
 */

import { initializeMpdHandlers } from './mpd-ipc-handlers';

// Initialize MPD handlers
initializeMpdHandlers();

console.log('[Playback] MPD handlers initialized');
