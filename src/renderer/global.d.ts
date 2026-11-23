/// <reference types="vite/client" />
import type { AbyssApi } from '../preload/preload';

declare global {
    interface Window {
        abyssApi: AbyssApi & {
            onPlayerCommand: (listener: (command: string) => void) => () => void;
        };
    }
}

export {};