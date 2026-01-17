import os from 'os';

function getHeadscaleIp() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && net.address.startsWith('100.') && !net.internal) {
                return net.address;
            }
        }
    }
    return null;
}
import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge } from 'electron';

import { autodiscover } from './autodiscover';
import { browser } from './browser';
import { discordRpc } from './discord-rpc';
import { ipc } from './ipc';
import { localSettings } from './local-settings';
import { lyrics } from './lyrics';
import { mpdPlayer, mpdPlayerListener } from './mpd-player';
import { mpris } from './mpris';
import { mpvPlayer, mpvPlayerListener } from './mpv-player';
import { remote } from './remote';
import { utils } from './utils';

// Custom APIs for renderer
const api = {
    autodiscover,
    browser,
    discordRpc,
    ipc,
    localSettings,
    lyrics,
    mpdPlayer,
    mpdPlayerListener,
    mpris,
    mpvPlayer,
    mpvPlayerListener,
    remote,
    utils,
};

export type PreloadApi = typeof api;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        contextBridge.exposeInMainWorld('api', api);
        contextBridge.exposeInMainWorld('headscale', {
            getIp: () => getHeadscaleIp(),
        });
    } catch (error) {
        console.error(error);
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
}
