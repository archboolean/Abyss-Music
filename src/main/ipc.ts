import { ipcMain, BrowserWindow, IpcMainInvokeEvent } from 'electron';
import {
    IpcInvokeMap,
    IpcEventMap,
    InvokeChannel,
    EventChannel,
    isValidInvokeChannel,
} from '../shared/ipc';

type Handler<C extends InvokeChannel> = (
    event: IpcMainInvokeEvent,
    ...args: IpcInvokeMap[C]['args']
) => Promise<IpcInvokeMap[C]['result']> | IpcInvokeMap[C]['result'];

export function registerIpcHandler<C extends InvokeChannel>(
    channel: C,
    handler: Handler<C>
): void {
    if (!isValidInvokeChannel(channel)) {
        throw new Error(`Attempted to register invalid IPC channel: ${channel}`);
    }

    ipcMain.handle(channel, async (event, ...args) => {
        // Дополнительная защита: принимаем запросы только от главного фрейма
        if (event.senderFrame !== event.sender.mainFrame) {
            throw new Error('Unauthorized IPC call from non-main frame');
        }
        return handler(event, ...(args as IpcInvokeMap[C]['args']));
    });
}

export function sendToRenderer<C extends EventChannel>(
    win: BrowserWindow,
    channel: C,
    payload: IpcEventMap[C]
): void {
    if (!win.isDestroyed()) {
        win.webContents.send(channel, payload);
    }
}