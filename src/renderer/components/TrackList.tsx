import React from 'react';
import { Heart, Music, Clock, Play } from 'lucide-react';
import { UIMockTrack } from '../data/mock_data';

interface TrackListProps {
  tracks: UIMockTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onSelectTrack: (track: UIMockTrack) => void;
  onToggleFavorite: (trackId: string) => void;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onSelectTrack,
  onToggleFavorite,
}) => {
  return (
    <table className="track-table">
      <thead>
        <tr>
          <th style={{ width: 46, textAlign: 'center' }}>#</th>
          <th>Название</th>
          <th>Альбом</th>
          <th style={{ width: 72 }}>
            <Clock size={14} />
          </th>
          <th style={{ width: 48 }} />
        </tr>
      </thead>
      <tbody>
        {tracks.map((track, idx) => {
          const isCurrent = track.id === currentTrackId;
          return (
            <tr
              key={track.id}
              className={`track-row ${isCurrent ? 'active' : ''}`}
              onClick={() => onSelectTrack(track)}
            >
              <td className="tabular-time">
                <div className="track-index-wrap">
                  {isCurrent && isPlaying ? (
                    <div className="eq-bars">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <>
                      <span className="track-num">{idx + 1}</span>
                      <span className="track-hover-play">
                        <Play size={14} fill="#ffffff" />
                      </span>
                    </>
                  )}
                </div>
              </td>

              <td>
                <div className="track-title-cell">
                  <div
                    className="track-mini-cover"
                    style={{ background: track.coverGradient }}
                  >
                    <Music size={15} />
                  </div>
                  <div>
                    <div className="track-name">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                </div>
              </td>

              <td style={{ color: 'rgba(255, 255, 255, 0.56)' }}>{track.album}</td>

              <td className="tabular-time">{formatDuration(track.durationSeconds)}</td>

              <td onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="icon-ghost-btn"
                  onClick={() => onToggleFavorite(track.id)}
                >
                  <Heart
                    size={16}
                    fill={track.isFavorite ? '#ffffff' : 'none'}
                    color="#ffffff"
                  />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};