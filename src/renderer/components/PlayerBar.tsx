import React, { useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Music,
} from 'lucide-react';
import { UIMockTrack } from '../data/mock_data';
import { formatDuration } from './TrackList';
import { AudioVisualizer } from './AudioVisualizer';

interface PlayerBarProps {
  currentTrack: UIMockTrack | null;
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  isQueueOpen: boolean;
  positionSec: number;
  durationSec: number;
  volume: number;
  audioContext: any;
  gainNode: any;
  onTogglePlay: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleQueue: () => void;
  onToggleEqualizer: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (sec: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleFavorite: (trackId: string) => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  isShuffle,
  isRepeat,
  isQueueOpen,
  positionSec,
  durationSec,
  volume,
  audioContext,
  gainNode,
  onTogglePlay,
  onToggleShuffle,
  onToggleRepeat,
  onToggleQueue,
  onToggleEqualizer,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleFavorite,
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const duration = durationSec > 0 ? durationSec : (currentTrack?.durationSeconds ?? 0);
  const progressPercent = duration > 0 ? Math.min(100, (positionSec / duration) * 100) : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.floor(ratio * duration));
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onVolumeChange(Number(ratio.toFixed(2)));
  };

  return (
    <footer className="player-dock">
      <div className="player-track-info">
        <div
          className="track-mini-cover"
          style={{ background: currentTrack?.coverGradient ?? 'rgba(255,255,255,0.12)' }}
        >
          <Music size={17} />
        </div>
        {currentTrack ? (
          <>
            <div>
              <div className="track-name">{currentTrack.title}</div>
              <div className="track-artist">{currentTrack.artist}</div>
            </div>
            <button
              type="button"
              className="icon-ghost-btn"
              onClick={() => onToggleFavorite(currentTrack.id)}
            >
              <Heart
                size={16}
                fill={currentTrack.isFavorite ? '#ffffff' : 'none'}
                color="#ffffff"
              />
            </button>
          </>
        ) : (
          <div className="track-artist">Трек не выбран</div>
        )}
      </div>

      <div className="player-center">
        <div className="player-buttons">
          <button
            type="button"
            className={`icon-ghost-btn ${isShuffle ? 'is-active' : ''}`}
            onClick={onToggleShuffle}
            title="Перемешать"
          >
            <Shuffle size={15} />
          </button>

          <button type="button" className="icon-ghost-btn" onClick={onPrev} title="Назад">
            <SkipBack size={18} />
          </button>

          <button
            type="button"
            className="player-play-circle"
            onClick={onTogglePlay}
            title={isPlaying ? 'Пауза' : 'Играть'}
          >
            {isPlaying ? (
              <Pause size={16} fill="#141416" />
            ) : (
              <Play size={16} fill="#141416" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button type="button" className="icon-ghost-btn" onClick={onNext} title="Вперёд">
            <SkipForward size={18} />
          </button>

          <button
            type="button"
            className={`icon-ghost-btn ${isRepeat ? 'is-active' : ''}`}
            onClick={onToggleRepeat}
            title="Повтор"
          >
            <Repeat size={15} />
          </button>
        </div>

        <div className="progress-row">
          <span className="tabular-time" style={{ fontSize: 11 }}>
            {formatDuration(positionSec)}
          </span>
          <div
            ref={progressRef}
            className="slider-track"
            onClick={handleProgressClick}
          >
            <div className="slider-fill" style={{ width: `${progressPercent}%` }}>
              <span className="slider-thumb" />
            </div>
          </div>
          <span className="tabular-time" style={{ fontSize: 11 }}>
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      <div className="player-right">
        <AudioVisualizer
          audioContext={audioContext}
          gainNode={gainNode}
          isPlaying={isPlaying}
        />

        <button
          type="button"
          className="icon-ghost-btn"
          onClick={onToggleEqualizer}
          title="Эквалайзер"
        >
          <SlidersHorizontal size={17} />
        </button>

        <button
          type="button"
          className={`icon-ghost-btn ${isQueueOpen ? 'is-active' : ''}`}
          onClick={onToggleQueue}
          title="Очередь воспроизведения"
        >
          <ListMusic size={17} />
        </button>

        <button
          type="button"
          className="icon-ghost-btn"
          onClick={() => onVolumeChange(volume > 0 ? 0 : 0.75)}
          title={volume === 0 ? 'Включить звук' : 'Выключить звук'}
        >
          {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        <div
          ref={volumeRef}
          className="slider-track"
          style={{ maxWidth: 100 }}
          onClick={handleVolumeClick}
        >
          <div className="slider-fill" style={{ width: `${volume * 100}%` }}>
            <span className="slider-thumb" />
          </div>
        </div>
      </div>
    </footer>
  );
};