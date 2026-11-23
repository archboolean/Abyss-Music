// Каналы формата Request -> Response (ipcRenderer.invoke / ipcMain.handle)
export interface IpcInvokeMap {
    'app:get-version': { args: []; result: string };
    'player:play': { args: [trackId: string]; result: { ok: boolean } };
    'player:pause': { args: []; result: void };
    'player:set-volume': { args: [volume: number]; result: void };
    'library:get-tracks': { args: []; result: any[] };
    'library:search-tracks': { args: [query: string]; result: any[] };
    'library:get-favorites': { args: []; result: any[] };
    'library:toggle-favorite': { args: [trackId: string]; result: boolean };
    'library:scan-folder': { args: [path: string]; result: { count: number; skipped: number } };
    'library:select-folder': { args: []; result: string | null };
    'playlist:get-all': { args: []; result: any[] };
    'playlist:create': { args: [name: string]; result: any };
    'playlist:add-tracks': { args: [playlistId: string, trackIds: string[]]; result: void };
    'playlist:remove-track': { args: [playlistId: string, trackId: string]; result: void };
    'playlist:delete': { args: [playlistId: string]; result: void };
    'jamendo:search': { args: [query: string, limit?: number]; result: any[] };
    'jamendo:trending': { args: [limit?: number]; result: any[] };
    'jamendo:genre': { args: [genre: string, limit?: number]; result: any[] };
    'lyrics:search': { args: [trackName: string, artistName: string, albumName?: string]; result: any[] | null };
    'notification:show': { args: [track: any]; result: void };
}

// Каналы формата Main -> Renderer (события от бэкенда/Rust к UI)
export interface IpcEventMap {
    'player:state-changed': { isPlaying: boolean; trackId: string | null; positionSec: number };
    'library:scan-progress': { current: number; total: number };
    'player:command': string;
}

export type InvokeChannel = keyof IpcInvokeMap;
export type EventChannel = keyof IpcEventMap;

// Белые списки для рантайм-валидации
export const VALID_INVOKE_CHANNELS: readonly InvokeChannel[] = [
    'app:get-version',
    'player:play',
    'player:pause',
    'player:set-volume',
    'library:get-tracks',
    'library:search-tracks',
    'library:get-favorites',
    'library:toggle-favorite',
    'library:scan-folder',
    'library:select-folder',
    'playlist:get-all',
    'playlist:create',
    'playlist:add-tracks',
    'playlist:remove-track',
    'playlist:delete',
    'jamendo:search',
    'jamendo:trending',
    'jamendo:genre',
    'lyrics:search',
    'notification:show',
] as const;

export const VALID_EVENT_CHANNELS: readonly EventChannel[] = [
    'player:state-changed',
    'library:scan-progress',
    'player:command',
] as const;

export function isValidInvokeChannel(channel: string): channel is InvokeChannel {
    return (VALID_INVOKE_CHANNELS as readonly string[]).includes(channel);
}

export function isValidEventChannel(channel: string): channel is EventChannel {
    return (VALID_EVENT_CHANNELS as readonly string[]).includes(channel);
}