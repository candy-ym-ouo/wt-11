export type WarningLevel = 'low' | 'critical';

interface ScheduledTick {
  id: number;
  timeoutId: number;
  level: WarningLevel;
}

export class TimeWarningAudio {
  private static instance: TimeWarningAudio | null = null;

  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowOscPool: OscillatorNode[] = [];
  private criticalOscPool: OscillatorNode[] = [];
  private nextTickId = 0;
  private scheduledTicks = new Map<number, ScheduledTick>();

  private lowFrequency = 660;
  private criticalFrequency = 880;
  private lowDuration = 0.08;
  private criticalDuration = 0.06;
  private lowVolume = 0.18;
  private criticalVolume = 0.3;

  private isPaused = false;
  private isMuted = false;
  private refCount = 0;

  private constructor() {}

  static getInstance(): TimeWarningAudio {
    if (!TimeWarningAudio.instance) {
      TimeWarningAudio.instance = new TimeWarningAudio();
    }
    return TimeWarningAudio.instance;
  }

  acquire(): void {
    this.refCount++;
    this.ensureContext();
  }

  release(): void {
    this.refCount--;
    if (this.refCount <= 0) {
      this.refCount = 0;
      this.cancelAllScheduledTicks();
      this.stopAll();
    }
  }

  private ensureContext(): void {
    if (this.audioCtx) return;

    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;

    try {
      this.audioCtx = new Ctx();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.audioCtx.destination);
    } catch (e) {
      this.audioCtx = null;
      this.masterGain = null;
    }
  }

  private async resumeIfNeeded(): Promise<void> {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {}
    }
  }

  playTick(level: WarningLevel): void {
    if (this.isPaused || this.isMuted) return;
    this.ensureContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.resumeIfNeeded();

    const isCritical = level === 'critical';
    const freq = isCritical ? this.criticalFrequency : this.lowFrequency;
    const duration = isCritical ? this.criticalDuration : this.lowDuration;
    const volume = isCritical ? this.criticalVolume : this.lowVolume;
    const pool = isCritical ? this.criticalOscPool : this.lowOscPool;

    const now = this.audioCtx.currentTime;

    let osc: OscillatorNode;
    let gain: GainNode;

    if (pool.length > 0) {
      osc = pool.pop()!;
      try {
        gain = (osc as any)._gain as GainNode;
      } catch {
        gain = this.audioCtx.createGain();
      }
    } else {
      osc = this.audioCtx.createOscillator();
      gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.masterGain);
      (osc as any)._gain = gain;
    }

    osc.frequency.value = freq;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    try {
      osc.start(now);
    } catch (e) {
      try {
        osc.stop();
      } catch {}
      try {
        osc.start(now);
      } catch {}
    }

    const stopAt = now + duration + 0.02;
    const poolRef = pool;
    const oscRef = osc;
    window.setTimeout(() => {
      try {
        oscRef.stop();
      } catch {}
      if (poolRef.length < 12) {
        poolRef.push(oscRef);
      }
    }, Math.max(0, (stopAt - this.audioCtx!.currentTime) * 1000 + 20));
  }

  scheduleTick(level: WarningLevel, delayMs: number): number {
    const id = ++this.nextTickId;
    const timeoutId = window.setTimeout(() => {
      this.scheduledTicks.delete(id);
      if (!this.isPaused) {
        this.playTick(level);
      }
    }, delayMs);
    this.scheduledTicks.set(id, { id, timeoutId, level });
    return id;
  }

  cancelScheduledTick(id: number): void {
    const tick = this.scheduledTicks.get(id);
    if (tick) {
      window.clearTimeout(tick.timeoutId);
      this.scheduledTicks.delete(id);
    }
  }

  cancelAllScheduledTicks(): void {
    this.scheduledTicks.forEach(t => window.clearTimeout(t.timeoutId));
    this.scheduledTicks.clear();
  }

  pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.cancelAllScheduledTicks();
    if (this.audioCtx && this.audioCtx.state === 'running') {
      try {
        this.audioCtx.suspend();
      } catch (e) {}
    }
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.resumeIfNeeded();
    }
  }

  mute(): void {
    this.isMuted = true;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.05);
    }
  }

  unmute(): void {
    this.isMuted = false;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(1, this.audioCtx.currentTime + 0.05);
    }
  }

  stopAll(): void {
    this.cancelAllScheduledTicks();
    [...this.lowOscPool, ...this.criticalOscPool].forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.lowOscPool = [];
    this.criticalOscPool = [];
  }

  setVolume(level: WarningLevel, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (level === 'low') {
      this.lowVolume = clamped;
    } else {
      this.criticalVolume = clamped;
    }
  }

  getAudioContextState(): AudioContextState | 'unavailable' {
    return this.audioCtx ? this.audioCtx.state : 'unavailable';
  }
}
