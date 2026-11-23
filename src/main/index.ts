import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { setupIpcHandlers, setMainWindow } from './handlers';
import { initializeDatabase, closeDatabase } from './database';
import { registerMediaShortcuts, createSystemTray, unregisterMediaShortcuts } from './media_keys/mediaKeysAndTray';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#111113',
    autoHideMenuBar: true, // скрывает верхнее меню File/Edit/View
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5175');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow = win;
  setMainWindow(win);
  return win;
}

app.whenReady().then(async () => {
  await initializeDatabase();
  setupIpcHandlers();
  const win = createWindow();

  // Register media keys and system tray
  registerMediaShortcuts(win);
  createSystemTray(win);
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    unregisterMediaShortcuts();
    await closeDatabase();
    app.quit();
  }
});

app.on('before-quit', async () => {
  unregisterMediaShortcuts();
  await closeDatabase();
});