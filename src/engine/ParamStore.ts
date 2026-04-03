import type { ParamDefinition, SynthEngine } from "./types";

type Listener = (value: number) => void;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class ParamStore {
  private values = new Map<string, number>();
  private defs = new Map<string, ParamDefinition>();
  private listeners = new Map<string, Set<Listener>>();
  private engine: SynthEngine | null = null;

  load(paramDefs: ParamDefinition[]) {
    this.values.clear();
    this.defs.clear();
    this.listeners.clear();
    for (const def of paramDefs) {
      this.defs.set(def.key, def);
      this.values.set(def.key, def.default);
    }
  }

  bind(engine: SynthEngine) {
    this.engine = engine;
    for (const [key, value] of this.values) {
      engine.setParam(key, value);
    }
  }

  unbind() {
    this.engine = null;
  }

  get(key: string): number {
    return this.values.get(key) ?? 0;
  }

  getDef(key: string): ParamDefinition | undefined {
    return this.defs.get(key);
  }

  get allDefs(): ParamDefinition[] {
    return Array.from(this.defs.values());
  }

  set(key: string, value: number) {
    const def = this.defs.get(key);
    if (!def) return;
    const clamped = clamp(value, def.min, def.max);
    this.values.set(key, clamped);
    this.engine?.setParam(key, clamped);
    const subs = this.listeners.get(key);
    if (subs) {
      for (const cb of subs) cb(clamped);
    }
  }

  subscribe(key: string, cb: Listener): () => void {
    let subs = this.listeners.get(key);
    if (!subs) {
      subs = new Set();
      this.listeners.set(key, subs);
    }
    subs.add(cb);
    return () => subs.delete(cb);
  }

  /** Return a plain snapshot of all current values. */
  snapshot(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [key, value] of this.values) out[key] = value;
    return out;
  }

  /** Batch-subscribe to all param changes. */
  subscribeAll(cb: (key: string, value: number) => void): () => void {
    const unsubs: (() => void)[] = [];
    for (const key of this.defs.keys()) {
      unsubs.push(this.subscribe(key, (v) => cb(key, v)));
    }
    return () => unsubs.forEach((u) => u());
  }
}
