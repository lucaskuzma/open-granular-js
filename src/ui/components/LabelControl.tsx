import { useRef, useCallback, type PointerEvent as RPointerEvent } from "react";
import type { ParamStore } from "../../engine/ParamStore";
import { useParam } from "../hooks";

interface LabelControlProps {
  store: ParamStore;
  paramKey: string;
  label: string;
  width?: number;
  onDragStart?: () => void;
}

export function LabelControl({ store, paramKey, label, width = 32, onDragStart }: LabelControlProps) {
  const value = useParam(store, paramKey);
  const startY = useRef(0);
  const startVal = useRef(0);

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startY.current = e.clientY;
      startVal.current = store.get(paramKey);
      onDragStart?.();
    },
    [store, paramKey, onDragStart],
  );

  const onPointerMove = useCallback(
    (e: RPointerEvent) => {
      if (e.buttons === 0) return;
      const delta = -(e.clientY - startY.current) / 256;
      store.set(paramKey, startVal.current + delta);
    },
    [store, paramKey],
  );

  const display = String(Math.round(value * 99)).padStart(2, "0");

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      style={{
        width,
        textAlign: "center",
        cursor: "ns-resize",
        userSelect: "none",
        touchAction: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#000" }}>{display}</span>
      <span style={{ fontSize: 9, color: "#666" }}>{label}</span>
    </div>
  );
}
