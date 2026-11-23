// src/services/jamendo/jamendoClient.ts
export interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_image: string;
    audio: string;
    duration: number;
}

export class JamendoService {
    private readonly baseUrl = 'https://api.jamendo.com/v3.0';
    constructor(private clientId: string) {}

    public async searchTracks(query: string, limit: number = 20): Promise<JamendoTrack[]> {
        const url = `${this.baseUrl}/tracks/?client_id=${this.clientId}&format=json&limit=${limit}&search=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    }

    public async getTrendingTracks(limit: number = 20): Promise<JamendoTrack[]> {
        const url = `${this.baseUrl}/tracks/?client_id=${this.clientId}&format=json&limit=${limit}&order=trending`;
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    }

    public async getTracksByGenre(genre: string, limit: number = 20): Promise<JamendoTrack[]> {
        const url = `${this.baseUrl}/tracks/?client_id=${this.clientId}&format=json&limit=${limit}&tags=${encodeURIComponent(genre)}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    }
}

// src/services/lyrics/lrcParser.ts
export interface LyricLine {
    time: number; // в секундах
    text: string;
}

export function parseLRC(lrcContent: string): LyricLine[] {
    const lines = lrcContent.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();
            if (text) {
                result.push({ time, text });
            }
        }
    }
    return result.sort((a, b) => a.time - b.time);
}
