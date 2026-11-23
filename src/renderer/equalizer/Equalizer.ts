// src/renderer/audio/equalizer/Equalizer.ts
export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
    Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Rock: [5, 4, 2, -1, -2, 0, 2, 4, 5, 5],
    Jazz: [3, 2, 1, 2, -1, -1, 0, 2, 3, 4],
    BassBoost: [8, 6, 4, 1, 0, 0, 0, 0, 0, 0],
};

export class TenBandEqualizer {
    private filters: BiquadFilterNode[] = [];

    constructor(context: AudioContext) {
        this.filters = EQ_FREQUENCIES.map((freq, idx) => {
            const filter = context.createBiquadFilter();
            filter.type = idx === 0 ? 'lowshelf' : idx === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.4;
            filter.gain.value = 0;
            return filter;
        });

        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
    }

    public getInputNode(): AudioNode {
        return this.filters[0];
    }

    public getOutputNode(): AudioNode {
        return this.filters[this.filters.length - 1];
    }

    public setBandGain(bandIndex: number, gainDb: number): void {
        if (this.filters[bandIndex]) {
            this.filters[bandIndex].gain.value = Math.max(-12, Math.min(12, gainDb));
        }
    }

    public applyPreset(presetName: keyof typeof EQ_PRESETS): void {
        const gains = EQ_PRESETS[presetName];
        if (gains) {
            gains.forEach((g, idx) => this.setBandGain(idx, g));
        }
    }
}