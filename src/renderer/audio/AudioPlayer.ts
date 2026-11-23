// src/renderer/audio/AudioPlayer.ts
import { TrackItem } from '../../shared_types/models';
import { TenBandEqualizer } from '../equalizer/Equalizer';

export type RepeatMode = 'none' | 'all' | 'one';

export class AudioPlayer {
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement;
    private sourceNode: MediaElementAudioSourceNode;
    private gainNode: GainNode;
    private equalizer: TenBandEqualizer | null = null;

    private queue: TrackItem[] = [];
    private currentIndex: number = -1;
    private isShuffle: boolean = false;
    private repeatMode: RepeatMode = 'none';
    private volume: number = 0.75;

    private onTrackEndCallback?: () => void;
    private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
    private onPlayStateChangeCallback?: (isPlaying: boolean) => void;

    constructor() {
        this.audioContext = new AudioContext();
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.volume = this.volume;

        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        this.gainNode = this.audioContext.createGain();

        // Basic routing: Source -> Gain -> Destination
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.audioElement.addEventListener('ended', () => this.handleTrackEnd());
        this.audioElement.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.audioElement.addEventListener('play', () => this.onPlayStateChangeCallback?.(true));
        this.audioElement.addEventListener('pause', () => this.onPlayStateChangeCallback?.(false));
    }

    public setQueue(tracks: TrackItem[], startIndex: number = 0): void {
        this.queue = [...tracks];
        this.currentIndex = startIndex;
    }

    public setOnTrackEnd(callback: () => void): void {
        this.onTrackEndCallback = callback;
    }

    public setOnTimeUpdate(callback: (currentTime: number, duration: number) => void): void {
        this.onTimeUpdateCallback = callback;
    }

    public setOnPlayStateChange(callback: (isPlaying: boolean) => void): void {
        this.onPlayStateChangeCallback = callback;
    }

    public async playTrack(track: TrackItem): Promise<void> {
        this.currentIndex = this.queue.findIndex(t => t.id === track.id);
        if (this.currentIndex === -1) {
            this.queue.push(track);
            this.currentIndex = this.queue.length - 1;
        }

        const audioUrl = track.sourceType === 'local'
            ? `file://${track.filePath.replace(/\\/g, '/')}`
            : track.filePath;

        this.audioElement.src = audioUrl;
        try {
            await this.audioElement.play();
        } catch (error) {
            console.error('Failed to play track:', error);
        }
    }

    public async playTrackAtIndex(index: number): Promise<void> {
        if (index < 0 || index >= this.queue.length) return;
        this.currentIndex = index;
        const track = this.queue[this.currentIndex];
        await this.playTrack(track);
    }

    public togglePlayPause(): void {
        if (this.audioElement.paused) {
            this.audioElement.play();
        } else {
            this.audioElement.pause();
        }
    }

    public pause(): void {
        this.audioElement.pause();
    }

    public seek(timeSeconds: number): void {
        this.audioElement.currentTime = Math.max(0, Math.min(timeSeconds, this.audioElement.duration || 0));
    }

    public setVolume(value: number): void {
        this.volume = Math.max(0, Math.min(1, value));
        this.audioElement.volume = this.volume;
    }

    public getVolume(): number {
        return this.volume;
    }

    public toggleMute(): void {
        this.audioElement.muted = !this.audioElement.muted;
    }

    public toggleShuffle(): boolean {
        this.isShuffle = !this.isShuffle;
        return this.isShuffle;
    }

    public setRepeatMode(mode: RepeatMode): void {
        this.repeatMode = mode;
    }

    public next(): void {
        if (this.queue.length === 0) return;
        if (this.isShuffle) {
            const nextIdx = Math.floor(Math.random() * this.queue.length);
            this.playTrackAtIndex(nextIdx);
            return;
        }
        const nextIndex = this.currentIndex + 1;
        if (nextIndex < this.queue.length) {
            this.playTrackAtIndex(nextIndex);
        } else if (this.repeatMode === 'all') {
            this.playTrackAtIndex(0);
        }
    }

    public prev(): void {
        if (this.audioElement.currentTime > 3) {
            this.seek(0);
            return;
        }
        const prevIndex = this.currentIndex - 1;
        if (prevIndex >= 0) {
            this.playTrackAtIndex(prevIndex);
        } else if (this.repeatMode === 'all') {
            this.playTrackAtIndex(this.queue.length - 1);
        }
    }

    public getCurrentTime(): number {
        return this.audioElement.currentTime;
    }

    public getDuration(): number {
        return this.audioElement.duration || 0;
    }

    public isPlaying(): boolean {
        return !this.audioElement.paused;
    }

    public getCurrentTrack(): TrackItem | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
            return this.queue[this.currentIndex];
        }
        return null;
    }

    public getAudioContext(): AudioContext {
        return this.audioContext;
    }

    public getSourceNode(): MediaElementAudioSourceNode {
        return this.sourceNode;
    }

    public getGainNode(): GainNode {
        return this.gainNode;
    }

    public enableEqualizer(): void {
        if (this.equalizer) return;

        this.equalizer = new TenBandEqualizer(this.audioContext);

        // Re-route: Source -> Equalizer -> Gain -> Destination
        this.sourceNode.disconnect();
        this.gainNode.disconnect();

        this.sourceNode.connect(this.equalizer.getInputNode());
        this.equalizer.getOutputNode().connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
    }

    public getAnalyserNode(): AnalyserNode | null {
        // Return the source node directly for the visualizer to connect
        // The visualizer will handle connecting to the appropriate node
        return null;
    }

    public disableEqualizer(): void {
        if (!this.equalizer) return;

        // Re-route: Source -> Gain -> Destination
        this.sourceNode.disconnect();
        this.equalizer.getOutputNode().disconnect();
        this.gainNode.disconnect();

        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.equalizer = null;
    }

    public setEqualizerBandGain(bandIndex: number, gainDb: number): void {
        if (this.equalizer) {
            this.equalizer.setBandGain(bandIndex, gainDb);
        }
    }

    public applyEqualizerPreset(presetName: string): void {
        if (this.equalizer) {
            this.equalizer.applyPreset(presetName as any);
        }
    }

    private handleTrackEnd(): void {
        if (this.repeatMode === 'one') {
            this.seek(0);
            this.audioElement.play();
        } else {
            this.onTrackEndCallback?.();
        }
    }

    private handleTimeUpdate(): void {
        this.onTimeUpdateCallback?.(this.audioElement.currentTime, this.audioElement.duration || 0);
    }
}
