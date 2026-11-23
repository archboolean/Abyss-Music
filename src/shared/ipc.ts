// Каналы формата Request -> Response (ipcRenderer.invoke / ipcMain.handle)
export interface IpcInvokeMap {
    'app:get-version': { args: []; result: string };
    'player:play': { args: [trackId: string]; result: { ok: boolean } };
    'player:pause': { args: []; result: void };
    'player:set-volume': { args: [volume: number]; result: void };
    'library:scan-folder': { args: [path: string]; result: { count: number } };
}

// Каналы формата Main -> Renderer (события от бэкенда/Rust к UI)
export interface IpcEventMap {
    'player:state-changed': { isPlaying: boolean; trackId: string | null; positionSec: number };
    'library:scan-progress': { current: number; total: number };
}

export type InvokeChannel = keyof IpcInvokeMap;
export type EventChannel = keyof IpcEventMap;

// Белые списки для рантайм-валидации
export const VALID_INVOKE_CHANNELS: readonly InvokeChannel[] = [
    'app:get-version',
    'player:play',
    'player:pause',
    'player:set-volume',
    'library:scan-folder',
] as const;

export const VALID_EVENT_CHANNELS: readonly EventChannel[] = [
    'player:state-changed',
    'library:scan-progress',
] as const;

export function isValidInvokeChannel(channel: string): channel is InvokeChannel {
    return (VALID_INVOKE_CHANNELS as readonly string[]).includes(channel);
}

export function isValidEventChannel(channel: string): channel is EventChannel {
    return (VALID_EVENT_CHANNELS as readonly string[]).includes(channel);
}