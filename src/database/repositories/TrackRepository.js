"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackRepository = void 0;
class TrackRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Получение всех треков из базы данных
     */
    getAllTracks() {
        const stmt = this.db.prepare('SELECT * FROM tracks ORDER BY addedAt DESC');
        const tracks = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            tracks.push({
                id: row.id,
                title: row.title,
                artist: row.artist,
                album: row.album || undefined,
                duration: row.duration,
                filePath: row.filePath,
                coverUrl: row.coverUrl || undefined,
                bitrate: row.bitrate || undefined,
                addedAt: row.addedAt,
                sourceType: row.sourceType || 'local',
                isFavorite: row.isFavorite === 1,
            });
        }
        stmt.free();
        return tracks;
    }
    /**
     * Получение трека по ID
     */
    getTrackById(id) {
        const stmt = this.db.prepare('SELECT * FROM tracks WHERE id = ?');
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return {
                id: row.id,
                title: row.title,
                artist: row.artist,
                album: row.album || undefined,
                duration: row.duration,
                filePath: row.filePath,
                coverUrl: row.coverUrl || undefined,
                bitrate: row.bitrate || undefined,
                addedAt: row.addedAt,
                sourceType: row.sourceType || 'local',
                isFavorite: row.isFavorite === 1,
            };
        }
        stmt.free();
        return null;
    }
    /**
     * Поиск треков по запросу
     */
    searchTracks(query) {
        const stmt = this.db.prepare(`
            SELECT * FROM tracks
            WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
            ORDER BY addedAt DESC
        `);
        const searchPattern = `%${query}%`;
        stmt.bind([searchPattern, searchPattern, searchPattern]);
        const tracks = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            tracks.push({
                id: row.id,
                title: row.title,
                artist: row.artist,
                album: row.album || undefined,
                duration: row.duration,
                filePath: row.filePath,
                coverUrl: row.coverUrl || undefined,
                bitrate: row.bitrate || undefined,
                addedAt: row.addedAt,
                sourceType: row.sourceType || 'local',
                isFavorite: row.isFavorite === 1,
            });
        }
        stmt.free();
        return tracks;
    }
    /**
     * Получение избранных треков
     */
    getFavoriteTracks() {
        const stmt = this.db.prepare('SELECT * FROM tracks WHERE isFavorite = 1 ORDER BY addedAt DESC');
        const tracks = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            tracks.push({
                id: row.id,
                title: row.title,
                artist: row.artist,
                album: row.album || undefined,
                duration: row.duration,
                filePath: row.filePath,
                coverUrl: row.coverUrl || undefined,
                bitrate: row.bitrate || undefined,
                addedAt: row.addedAt,
                sourceType: row.sourceType || 'local',
                isFavorite: true,
            });
        }
        stmt.free();
        return tracks;
    }
    /**
     * Пакетное добавление треков с использованием транзакции
     */
    insertTracksBatch(tracks) {
        this.db.run('BEGIN TRANSACTION;');
        try {
            const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tracks (id, title, artist, album, duration, filePath, coverUrl, bitrate, addedAt, sourceType, isFavorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            for (const track of tracks) {
                stmt.run([
                    track.id,
                    track.title,
                    track.artist,
                    track.album || '',
                    track.duration,
                    track.filePath,
                    track.coverUrl || null,
                    track.bitrate || 0,
                    track.addedAt || Date.now(),
                    track.sourceType || 'local',
                    track.isFavorite ? 1 : 0,
                ]);
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
     * Переключение статуса избранного
     */
    toggleFavorite(id) {
        const track = this.getTrackById(id);
        if (!track)
            return false;
        const newFavorite = !track.isFavorite;
        this.db.run('UPDATE tracks SET isFavorite = ? WHERE id = ?', [newFavorite ? 1 : 0, id]);
        return newFavorite;
    }
    /**
     * Удаление трека по ID
     */
    deleteTrack(id) {
        this.db.run('DELETE FROM tracks WHERE id = ?', [id]);
    }
}
exports.TrackRepository = TrackRepository;
