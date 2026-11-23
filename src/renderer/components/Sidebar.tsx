import React from 'react';
import { Home, Search, Heart, Plus, FolderPlus, Music } from 'lucide-react';
import { PlaylistItem } from '../../shared/models';

export type NavTab = 'home' | 'search' | 'favorites' | 'playlist';

interface SidebarProps {
  activeTab: NavTab;
  activePlaylistId: string | null;
  playlists: PlaylistItem[];
  onSelectTab: (tab: NavTab) => void;
  onSelectPlaylist: (id: string) => void;
  onCreatePlaylist: () => void;
  onScanFolder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activePlaylistId,
  playlists,
  onSelectTab,
  onSelectPlaylist,
  onCreatePlaylist,
  onScanFolder,
}) => {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <span className="brand-title">Abyss</span>
        <span className="brand-subtitle">music</span>
      </div>

      <nav className="nav-list">
        <button
          type="button"
          className={`nav-pill ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onSelectTab('home')}
        >
          <span className="nav-pill-icon">
            <Home size={16} strokeWidth={2.2} />
          </span>
          <span>Главная</span>
        </button>

        <button
          type="button"
          className={`nav-pill ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onSelectTab('search')}
        >
          <span className="nav-pill-icon">
            <Search size={16} strokeWidth={2.2} />
          </span>
          <span>Поиск</span>
        </button>

        <button
          type="button"
          className={`nav-pill ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => onSelectTab('favorites')}
        >
          <span className="nav-pill-icon">
            <Heart size={16} strokeWidth={2.2} />
          </span>
          <span>Избранное</span>
        </button>
      </nav>

      <section className="collection-section">
        <div className="collection-header">
          <span className="collection-title">Коллекция</span>
          <div className="collection-actions">
            <button
              type="button"
              className="icon-ghost-btn"
              title="Добавить папку с музыкой"
              onClick={onScanFolder}
            >
              <FolderPlus size={17} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="icon-ghost-btn"
              title="Создать плейлист"
              onClick={onCreatePlaylist}
            >
              <Plus size={18} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <div className="playlist-scroll">
          {playlists.map((playlist) => {
            const isSelected = activeTab === 'playlist' && activePlaylistId === playlist.id;
            return (
              <button
                key={playlist.id}
                type="button"
                className={`playlist-row ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectPlaylist(playlist.id)}
              >
                <div className="playlist-cover-stub">
                  <Music size={18} strokeWidth={2} />
                </div>
                <span>{playlist.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
};