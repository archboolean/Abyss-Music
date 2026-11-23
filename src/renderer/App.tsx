import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  SlidersHorizontal,
  Search,
  Heart,
  Music,
  X,
} from 'lucide-react';
import { Sidebar, NavTab } from './components/Sidebar';
import { WaveModal } from './components/WaveModal';
import { TrackList } from './components/TrackList';
import { PlayerBar } from './components/PlayerBar';
import {
  MOCK_TRACKS,
  INITIAL_PLAYLISTS,
  UIMockTrack,
  UIMockPlaylist,
} from './data/mock_data';
import { WaveSettings } from '../shared/models';
import { invokeIpc, subscribeIpc } from './services/ipc_client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<UIMockTrack[]>(MOCK_TRACKS);
  const [playlists, setPlaylists] = useState<UIMockPlaylist[]>(INITIAL_PLAYLISTS);

  const [currentTrack, setCurrentTrack] = useState<UIMockTrack | null>(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [volume, setVolume] = useState(0.75);

  const [searchQuery, setSearchQuery] = useState('');
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false);
  const [waveSettings, setWaveSettings] = useState<WaveSettings>({
    mood: 'Спокойное',
    activity: 'Для фокуса',
    character: 'Незнакомое',
    genre: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeIpc('player:state-changed', (state) => {
      setIsPlaying(state.isPlaying);
      setPositionSec(state.positionSec);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const timer = window.setInterval(() => {
      setPositionSec((prev) =>
        prev + 1 >= currentTrack.durationSeconds ? 0 : prev + 1
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, currentTrack]);

  const handlePlayTrack = async (track: UIMockTrack) => {
    setCurrentTrack(track);
    setPositionSec(0);
    setIsPlaying(true);
    await invokeIpc('player:play', track.id);
  };

  const handleTogglePlay = async () => {
    if (!currentTrack) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      await invokeIpc('player:play', currentTrack.id);
    } else {
      await invokeIpc('player:pause');
    }
  };

  const handleVolumeChange = async (nextVol: number) => {
    setVolume(nextVol);
    await invokeIpc('player:set-volume', nextVol);
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleCreatePlaylist = () => {
    const newPl: UIMockPlaylist = {
      id: `pl-${Date.now()}`,
      name: `Плейлист #${playlists.length + 1}`,
      trackIds: [],
      coverGradient: 'linear-gradient(135deg, #3c3a39 0%, #1d1c1c 100%)',
    };
    setPlaylists((prev) => [...prev, newPl]);
  };

  const handleScanFolder = async () => {
    await invokeIpc('library:scan-folder', 'G:\\Music');
  };

  const handleStepTrack = (delta: number) => {
    if (!currentTrack || tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (idx + delta + tracks.length) % tracks.length;
    handlePlayTrack(tracks[nextIdx]);
  };

  const favoriteTracks = useMemo(() => tracks.filter((t) => t.isFavorite), [tracks]);

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, searchQuery]);

  const activePlaylist = useMemo(
    () => playlists.find((p) => p.id === activePlaylistId) ?? null,
    [playlists, activePlaylistId]
  );

  const activeWaveTags = Object.values(waveSettings).filter(Boolean) as string[];

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        activePlaylistId={activePlaylistId}
        playlists={playlists}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActivePlaylistId(null);
        }}
        onSelectPlaylist={(id) => {
          setActiveTab('playlist');
          setActivePlaylistId(id);
        }}
        onCreatePlaylist={handleCreatePlaylist}
        onScanFolder={handleScanFolder}
      />

      <main className="main-workspace">
        {activeTab === 'home' && (
          <>
            <section className="wave-hero">
              <svg className="wave-hero-bg-lines" viewBox="0 0 340 240" fill="none">
                <circle cx="210" cy="120" r="70" stroke="white" strokeWidth="1.2" />
                <circle cx="210" cy="120" r="105" stroke="white" strokeWidth="1" />
                <circle cx="210" cy="120" r="140" stroke="white" strokeWidth="0.8" />
              </svg>

              <div>
                <h1 className="wave-hero-title">Моя волна</h1>
                <p className="wave-hero-subtitle">
                  Бесконечный персональный поток под твоё настроение
                </p>
                {activeWaveTags.length > 0 && (
                  <span className="wave-active-tag">
                    {activeWaveTags.join(' • ')}
                  </span>
                )}
              </div>

              <div className="wave-controls">
                <button
                  type="button"
                  className="wave-play-btn"
                  onClick={handleTogglePlay}
                  title="Запустить Мою волну"
                >
                  {isPlaying ? (
                    <Pause size={22} fill="#141416" />
                  ) : (
                    <Play size={22} fill="#141416" style={{ marginLeft: 3 }} />
                  )}
                </button>

                <button
                  type="button"
                  className="wave-settings-btn"
                  onClick={() => setIsWaveModalOpen(true)}
                >
                  <SlidersHorizontal size={16} />
                  <span>Настроить волну</span>
                </button>
              </div>
            </section>

            <div className="section-header-row">
              <h2 className="section-heading">Недавно прослушано</h2>
            </div>

            <div className="recent-grid">
              {tracks.slice(0, 6).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    className={`recent-card ${isCurrent ? 'is-playing' : ''}`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div
                      className="recent-thumb"
                      style={{ background: track.coverGradient }}
                    >
                      <Music size={19} />
                    </div>
                    <div className="recent-card-text">
                      <span className="recent-card-title">{track.title}</span>
                      <span className="recent-card-artist">{track.artist}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="section-header-row">
              <h2 className="section-heading">Коллекция треков</h2>
            </div>

            <TrackList
              tracks={tracks}
              currentTrackId={currentTrack?.id ?? null}
              isPlaying={isPlaying}
              onSelectTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}

        {activeTab === 'search' && (
          <>
            <div className="search-bar-wrap">
              <Search size={17} className="search-input-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Треки, исполнители, альбомы..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <TrackList
              tracks={filteredTracks}
              currentTrackId={currentTrack?.id ?? null}
              isPlaying={isPlaying}
              onSelectTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            <div className="collection-banner">
              <div className="collection-big-cover">
                <Heart size={54} fill="#ffffff" color="#ffffff" />
              </div>
              <div>
                <div className="collection-banner-label">Плейлист</div>
                <h1 className="collection-banner-title">Мне нравится</h1>
                <p className="collection-banner-meta">
                  Коллекция • {favoriteTracks.length} треков
                </p>
              </div>
            </div>
            <TrackList
              tracks={favoriteTracks}
              currentTrackId={currentTrack?.id ?? null}
              isPlaying={isPlaying}
              onSelectTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}

        {activeTab === 'playlist' && activePlaylist && (
          <>
            <div className="collection-banner">
              <div
                className="collection-big-cover"
                style={{ background: activePlaylist.coverGradient }}
              >
                <Music size={54} />
              </div>
              <div>
                <div className="collection-banner-label">Плейлист</div>
                <h1 className="collection-banner-title">{activePlaylist.name}</h1>
                <p className="collection-banner-meta">
                  {activePlaylist.trackIds.length} треков
                </p>
              </div>
            </div>
            <TrackList
              tracks={tracks.filter((t) => activePlaylist.trackIds.includes(t.id))}
              currentTrackId={currentTrack?.id ?? null}
              isPlaying={isPlaying}
              onSelectTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}
      </main>

      {isQueueOpen && (
        <aside className="queue-drawer">
          <div className="queue-header">
            <span className="section-heading" style={{ fontSize: 17 }}>
              Сейчас играет
            </span>
            <button
              type="button"
              className="icon-ghost-btn"
              onClick={() => setIsQueueOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {currentTrack && (
            <div className="queue-now-card">
              <div
                className="queue-big-art"
                style={{ background: currentTrack.coverGradient }}
              >
                <Music size={46} />
              </div>
              <div className="track-name" style={{ fontSize: 16 }}>
                {currentTrack.title}
              </div>
              <div className="track-artist">{currentTrack.artist}</div>
            </div>
          )}

          <div className="modal-group-label" style={{ marginBottom: 10 }}>
            Далее в очереди
          </div>

          <div className="queue-scroll">
            {tracks
              .filter((t) => t.id !== currentTrack?.id)
              .map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className="playlist-row"
                  onClick={() => handlePlayTrack(track)}
                >
                  <div
                    className="track-mini-cover"
                    style={{ background: track.coverGradient }}
                  >
                    <Music size={14} />
                  </div>
                  <div className="recent-card-text">
                    <span className="track-name" style={{ fontSize: 13 }}>
                      {track.title}
                    </span>
                    <span className="track-artist">{track.artist}</span>
                  </div>
                </button>
              ))}
          </div>
        </aside>
      )}

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        isQueueOpen={isQueueOpen}
        positionSec={positionSec}
        volume={volume}
        onTogglePlay={handleTogglePlay}
        onToggleShuffle={() => setIsShuffle((s) => !s)}
        onToggleRepeat={() => setIsRepeat((r) => !r)}
        onToggleQueue={() => setIsQueueOpen((q) => !q)}
        onPrev={() => handleStepTrack(-1)}
        onNext={() => handleStepTrack(1)}
        onSeek={setPositionSec}
        onVolumeChange={handleVolumeChange}
        onToggleFavorite={handleToggleFavorite}
      />

      <WaveModal
        isOpen={isWaveModalOpen}
        initialSettings={waveSettings}
        onClose={() => setIsWaveModalOpen(false)}
        onApply={setWaveSettings}
      />
    </div>
  );
};