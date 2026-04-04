import { useCallback, type PointerEvent as RPointerEvent } from "react";
import type { ParamStore } from "../../engine/ParamStore";
import { useParam } from "../hooks";
import { colorFor } from "../colors";

interface TogglePadProps {
  store: ParamStore;
  paramKey: string;
  label: string;
  size?: number;
}

export function TogglePad({ store, paramKey, label, size = 24 }: TogglePadProps) {
  const value = useParam(store, paramKey);
  const on = value >= 0.5;

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      e.preventDefault();
      store.set(paramKey, on ? 0 : 1);
    },
    [store, paramKey, on],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        onPointerDown={onPointerDown}
        style={{
          width: size,
          height: size,
          backgroundColor: colorFor(on ? 1 : 0, 0.5),
          position: "relative",
          borderRadius: 4,
          touchAction: "none",
          cursor: "pointer",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: on ? `${size - 4}px` : "4px",
            top: "50%",
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "#666", userSelect: "none" }}>{label}</span>
    </div>
  );
}
