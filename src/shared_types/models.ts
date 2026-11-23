// src/shared_types/models.ts
export interface TrackItem {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;
    filePath: string;
    coverUrl?: string | null;
    bitrate?: number;
    addedAt?: number;
    sourceType?: 'local' | 'online';
    isFavorite?: boolean;
}

export interface PlaylistItem {
    id: string;
    name: string;
    trackIds: string[];
    createdAt: number;
    coverUrl?: string | null;
}