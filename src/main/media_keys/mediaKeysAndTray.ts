// src/main/media_keys/mediaKeysAndTray.ts
import { app, BrowserWindow, globalShortcut, Menu, Tray, nativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function registerMediaShortcuts(mainWindow: BrowserWindow): void {
    globalShortcut.register('MediaPlayPause', () => {
        mainWindow.webContents.send('player:command', 'toggle-play');
    });
    globalShortcut.register('MediaNextTrack', () => {
        mainWindow.webContents.send('player:command', 'next');
    });
    globalShortcut.register('MediaPreviousTrack', () => {
        mainWindow.webContents.send('player:command', 'prev');
    });
}

export function createSystemTray(mainWindow: BrowserWindow): Tray | null {
    try {
        const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
        let trayIcon;

        try {
            trayIcon = nativeImage.createFromPath(iconPath);
            if (trayIcon.isEmpty()) {
                // Fallback: create a simple icon programmatically
                trayIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gQWETQ1lU8VAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABcUlEQVRYx+3Wv0tUURTG8c+MGDyIYFBfVCE0qKOnBwpQ1Q9lH7Y0XQeOCP0C8aOO+AQ6CooKFQ0LCyIiYmJiYmFhYWNjQ1NTc3PwfnkGQG5u7vd+O+d+7s7uzm7szMzN7ve++B+73V4EAgHl5eZ3eXl9f7/d7vV6pVKq1sLCwVqvV6/f7X7fb7c0fU1NTz81NTT1GpVKKq6urZ1NTU1+j0ajfT09PzwMDA99HR0f/hISEvwDQ6/XeBwcH+3q9PvsDAwP/BAKBv0AgEO9vNtvT2NjY2N7e3sbhcLh6x44d1bIs6+vr6zIAiIiI2tra+svLy/vz8/Pn6enpTwAOAHz58uV3g8HgP8BqA6PR+I+IiOj4gICA0JycnF8DqC8sLLyQy+UaADQaDfiCIAg3AJgD+H5+fn7g8/l+YDabXwA4AHgD/AN4Hzt27NiPHz/+E8jOzk5nAO8C+H78+PHvqampTwDeAP4H+B+9e/f+Ll269OPMzMxT4D+gZc/27dt3L1q0aAvwK4DnwP7hgw8+ePP69evXgL0BkAeg7e3t/Q0cP3584NPT0zMAAAAASUVORK5CYII=');
            }
        } catch (e) {
            // Fallback: create a simple icon programmatically
            trayIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gQWETQ1lU8VAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABcUlEQVRYx+3Wv0tUURTG8c+MGDyIYFBfVCE0qKOnBwpQ1Q9lH7Y0XQeOCP0C8aOO+AQ6CooKFQ0LCyIiYmJiYmFhYWNjQ1NTc3PwfnkGQG5u7vd+O+d+7s7uzm7szMzN7ve++B+73V4EAgHl5eZ3eXl9f7/d7vV6pVKq1sLCwVqvV6/f7X7fb7c0fU1NTz81NTT1GpVKKq6urZ1NTU1+j0ajfT09PzwMDA99HR0f/hISEvwDQ6/XeBwcH+3q9PvsDAwP/BAKBv0AgEO9vNtvT2NjY2N7e3sbhcLh6x44d1bIs6+vr6zIAiIiI2tra+svLy/vz8/Pn6enpTwAOAHz58uV3g8HgP8BqA6PR+I+IiOj4gICA0JycnF8DqC8sLLyQy+UaADQaDfiCIAg3AJgD+H5+fn7g8/l+YDabXwA4AHgD/AN4Hzt27NiPHz/+E8jOzk5nAO8C+H78+PHvqampTwDeAP4H+B+9e/f+Ll269OPMzMxT4D+gZc/27dt3Llq0aAvwK4DnwP7hgw8+ePP69evXgL0BkAeg7e3t/Q0cP3584NPT0zMAAAAASUVORK5CYII=');
        }

        tray = new Tray(trayIcon);

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Открыть Abyss Music', click: () => mainWindow.show() },
            { type: 'separator' },
            { label: 'Пауза / Воспроизведение', click: () => mainWindow.webContents.send('player:command', 'toggle-play') },
            { label: 'Следующий трек', click: () => mainWindow.webContents.send('player:command', 'next') },
            { label: 'Предыдущий трек', click: () => mainWindow.webContents.send('player:command', 'prev') },
            { type: 'separator' },
            { label: 'Выход', click: () => app.quit() },
        ]);

        tray.setToolTip('Abyss Music');
        tray.setContextMenu(contextMenu);
        tray.on('double-click', () => mainWindow.show());

        return tray;
    } catch (error) {
        console.error('Failed to create system tray:', error);
        return null;
    }
}

export function unregisterMediaShortcuts(): void {
    globalShortcut.unregisterAll();
}