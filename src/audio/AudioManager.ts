import type { SynthEngine } from "../engine/types";

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private disconnectEngine: (() => void) | null = null;
  private currentEngine: SynthEngine | null = null;

  get audioContext(): AudioContext | null {
    return this.context;
  }

  get isRunning(): boolean {
    return this.context?.state === "running";
  }

  async init(): Promise<AudioContext> {
    if (this.context) return this.context;
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    return this.context;
  }

  async mountEngine(engine: SynthEngine): Promise<void> {
    this.unmountEngine();
    const ctx = await this.init();
    this.disconnectEngine = await engine.connect(ctx, this.masterGain!);
    this.currentEngine = engine;
  }

  unmountEngine() {
    this.disconnectEngine?.();
    this.disconnectEngine = null;
    this.currentEngine = null;
  }

  async resume(): Promise<void> {
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }

  async suspend(): Promise<void> {
    if (this.context?.state === "running") {
      await this.context.suspend();
    }
  }

  getEngine(): SynthEngine | null {
    return this.currentEngine;
  }
}
