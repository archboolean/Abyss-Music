"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistRepository = void 0;
class PlaylistRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Получение всех плейлистов
     */
    getAllPlaylists() {
        const stmt = this.db.prepare('SELECT * FROM playlists ORDER BY createdAt DESC');
        const playlists = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            const trackIds = this.getTrackIdsForPlaylist(row.id);
            playlists.push({
                id: row.id,
                name: row.name,
                trackIds,
                createdAt: row.createdAt,
                coverUrl: row.coverUrl || undefined,
            });
        }
        stmt.free();
        return playlists;
    }
    /**
     * Получение плейлиста по ID
     */
    getPlaylistById(id) {
        const stmt = this.db.prepare('SELECT * FROM playlists WHERE id = ?');
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            const trackIds = this.getTrackIdsForPlaylist(id);
            return {
                id: row.id,
                name: row.name,
                trackIds,
                createdAt: row.createdAt,
                coverUrl: row.coverUrl || undefined,
            };
        }
        stmt.free();
        return null;
    }
    /**
     * Получение ID треков для плейлиста
     */
    getTrackIdsForPlaylist(playlistId) {
        const stmt = this.db.prepare('SELECT trackId FROM playlist_tracks WHERE playlistId = ? ORDER BY position');
        stmt.bind([playlistId]);
        const trackIds = [];
        while (stmt.step()) {
            trackIds.push(stmt.getAsObject().trackId);
        }
        stmt.free();
        return trackIds;
    }
    /**
     * Создание нового плейлиста
     */
    createPlaylist(name, coverUrl) {
        const id = `pl-${Date.now()}`;
        const createdAt = Date.now();
        this.db.run('INSERT INTO playlists (id, name, coverUrl, createdAt) VALUES (?, ?, ?, ?)', [id, name, coverUrl || null, createdAt]);
        return { id, name, trackIds: [], createdAt, coverUrl };
    }
    /**
     * Обновление плейлиста
     */
    updatePlaylist(id, name, coverUrl) {
        if (name !== undefined) {
            this.db.run('UPDATE playlists SET name = ? WHERE id = ?', [name, id]);
        }
        if (coverUrl !== undefined) {
            this.db.run('UPDATE playlists SET coverUrl = ? WHERE id = ?', [coverUrl, id]);
        }
    }
    /**
     * Добавление треков в плейлист
     */
    addTracksToPlaylist(playlistId, trackIds) {
        const currentTracks = this.getTrackIdsForPlaylist(playlistId);
        let position = currentTracks.length;
        this.db.run('BEGIN TRANSACTION;');
        try {
            const stmt = this.db.prepare('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)');
            for (const trackId of trackIds) {
                if (!currentTracks.includes(trackId)) {
                    stmt.run([playlistId, trackId, position]);
                    position++;
                }
            }
            stmt.free();
            this.db.run('COMMIT;');
        }
        catch (error) {
            this.db.run('ROLLBACK;');
            throw error;
        }
    }
    /**
     * Удаление трека из плейлиста
     */
    removeTrackFromPlaylist(playlistId, trackId) {
        this.db.run('DELETE FROM playlist_tracks WHERE playlistId = ? AND trackId = ?', [playlistId, trackId]);
    }
    /**
     * Удаление плейлиста
     */
    deletePlaylist(id) {
        this.db.run('DELETE FROM playlists WHERE id = ?', [id]);
    }
}
exports.PlaylistRepository = PlaylistRepository;
