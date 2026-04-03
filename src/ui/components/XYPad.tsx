import { useRef, useCallback, type PointerEvent as RPointerEvent } from "react";
import type { ParamStore } from "../../engine/ParamStore";
import type { SlotManager } from "../../control/SlotManager";
import { useParam } from "../hooks";
import { colorFor } from "../colors";

interface XYPadProps {
  store: ParamStore;
  xKey: string;
  yKey?: string;
  label: string;
  size?: number;
  onDragStart?: () => void;
  slotManager?: SlotManager;
}

export function XYPad({ store, xKey, yKey, label, size = 96, onDragStart, slotManager }: XYPadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useParam(store, xKey);
  const y = yKey ? useParam(store, yKey) : 0.5;
  const singleAxis = !yKey;
  const height = singleAxis ? Math.round(size / 4) : size;

  const lerping = slotManager?.isInterpolating(xKey) ?? false;
  const targetX = slotManager?.getTarget(xKey);
  const targetY = yKey ? slotManager?.getTarget(yKey) : undefined;
  const blinkVisible = !lerping || Math.floor(performance.now() / 100) % 2 === 0;

  const update = useCallback(
    (e: RPointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      store.set(xKey, nx);
      if (yKey) {
        const ny = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
        store.set(yKey, ny);
      }
    },
    [store, xKey, yKey],
  );

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      update(e);
      onDragStart?.();
    },
    [update, onDragStart],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          if (e.buttons > 0) update(e);
        }}
        style={{
          width: size,
          height,
          backgroundColor: colorFor(x, y),
          position: "relative",
          borderRadius: 4,
          touchAction: "none",
          cursor: singleAxis ? "ew-resize" : "crosshair",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        {/* Current position dot */}
        <div
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            bottom: singleAxis ? "50%" : `${y * 100}%`,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginBottom: -4,
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.6)",
            pointerEvents: "none",
            opacity: blinkVisible ? 1 : 0,
          }}
        />

        {/* Target circle (visible only during lerp) */}
        {lerping && targetX != null && (
          <div
            style={{
              position: "absolute",
              left: `${targetX * 100}%`,
              bottom: singleAxis ? "50%" : `${(targetY ?? 0.5) * 100}%`,
              width: 8,
              height: 8,
              marginLeft: -4,
              marginBottom: -4,
              borderRadius: "50%",
              border: "1.5px solid rgba(0,0,0,0.6)",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
      <span style={{ fontSize: 11, color: "#666", userSelect: "none" }}>{label}</span>
    </div>
  );
}
