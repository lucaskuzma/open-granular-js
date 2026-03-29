import { useRef, useCallback, type PointerEvent as RPointerEvent } from "react";
import type { ParamStore } from "../../engine/ParamStore";
import type { SynthEngine } from "../../engine/types";
import { useParam } from "../hooks";
import { WaveformView } from "./WaveformView";

interface PositionControlProps {
  store: ParamStore;
  engine: SynthEngine | null;
  buffer: AudioBuffer | null;
  width: number;
  height?: number;
}

export function PositionControl({
  store,
  engine,
  buffer,
  width,
  height = 96,
}: PositionControlProps) {
  const ref = useRef<HTMLDivElement>(null);
  const position = useParam(store, "position");
  const positionJitter = useParam(store, "positionJitter");

  const update = useCallback(
    (e: RPointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
      store.set("position", nx);
      store.set("positionJitter", ny);
    },
    [store],
  );

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      update(e);
      engine?.sendCommand("envAttack");
    },
    [update, engine],
  );

  const onPointerUp = useCallback(() => {
    engine?.sendCommand("envRelease");
  }, [engine]);

  const jitterWidth = positionJitter * width * 0.25;

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => {
        if (e.buttons > 0) update(e);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "relative",
        width,
        height,
        cursor: "crosshair",
        touchAction: "none",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      <WaveformView buffer={buffer} width={width} height={height} />

      {/* Position indicator */}
      <div
        style={{
          position: "absolute",
          left: `${position * 100}%`,
          top: 0,
          bottom: 0,
          width: 2,
          marginLeft: -1,
          backgroundColor: "rgba(0,0,0,0.7)",
          pointerEvents: "none",
        }}
      />

      {/* Jitter range */}
      <div
        style={{
          position: "absolute",
          left: `calc(${position * 100}% - ${jitterWidth / 2}px)`,
          top: 0,
          bottom: 0,
          width: jitterWidth,
          backgroundColor: "rgba(0,0,0,0.08)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
