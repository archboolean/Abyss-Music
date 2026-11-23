import { ipcMain, dialog } from 'electron';
import { scanAudioDirectory } from '../scanner';

export function registerScannerIpcHandlers(): void {
    ipcMain.handle('scanner:select-and-scan-folder', async (event) => {
        const dialogResult = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });

        if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
            return null;
        }

        const selectedFolderPath = dialogResult.filePaths[0];

        return scanAudioDirectory(selectedFolderPath, {
            onProgress: (progress) => {
                // Отправляем прогресс обратно в окно рендерера
                event.sender.send('scanner:progress', progress);
            },
        });
    });
}