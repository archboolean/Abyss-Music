import { app, dialog, Notification, BrowserWindow } from 'electron';
import { registerIpcHandler } from './ipc';
import { getTrackRepository, getPlaylistRepository, saveDatabase } from './database';
import { scanAudioDirectory } from './scanner';
import { TrackItem } from '../shared_types/models';
import { JamendoService, JamendoTrack } from '../services/jamendo/jamendoClient';
import { LrcLibService } from '../services/lyrics/lrclibClient';

// Initialize Jamendo service with a demo client ID
// In production, this should be stored in environment variables
const JAMENDO_CLIENT_ID = '41d9f8a7';
const jamendoService = new JamendoService(JAMENDO_CLIENT_ID);
const lrcLibService = new LrcLibService();

let mainWindow: BrowserWindow | null = null;

export function setMainWindow(win: BrowserWindow) {
    mainWindow = win;
}

export function showTrackNotification(track: TrackItem) {
    if (!Notification.isSupported()) return;

    const notification = new Notification({
        title: 'Abyss Music',
        body: `${track.artist} - ${track.title}`,
        silent: true,
    });

    notification.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    notification.show();
}

export function setupIpcHandlers(): void {
    registerIpcHandler('app:get-version', () => app.getVersion());

    // Player handlers
    registerIpcHandler('player:play', async (_event, trackId) => {
        if (typeof trackId !== 'string' || !trackId.trim()) {
            throw new Error('Invalid trackId');
        }
        // TODO: вызов Rust audio engine
        return { ok: true };
    });

    registerIpcHandler('player:pause', async () => {
        // TODO: пауза Rust audio engine
    });

    registerIpcHandler('player:set-volume', (_event, volume) => {
        if (typeof volume !== 'number' || volume < 0 || volume > 1) {
            throw new Error('Volume must be between 0 and 1');
        }
        // TODO: передать громкость в Rust
    });

    // Library handlers
    registerIpcHandler('library:get-tracks', async () => {
        const repo = getTrackRepository();
        return repo.getAllTracks();
    });

    registerIpcHandler('library:search-tracks', async (_event, query) => {
        const repo = getTrackRepository();
        return repo.searchTracks(query);
    });

    registerIpcHandler('library:get-favorites', async () => {
        const repo = getTrackRepository();
        return repo.getFavoriteTracks();
    });

    registerIpcHandler('library:toggle-favorite', async (_event, trackId) => {
        const repo = getTrackRepository();
        return repo.toggleFavorite(trackId);
    });

    registerIpcHandler('library:scan-folder', async (event, folderPath) => {
        if (typeof folderPath !== 'string' || !folderPath.trim()) {
            throw new Error('Invalid folder path');
        }

        const repo = getTrackRepository();
        const result = await scanAudioDirectory(folderPath, {
            onProgress: (progress) => {
                event.sender.send('library:scan-progress', progress);
            },
        });

        // Convert scanned tracks to TrackItem format
        const tracks: TrackItem[] = result.tracks.map((t) => ({
            id: t.filePath,
            title: t.title,
            artist: t.artist,
            album: t.album,
            duration: t.durationSeconds,
            filePath: t.filePath,
            coverUrl: t.coverDataUrl,
            bitrate: t.bitrateKbps,
            addedAt: Date.now(),
            sourceType: 'local' as const,
            isFavorite: false,
        }));

        repo.insertTracksBatch(tracks);
        await saveDatabase();

        return { count: tracks.length, skipped: result.skippedFiles.length };
    });

    registerIpcHandler('library:select-folder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    });

    // Playlist handlers
    registerIpcHandler('playlist:get-all', async () => {
        const repo = getPlaylistRepository();
        return repo.getAllPlaylists();
    });

    registerIpcHandler('playlist:create', async (_event, name) => {
        const repo = getPlaylistRepository();
        return repo.createPlaylist(name);
    });

    registerIpcHandler('playlist:add-tracks', async (_event, playlistId, trackIds) => {
        const repo = getPlaylistRepository();
        repo.addTracksToPlaylist(playlistId, trackIds);
        await saveDatabase();
    });

    registerIpcHandler('playlist:remove-track', async (_event, playlistId, trackId) => {
        const repo = getPlaylistRepository();
        repo.removeTrackFromPlaylist(playlistId, trackId);
        await saveDatabase();
    });

    registerIpcHandler('playlist:delete', async (_event, playlistId) => {
        const repo = getPlaylistRepository();
        repo.deletePlaylist(playlistId);
        await saveDatabase();
    });

    // Jamendo API handlers
    registerIpcHandler('jamendo:search', async (_event, query, limit = 20) => {
        if (typeof query !== 'string' || !query.trim()) {
            throw new Error('Invalid search query');
        }
        const tracks = await jamendoService.searchTracks(query, limit);
        return convertJamendoTracks(tracks);
    });

    registerIpcHandler('jamendo:trending', async (_event, limit = 20) => {
        const tracks = await jamendoService.getTrendingTracks(limit);
        return convertJamendoTracks(tracks);
    });

    registerIpcHandler('jamendo:genre', async (_event, genre, limit = 20) => {
        if (typeof genre !== 'string' || !genre.trim()) {
            throw new Error('Invalid genre');
        }
        const tracks = await jamendoService.getTracksByGenre(genre, limit);
        return convertJamendoTracks(tracks);
    });

    // Lyrics handlers
    registerIpcHandler('lyrics:search', async (_event, trackName, artistName, albumName) => {
        if (typeof trackName !== 'string' || !trackName.trim()) {
            throw new Error('Invalid track name');
        }
        if (typeof artistName !== 'string' || !artistName.trim()) {
            throw new Error('Invalid artist name');
        }
        const lyrics = await lrcLibService.searchLyrics(trackName, artistName, albumName);
        return lyrics;
    });

    // Notification handlers
    registerIpcHandler('notification:show', async (_event, track) => {
        showTrackNotification(track);
    });
}

function convertJamendoTracks(jamendoTracks: JamendoTrack[]): TrackItem[] {
    return jamendoTracks.map((track) => ({
        id: `jamendo-${track.id}`,
        title: track.name,
        artist: track.artist_name,
        album: '',
        duration: track.duration,
        filePath: track.audio,
        coverUrl: track.album_image,
        sourceType: 'online' as const,
        isFavorite: false,
    }));
}