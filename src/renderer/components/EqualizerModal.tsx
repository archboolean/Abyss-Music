import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../equalizer/Equalizer';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetBandGain: (bandIndex: number, gainDb: number) => void;
  onApplyPreset: (presetName: string) => void;
  currentGains: number[];
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  onSetBandGain,
  onApplyPreset,
  currentGains,
}) => {
  const [localGains, setLocalGains] = useState<number[]>(currentGains);

  useEffect(() => {
    setLocalGains(currentGains);
  }, [currentGains]);

  const handleBandChange = (bandIndex: number, value: number) => {
    const newGains = [...localGains];
    newGains[bandIndex] = value;
    setLocalGains(newGains);
    onSetBandGain(bandIndex, value);
  };

  const handlePresetChange = (presetName: string) => {
    const presetGains = EQ_PRESETS[presetName as keyof typeof EQ_PRESETS];
    if (presetGains) {
      setLocalGains(presetGains);
      onApplyPreset(presetName);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Эквалайзер</h2>
          <button type="button" className="icon-ghost-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-group-label">Пресеты</div>
          <div className="preset-buttons">
            {Object.keys(EQ_PRESETS).map((preset) => (
              <button
                key={preset}
                type="button"
                className="preset-btn"
                onClick={() => handlePresetChange(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="modal-group-label" style={{ marginTop: 20 }}>
            Частоты (Гц)
          </div>
          <div className="equalizer-sliders">
            {EQ_FREQUENCIES.map((freq, index) => (
              <div key={freq} className="eq-band">
                <div className="eq-band-label">{freq}</div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={localGains[index]}
                  onChange={(e) => handleBandChange(index, parseFloat(e.target.value))}
                  className="eq-slider"
                />
                <div className="eq-band-value">{localGains[index].toFixed(1)} dB</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
