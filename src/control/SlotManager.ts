import type { ParamStore } from "../engine/ParamStore";

export const SLOT_KEYS = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"] as const;
export type SlotData = Record<string, number>;

const BPM = 120;
const WHOLE_NOTE_S = (4 * 60) / BPM; // 2 seconds at 120 BPM

type SlotListener = () => void;

export class SlotManager {
  readonly slots: (SlotData | null)[] = new Array(SLOT_KEYS.length).fill(null);
  private division = 4; // default: 1 bar
  private store: ParamStore;

  private interpStart: Record<string, number> | null = null;
  private interpTarget: SlotData | null = null;
  private interpStartTime = 0;
  private interpDuration = 0;
  private rafId = 0;
  private activeSlot = -1;
  private excludedKeys = new Set<string>();

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

  /** Duration label: 8, 4, 2, 1, 1/2, 1/4 bars. */
  get divisionLabel(): string {
    const bars = 8 / Math.pow(2, this.division - 1);
    if (bars >= 1) return `${bars}`;
    return `1/${1 / bars}`;
  }

  setDivision(n: number) {
    if (n < 1 || n > 9) return;
    this.division = n;
    this.notify();
  }

  clearAll() {
    this.cancelInterp();
    this.slots.fill(null);
    this.notify();
  }

  save(index: number) {
    if (index < 0 || index >= SLOT_KEYS.length) return;
    this.slots[index] = this.store.snapshot();
    this.notify();
  }

  /** True if the key is actively being interpolated (has a target and isn't excluded). */
  isInterpolating(key: string): boolean {
    return this.interpTarget != null && !this.excludedKeys.has(key) && key in this.interpTarget;
  }

  /** Returns the target value for a key if it's being interpolated. */
  getTarget(key: string): number | undefined {
    if (!this.interpTarget || this.excludedKeys.has(key)) return undefined;
    return this.interpTarget[key];
  }

  excludeFromInterp(...keys: string[]) {
    for (const k of keys) this.excludedKeys.add(k);
  }

  recall(index: number) {
    if (index < 0 || index >= SLOT_KEYS.length) return;
    const target = this.slots[index];
    if (!target) return;

    this.cancelInterp();
    this.excludedKeys.clear();

    this.interpStart = this.store.snapshot();
    this.interpTarget = target;
    this.interpDuration =
      WHOLE_NOTE_S * Math.pow(2, 4 - this.division);
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
      if (this.excludedKeys.has(key)) continue;
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
