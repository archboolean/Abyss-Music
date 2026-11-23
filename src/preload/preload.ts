import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
    IpcInvokeMap,
    IpcEventMap,
    InvokeChannel,
    EventChannel,
    isValidInvokeChannel,
    isValidEventChannel,
} from '../shared/ipc';

export const abyssApi = {
    invoke<C extends InvokeChannel>(
        channel: C,
        ...args: IpcInvokeMap[C]['args']
    ): Promise<IpcInvokeMap[C]['result']> {
        if (!isValidInvokeChannel(channel)) {
            return Promise.reject(new Error(`Blocked unauthorized IPC invoke channel: ${channel}`));
        }
        return ipcRenderer.invoke(channel, ...args);
    },

    on<C extends EventChannel>(
        channel: C,
        listener: (payload: IpcEventMap[C]) => void
    ): () => void {
        if (!isValidEventChannel(channel)) {
            throw new Error(`Blocked unauthorized IPC event channel: ${channel}`);
        }

        const wrapped = (_event: IpcRendererEvent, payload: IpcEventMap[C]) => {
            listener(payload);
        };

        ipcRenderer.on(channel, wrapped);

        // Возвращаем функцию отписки, чтобы в React не было утечек памяти в useEffect
        return () => {
            ipcRenderer.removeListener(channel, wrapped);
        };
    },
};

export type AbyssApi = typeof abyssApi;

contextBridge.exposeInMainWorld('abyssApi', abyssApi);