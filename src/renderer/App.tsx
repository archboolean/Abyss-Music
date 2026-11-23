import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { EqualizerModal } from './components/EqualizerModal';
import {
  MOCK_TRACKS,
  INITIAL_PLAYLISTS,
  UIMockTrack,
  UIMockPlaylist,
} from './data/mock_data';
import { WaveSettings } from '../shared/models';
import { invokeIpc, subscribeIpc } from './services/ipc_client';
import { AudioPlayer } from './audio/AudioPlayer';
import { TrackItem } from '../shared_types/models';
import { EQ_FREQUENCIES } from './equalizer/Equalizer';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<UIMockTrack[]>(MOCK_TRACKS);
  const [playlists, setPlaylists] = useState<UIMockPlaylist[]>(INITIAL_PLAYLISTS);
  const [libraryTracks, setLibraryTracks] = useState<TrackItem[]>([]);

  const [currentTrack, setCurrentTrack] = useState<UIMockTrack | null>(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolume] = useState(0.75);

  const [searchQuery, setSearchQuery] = useState('');
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false);
  const [waveSettings, setWaveSettings] = useState<WaveSettings>({
    mood: 'Спокойное',
    activity: 'Для фокуса',
    character: 'Незнакомое',
    genre: null,
  });

  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [equalizerGains, setEqualizerGains] = useState<number[]>(new Array(10).fill(0));
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    const player = new AudioPlayer();
    audioPlayerRef.current = player;

    player.setOnTimeUpdate((currentTime, duration) => {
      setPositionSec(currentTime);
      setDurationSec(duration);
    });

    player.setOnPlayStateChange((isPlaying) => {
      setIsPlaying(isPlaying);
    });

    player.setOnTrackEnd(() => {
      player.next();
    });

    // Enable equalizer by default
    player.enableEqualizer();

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeIpc('player:state-changed', (state) => {
      setIsPlaying(state.isPlaying);
      setPositionSec(state.positionSec);
    });

    // Listen for media key commands
    const handlePlayerCommand = (command: string) => {
      const player = audioPlayerRef.current;
      if (!player) return;

      switch (command) {
        case 'toggle-play':
          handleTogglePlay();
          break;
        case 'next':
          player.next();
          break;
        case 'prev':
          player.prev();
          break;
      }
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const player = audioPlayerRef.current;
      if (!player) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            player.next();
          } else {
            handleSeek(player.getCurrentTime() + 10);
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            player.prev();
          } else {
            handleSeek(player.getCurrentTime() - 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.05));
          break;
        case 'KeyF':
          e.preventDefault();
          handleToggleFavorite(currentTrack?.id || '');
          break;
        case 'KeyQ':
          e.preventDefault();
          setIsQueueOpen((q) => !q);
          break;
        case 'KeyE':
          e.preventDefault();
          setIsEqualizerOpen(true);
          break;
      }
    };

    if (window.abyssApi) {
      const unsubscribeCommand = window.abyssApi.onPlayerCommand(handlePlayerCommand);
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        unsubscribe();
        unsubscribeCommand();
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    return unsubscribe;
  }, [volume, currentTrack]);

  // Load library tracks on mount
  useEffect(() => {
    const loadLibrary = async () => {
      const libTracks = await invokeIpc('library:get-tracks');
      if (libTracks) {
        setLibraryTracks(libTracks);
      }
    };
    loadLibrary();
  }, []);

  const handlePlayTrack = async (track: UIMockTrack) => {
    setCurrentTrack(track);
    setPositionSec(0);
    setIsPlaying(true);

    const player = audioPlayerRef.current;
    if (player) {
      // Try to find the track in library first
      const libTrack = libraryTracks.find(t => t.id === track.id);
      if (libTrack) {
        await player.playTrack(libTrack);
      } else {
        // Use mock data
        const mockTrack: TrackItem = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.durationSeconds,
          filePath: '',
          sourceType: 'local',
          isFavorite: track.isFavorite,
        };
        await player.playTrack(mockTrack);
      }
    }
  };

  const handleTogglePlay = async () => {
    const player = audioPlayerRef.current;
    if (!player || !currentTrack) return;

    if (player.isPlaying()) {
      player.pause();
    } else {
      await handlePlayTrack(currentTrack);
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    const player = audioPlayerRef.current;
    if (player) {
      player.setVolume(nextVol);
    }
  };

  const handleToggleFavorite = async (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
    // Also update in database
    await invokeIpc('library:toggle-favorite', trackId);
  };

  const handleCreatePlaylist = async () => {
    const newPl = await invokeIpc('playlist:create', `Плейлист #${playlists.length + 1}`);
    if (newPl) {
      setPlaylists((prev) => [...prev, newPl]);
    }
  };

  const handleScanFolder = async () => {
    const folderPath = await invokeIpc('library:select-folder');
    if (folderPath) {
      const result = await invokeIpc('library:scan-folder', folderPath);
      if (result) {
        // Reload library
        const libTracks = await invokeIpc('library:get-tracks');
        if (libTracks) {
          setLibraryTracks(libTracks);
        }
      }
    }
  };

  const handleStepTrack = (delta: number) => {
    const player = audioPlayerRef.current;
    if (!player) return;

    if (delta > 0) {
      player.next();
    } else {
      player.prev();
    }
  };

  const handleSeek = (time: number) => {
    const player = audioPlayerRef.current;
    if (player) {
      player.seek(time);
    }
  };

  const handleSetEqualizerBandGain = (bandIndex: number, gainDb: number) => {
    const player = audioPlayerRef.current;
    if (player) {
      player.setEqualizerBandGain(bandIndex, gainDb);
    }
    const newGains = [...equalizerGains];
    newGains[bandIndex] = gainDb;
    setEqualizerGains(newGains);
  };

  const handleApplyEqualizerPreset = (presetName: string) => {
    const player = audioPlayerRef.current;
    if (player) {
      player.applyEqualizerPreset(presetName);
    }
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
        durationSec={durationSec}
        volume={volume}
        audioContext={audioPlayerRef.current?.getAudioContext() || null}
        gainNode={audioPlayerRef.current?.getGainNode() || null}
        onTogglePlay={handleTogglePlay}
        onToggleShuffle={() => setIsShuffle((s) => !s)}
        onToggleRepeat={() => setIsRepeat((r) => !r)}
        onToggleQueue={() => setIsQueueOpen((q) => !q)}
        onToggleEqualizer={() => setIsEqualizerOpen(true)}
        onPrev={() => handleStepTrack(-1)}
        onNext={() => handleStepTrack(1)}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleFavorite={handleToggleFavorite}
      />

      <WaveModal
        isOpen={isWaveModalOpen}
        initialSettings={waveSettings}
        onClose={() => setIsWaveModalOpen(false)}
        onApply={setWaveSettings}
      />

      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        onSetBandGain={handleSetEqualizerBandGain}
        onApplyPreset={handleApplyEqualizerPreset}
        currentGains={equalizerGains}
      />
    </div>
  );
};