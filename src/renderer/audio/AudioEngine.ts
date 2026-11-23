// src/renderer/audio/AudioEngine.ts
import { TrackItem } from '../../shared_types/models';

export type RepeatMode = 'none' | 'all' | 'one';

export class AudioEngine {
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement;
    private sourceNode: MediaElementAudioSourceNode;
    private gainNode: GainNode;

    private queue: TrackItem[] = [];
    private currentIndex: number = -1;
    private isShuffle: boolean = false;
    private repeatMode: RepeatMode = 'none';

    constructor() {
        this.audioContext = new AudioContext();
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';

        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        this.gainNode = this.audioContext.createGain();

        // Базовая маршрутизация: Source -> Gain -> Destination
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.audioElement.addEventListener('ended', () => this.handleTrackEnd());
    }

    public getAudioNodes() {
        return {
            context: this.audioContext,
            source: this.sourceNode,
            gain: this.gainNode,
        };
    }

    public setQueue(tracks: TrackItem[], startIndex: number = 0): void {
        this.queue = [...tracks];
        this.currentIndex = startIndex;
        this.playTrackAtIndex(this.currentIndex);
    }

    public async playTrackAtIndex(index: number): Promise<void> {
        if (index < 0 || index >= this.queue.length) return;
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.currentIndex = index;
        const track = this.queue[this.currentIndex];
        this.audioElement.src = track.filePath;
        await this.audioElement.play();
    }

    public togglePlayPause(): void {
        if (this.audioElement.paused) {
            this.audioElement.play();
        } else {
            this.audioElement.pause();
        }
    }

    public seek(timeSeconds: number): void {
        this.audioElement.currentTime = Math.max(0, Math.min(timeSeconds, this.audioElement.duration || 0));
    }

    public setVolume(value: number): void {
        this.gainNode.gain.value = Math.max(0, Math.min(1, value));
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
        }
    }

    private handleTrackEnd(): void {
        if (this.repeatMode === 'one') {
            this.seek(0);
            this.audioElement.play();
        } else {
            this.next();
        }
    }
}