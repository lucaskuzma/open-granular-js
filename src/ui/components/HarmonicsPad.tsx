import { useRef, useCallback, type PointerEvent as RPointerEvent } from "react";
import type { ParamStore } from "../../engine/ParamStore";
import type { SlotManager } from "../../control/SlotManager";
import { useParam } from "../hooks";
import { colorFor } from "../colors";

const NON_FUNDAMENTAL_KEYS = [
  "drawbar1", "drawbar2", "drawbar4", "drawbar5",
  "drawbar6", "drawbar7", "drawbar8", "drawbar9",
];

interface HarmonicsPadProps {
  store: ParamStore;
  slotManager: SlotManager;
  height?: number;
}

export function HarmonicsPad({ store, slotManager, height = 24 }: HarmonicsPadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<{ startX: number; values: Record<string, number> } | null>(null);

  const d1 = useParam(store, "drawbar1");
  const d2 = useParam(store, "drawbar2");
  const d4 = useParam(store, "drawbar4");
  const d5 = useParam(store, "drawbar5");
  const d6 = useParam(store, "drawbar6");
  const d7 = useParam(store, "drawbar7");
  const d8 = useParam(store, "drawbar8");
  const d9 = useParam(store, "drawbar9");

  const x = (d1 + d2 + d4 + d5 + d6 + d7 + d8 + d9) / 8;

  const update = useCallback(
    (e: RPointerEvent) => {
      const el = ref.current;
      const snap = snapshotRef.current;
      if (!el || !snap || snap.startX <= 0) return;
      const rect = el.getBoundingClientRect();
      const rawX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newX = Math.min(rawX, snap.startX);
      const ratio = newX / snap.startX;
      for (const key of NON_FUNDAMENTAL_KEYS) {
        store.set(key, snap.values[key] * ratio);
      }
    },
    [store],
  );

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const values: Record<string, number> = {};
      for (const key of NON_FUNDAMENTAL_KEYS) {
        values[key] = store.get(key);
      }
      const startX = NON_FUNDAMENTAL_KEYS.reduce((sum, k) => sum + values[k], 0) / NON_FUNDAMENTAL_KEYS.length;
      snapshotRef.current = { startX, values };
      slotManager.excludeFromInterp(...NON_FUNDAMENTAL_KEYS);
      update(e);
    },
    [store, slotManager, update],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          if (e.buttons > 0) update(e);
        }}
        style={{
          height,
          backgroundColor: colorFor(x, 0.5),
          position: "relative",
          borderRadius: 4,
          touchAction: "none",
          cursor: "ew-resize",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            bottom: "50%",
            width: 8,
            height: 8,
            marginLeft: -4,
            marginBottom: -4,
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "#666", userSelect: "none", textAlign: "center" }}>harmonics</span>
    </div>
  );
}
