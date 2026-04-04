import { useRef, useCallback, type PointerEvent as RPointerEvent } from "react";
import type { ParamStore } from "../../engine/ParamStore";
import type { SlotManager } from "../../control/SlotManager";
import { useParam } from "../hooks";
import { colorFor, DISABLED } from "../colors";

interface XYPadProps {
  store: ParamStore;
  xKey: string;
  yKey?: string;
  label: string;
  size?: number;
  vertical?: boolean;
  disabled?: boolean;
  onDragStart?: () => void;
  slotManager?: SlotManager;
}

type LockedAxis = null | "x" | "y";

export function XYPad({ store, xKey, yKey, label, size = 96, vertical, disabled, onDragStart, slotManager }: XYPadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useParam(store, xKey);
  const y = yKey ? useParam(store, yKey) : 0.5;
  const singleAxis = !yKey;

  const padWidth = vertical ? Math.round(size / 4) : size;
  const padHeight = vertical ? size : singleAxis ? Math.round(size / 4) : size;

  const lerping = slotManager?.isInterpolating(xKey) ?? false;
  const targetX = slotManager?.getTarget(xKey);
  const targetY = yKey ? slotManager?.getTarget(yKey) : undefined;
  const blinkVisible = !lerping || Math.floor(performance.now() / 100) % 2 === 0;

  const startPos = useRef<{ cx: number; cy: number } | null>(null);
  const lockedAxis = useRef<LockedAxis>(null);

  const update = useCallback(
    (e: RPointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      let lock: LockedAxis = null;
      if (e.shiftKey && yKey && startPos.current) {
        if (lockedAxis.current) {
          lock = lockedAxis.current;
        } else {
          const dx = Math.abs(e.clientX - startPos.current.cx);
          const dy = Math.abs(e.clientY - startPos.current.cy);
          lock = dx >= dy ? "x" : "y";
          lockedAxis.current = lock;
        }
      } else {
        lockedAxis.current = null;
      }

      if (vertical) {
        const ny = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
        store.set(xKey, ny);
      } else {
        if (lock !== "y") {
          const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          store.set(xKey, nx);
        }
        if (yKey && lock !== "x") {
          const ny = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
          store.set(yKey, ny);
        }
      }
    },
    [store, xKey, yKey, vertical],
  );

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      if (disabled) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startPos.current = { cx: e.clientX, cy: e.clientY };
      lockedAxis.current = null;
      if (!e.shiftKey || !yKey) update(e);
      onDragStart?.();
    },
    [update, onDragStart, disabled],
  );

  const dotLeft = vertical ? "50%" : `${x * 100}%`;
  const dotBottom = vertical ? `${x * 100}%` : singleAxis ? "50%" : `${y * 100}%`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          if (!disabled && e.buttons > 0) update(e);
        }}
        style={{
          width: padWidth,
          height: padHeight,
          backgroundColor: disabled ? DISABLED : colorFor(vertical ? 0.5 : x, vertical ? x : y),
          position: "relative",
          borderRadius: 4,
          touchAction: "none",
          cursor: disabled ? "default" : vertical ? "ns-resize" : singleAxis ? "ew-resize" : "crosshair",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: dotLeft,
            bottom: dotBottom,
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

        {lerping && targetX != null && (
          <div
            style={{
              position: "absolute",
              left: vertical ? "50%" : `${targetX * 100}%`,
              bottom: vertical ? `${targetX * 100}%` : singleAxis ? "50%" : `${(targetY ?? 0.5) * 100}%`,
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
