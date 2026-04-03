import type { ParamStore } from "../engine/ParamStore";

export const SLOT_KEYS = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"] as const;
export type SlotData = Record<string, number>;

const BPM = 120;
const WHOLE_NOTE_S = (4 * 60) / BPM; // 2 seconds at 120 BPM

type SlotListener = () => void;

export class SlotManager {
  readonly slots: (SlotData | null)[] = new Array(SLOT_KEYS.length).fill(null);
  private division = 3; // default: quarter note
  private store: ParamStore;

  private interpStart: Record<string, number> | null = null;
  private interpTarget: SlotData | null = null;
  private interpStartTime = 0;
  private interpDuration = 0;
  private rafId = 0;
  private activeSlot = -1;

  private listeners = new Set<SlotListener>();

  constructor(store: ParamStore) {
    this.store = store;
  }

  get bpm(): number {
    return BPM;
  }

  get currentDivision(): number {
    return this.division;
  }

  get currentActiveSlot(): number {
    return this.activeSlot;
  }

  /** Duration label for the current division (e.g. "1/4"). */
  get divisionLabel(): string {
    const denom = Math.pow(2, this.division - 1);
    return denom === 1 ? "1" : `1/${denom}`;
  }

  setDivision(n: number) {
    if (n < 1 || n > 6) return;
    this.division = n;
    this.notify();
  }

  save(index: number) {
    if (index < 0 || index >= SLOT_KEYS.length) return;
    this.slots[index] = this.store.snapshot();
    this.notify();
  }

  recall(index: number) {
    if (index < 0 || index >= SLOT_KEYS.length) return;
    const target = this.slots[index];
    if (!target) return;

    this.cancelInterp();

    this.interpStart = this.store.snapshot();
    this.interpTarget = target;
    this.interpDuration =
      WHOLE_NOTE_S / Math.pow(2, this.division - 1);
    this.interpStartTime = performance.now() / 1000;
    this.activeSlot = index;
    this.notify();
    this.tick();
  }

  subscribe(cb: SlotListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  dispose() {
    this.cancelInterp();
    this.listeners.clear();
  }

  private tick = () => {
    if (!this.interpStart || !this.interpTarget) return;

    const now = performance.now() / 1000;
    const elapsed = now - this.interpStartTime;
    const t = Math.min(1, elapsed / this.interpDuration);

    for (const key of Object.keys(this.interpTarget)) {
      const a = this.interpStart[key] ?? 0;
      const b = this.interpTarget[key] ?? 0;
      this.store.set(key, a + (b - a) * t);
    }

    if (t >= 1) {
      this.interpStart = null;
      this.interpTarget = null;
      this.activeSlot = -1;
      this.notify();
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private cancelInterp() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.interpStart = null;
    this.interpTarget = null;
    this.activeSlot = -1;
  }

  private notify() {
    for (const cb of this.listeners) cb();
  }
}
