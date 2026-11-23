import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { setupIpcHandlers } from './handlers';

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
      sandbox: true,
    },
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return win;
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
});