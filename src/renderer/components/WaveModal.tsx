import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WaveSettings } from '../../shared/models';
import { WAVE_CATEGORIES } from '../data/mock_data';

interface WaveModalProps {
  isOpen: boolean;
  initialSettings: WaveSettings;
  onClose: () => void;
  onApply: (settings: WaveSettings) => void;
}

export const WaveModal: React.FC<WaveModalProps> = ({
  isOpen,
  initialSettings,
  onClose,
  onApply,
}) => {
  const [draft, setDraft] = useState<WaveSettings>(initialSettings);

  if (!isOpen) return null;

  const toggleOption = (group: keyof WaveSettings, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [group]: prev[group] === value ? null : value,
    }));
  };

  const handleReset = () => {
    setDraft({ mood: null, activity: null, character: null, genre: null });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Настройка Моей волны</h2>
          <button type="button" className="icon-ghost-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-group">
          <span className="modal-group-label">По настроению</span>
          <div className="pill-wrap">
            {WAVE_CATEGORIES.mood.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip-btn ${draft.mood === item ? 'selected' : ''}`}
                onClick={() => toggleOption('mood', item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-group">
          <span className="modal-group-label">Под занятие</span>
          <div className="pill-wrap">
            {WAVE_CATEGORIES.activity.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip-btn ${draft.activity === item ? 'selected' : ''}`}
                onClick={() => toggleOption('activity', item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-group">
          <span className="modal-group-label">Характер потока</span>
          <div className="pill-wrap">
            {WAVE_CATEGORIES.character.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip-btn ${draft.character === item ? 'selected' : ''}`}
                onClick={() => toggleOption('character', item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-group">
          <span className="modal-group-label">Жанры</span>
          <div className="pill-wrap">
            {WAVE_CATEGORIES.genre.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip-btn ${draft.genre === item ? 'selected' : ''}`}
                onClick={() => toggleOption('genre', item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="chip-btn" onClick={handleReset}>
            Сбросить
          </button>
          <button
            type="button"
            className="btn-primary-pill"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};