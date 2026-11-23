export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  sourceType: 'local' | 'online';
  audioUrl: string;
  coverUrl?: string;
  isFavorite: boolean;
}

export interface PlaylistItem {
  id: string;
  name: string;
  coverUrl?: string;
  trackIds: string[];
}

export interface WaveSettings {
  mood: string | null;
  activity: string | null;
  character: string | null;
  genre: string | null;
}