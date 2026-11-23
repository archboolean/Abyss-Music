// src/services/lyrics/lrclibClient.ts
import { parseLRC, LyricLine } from './lrcParser';

export interface LrcLibTrack {
    trackId: number;
    plainLyrics: string;
    syncedLyrics: string;
    instrumental: boolean;
}

export class LrcLibService {
    private readonly baseUrl = 'https://lrclib.net/api';

    public async searchLyrics(
        trackName: string,
        artistName: string,
        albumName?: string
    ): Promise<LyricLine[] | null> {
        const params = new URLSearchParams({
            track_name: trackName,
            artist_name: artistName,
        });

        if (albumName) {
            params.append('album_name', albumName);
        }

        const url = `${this.baseUrl}/get?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        const data: LrcLibTrack[] = await response.json();

        if (!data || data.length === 0) {
            return null;
        }

        // Prefer synced lyrics
        const syncedTrack = data.find((t) => t.syncedLyrics && !t.instrumental);
        if (syncedTrack) {
            return parseLRC(syncedTrack.syncedLyrics);
        }

        // Fallback to plain lyrics
        const plainTrack = data.find((t) => t.plainLyrics && !t.instrumental);
        if (plainTrack) {
            return parsePlainLyrics(plainTrack.plainLyrics);
        }

        return null;
    }

    public async getLyricsById(trackId: number): Promise<LyricLine[] | null> {
        const url = `${this.baseUrl}/get/${trackId}`;
        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        const data: LrcLibTrack = await response.json();

        if (data.instrumental) {
            return null;
        }

        if (data.syncedLyrics) {
            return parseLRC(data.syncedLyrics);
        }

        if (data.plainLyrics) {
            return parsePlainLyrics(data.plainLyrics);
        }

        return null;
    }
}

function parsePlainLyrics(plainLyrics: string): LyricLine[] {
    const lines = plainLyrics.split('\n').filter((line) => line.trim());
    // For plain lyrics, we can't provide timing, so we return null or just the text
    // For now, return empty array to indicate no synced lyrics available
    return [];
}
