// Web Audio API based acoustic telemetry feedback

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, gainVal: number = 0.05) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted
    }
  }

  public playScanBeep() {
    this.playTone(880, 'sine', 0.06, 0.04);
  }

  public playLockAcquired() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      this.playTone(1046.5, 'sine', 0.08, 0.05);
      setTimeout(() => this.playTone(1318.5, 'sine', 0.1, 0.05), 90);
    } catch {
      // Ignored
    }
  }

  public playVoiceSampleTick() {
    this.playTone(520 + Math.random() * 200, 'sine', 0.04, 0.02);
  }

  public playSuccessChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.25, 0.06);
        }, idx * 80);
      });
    } catch {
      // Ignored
    }
  }

  public playDeniedWarning() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      this.playTone(220, 'sawtooth', 0.18, 0.07);
      setTimeout(() => this.playTone(185, 'sawtooth', 0.25, 0.08), 120);
    } catch {
      // Ignored
    }
  }
}

export const soundFx = new SoundEngine();
