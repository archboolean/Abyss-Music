// database/repositories/TrackRepository.ts
import { Database } from 'sql.js';
import { TrackItem } from '../../shared_types/models';

export class TrackRepository {
    constructor(private db: Database) {}

    /**
     * Получение всех треков из базы данных
     */
    public getAllTracks(): TrackItem[] {
        const stmt = this.db.prepare('SELECT * FROM tracks ORDER BY addedAt DESC');
        const tracks: TrackItem[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
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
    public getTrackById(id: string): TrackItem | null {
        const stmt = this.db.prepare('SELECT * FROM tracks WHERE id = ?');
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject() as any;
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
    public searchTracks(query: string): TrackItem[] {
        const stmt = this.db.prepare(`
            SELECT * FROM tracks
            WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
            ORDER BY addedAt DESC
        `);
        const searchPattern = `%${query}%`;
        stmt.bind([searchPattern, searchPattern, searchPattern]);
        const tracks: TrackItem[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
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
    public getFavoriteTracks(): TrackItem[] {
        const stmt = this.db.prepare('SELECT * FROM tracks WHERE isFavorite = 1 ORDER BY addedAt DESC');
        const tracks: TrackItem[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
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
    public insertTracksBatch(tracks: TrackItem[]): void {
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
        } catch (error) {
            this.db.run('ROLLBACK;');
            throw error;
        }
    }

    /**
     * Переключение статуса избранного
     */
    public toggleFavorite(id: string): boolean {
        const track = this.getTrackById(id);
        if (!track) return false;
        const newFavorite = !track.isFavorite;
        this.db.run('UPDATE tracks SET isFavorite = ? WHERE id = ?', [newFavorite ? 1 : 0, id]);
        return newFavorite;
    }

    /**
     * Удаление трека по ID
     */
    public deleteTrack(id: string): void {
        this.db.run('DELETE FROM tracks WHERE id = ?', [id]);
    }
}