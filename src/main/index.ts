import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { setupIpcHandlers } from './handlers';
import {registerScannerIpcHandlers} from "./scanner/scanner_handlers";

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true, // обязательно для contextBridge
            nodeIntegration: false, // запрещаем Node.js в React
            sandbox: true,          // изолируем процесс рендерера
        },
    });

    return win;
}

app.whenReady().then(() => {
    registerScannerIpcHandlers()
    setupIpcHandlers();
    createWindow();
});