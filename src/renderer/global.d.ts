import type { AbyssApi } from '../preload/preload';

declare global {
    interface Window {
        abyssApi: AbyssApi;
    }
}

export {};