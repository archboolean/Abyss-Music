// database/repositories/PlaylistRepository.ts
import { Database } from 'sql.js';
import { PlaylistItem } from '../../shared_types/models';

export class PlaylistRepository {
    constructor(private db: Database) {}

    /**
     * Получение всех плейлистов
     */
    public getAllPlaylists(): PlaylistItem[] {
        const stmt = this.db.prepare('SELECT * FROM playlists ORDER BY createdAt DESC');
        const playlists: PlaylistItem[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
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
    public getPlaylistById(id: string): PlaylistItem | null {
        const stmt = this.db.prepare('SELECT * FROM playlists WHERE id = ?');
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject() as any;
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
    private getTrackIdsForPlaylist(playlistId: string): string[] {
        const stmt = this.db.prepare('SELECT trackId FROM playlist_tracks WHERE playlistId = ? ORDER BY position');
        stmt.bind([playlistId]);
        const trackIds: string[] = [];
        while (stmt.step()) {
            trackIds.push(stmt.getAsObject().trackId as string);
        }
        stmt.free();
        return trackIds;
    }

    /**
     * Создание нового плейлиста
     */
    public createPlaylist(name: string, coverUrl?: string): PlaylistItem {
        const id = `pl-${Date.now()}`;
        const createdAt = Date.now();
        this.db.run(
            'INSERT INTO playlists (id, name, coverUrl, createdAt) VALUES (?, ?, ?, ?)',
            [id, name, coverUrl || null, createdAt]
        );
        return { id, name, trackIds: [], createdAt, coverUrl };
    }

    /**
     * Обновление плейлиста
     */
    public updatePlaylist(id: string, name?: string, coverUrl?: string): void {
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
    public addTracksToPlaylist(playlistId: string, trackIds: string[]): void {
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
        } catch (error) {
            this.db.run('ROLLBACK;');
            throw error;
        }
    }

    /**
     * Удаление трека из плейлиста
     */
    public removeTrackFromPlaylist(playlistId: string, trackId: string): void {
        this.db.run('DELETE FROM playlist_tracks WHERE playlistId = ? AND trackId = ?', [playlistId, trackId]);
    }

    /**
     * Удаление плейлиста
     */
    public deletePlaylist(id: string): void {
        this.db.run('DELETE FROM playlists WHERE id = ?', [id]);
    }
}
