import { app } from 'electron';
import { registerIpcHandler } from './ipc';

export function setupIpcHandlers(): void {
    registerIpcHandler('app:get-version', () => app.getVersion());

    registerIpcHandler('player:play', async (_event, trackId) => {
        if (typeof trackId !== 'string' || !trackId.trim()) {
            throw new Error('Invalid trackId');
        }
        // TODO: вызов Rust audio engine
        return { ok: true };
    });

    registerIpcHandler('player:set-volume', (_event, volume) => {
        if (typeof volume !== 'number' || volume < 0 || volume > 1) {
            throw new Error('Volume must be between 0 and 1');
        }
        // TODO: передать громкость в Rust
    });
}