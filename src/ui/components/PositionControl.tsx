import { useRef, useCallback, useEffect, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import type { ParamStore } from "../../engine/ParamStore";
import type { SynthEngine } from "../../engine/types";
import type { SpectrogramData } from "../../audio/fft";
import { SlotManager, SLOT_KEYS } from "../../control/SlotManager";
import { useParam } from "../hooks";
import { SpectrumView } from "./SpectrumView";

interface PositionControlProps {
  store: ParamStore;
  engine: SynthEngine | null;
  spectrogram: SpectrogramData | null;
  slotManager: SlotManager;
  width: number;
  height?: number;
}

export function PositionControl({
  store,
  engine,
  spectrogram,
  slotManager,
  width,
  height = 96,
}: PositionControlProps) {
  const ref = useRef<HTMLDivElement>(null);
  const position = useParam(store, "position");
  const positionJitter = useParam(store, "positionJitter");

  const [, setTick] = useState(0);
  useEffect(() => slotManager.subscribe(() => setTick((n) => n + 1)), [slotManager]);

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

  const hold = useParam(store, "hold") >= 0.5;

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      slotManager.excludeFromInterp("position", "positionJitter");
      update(e);
      if (!hold) engine?.sendCommand("envAttack");
    },
    [update, engine, slotManager, hold],
  );

  const onPointerUp = useCallback(() => {
    if (!hold) engine?.sendCommand("envRelease");
  }, [engine, hold]);

  const MAX_JITTER = 176400;
  const jitterWidth = spectrogram
    ? (2 * positionJitter * positionJitter * MAX_JITTER / spectrogram.bufferLength) * width
    : 0;

  const pitchClass = spectrogram ? spectrogram.pitchAt(position) : "";

  return (
    <>
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
      <SpectrumView spectrogram={spectrogram} width={width} height={height} />

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

      {/* Pitch class label */}
      {pitchClass && (
        <span
          style={{
            position: "absolute",
            left: `${position * 100}%`,
            bottom: 4,
            transform: "translateX(-50%)",
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(0,0,0,0.7)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {pitchClass}
        </span>
      )}

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

    {/* Slot position markers */}
    <div style={{ position: "relative", width, height: 16 }}>
      {SLOT_KEYS.map((letter, i) => {
        const data = slotManager.slots[i];
        if (!data) return null;
        const pos = data.position ?? 0;
        return (
          <span
            key={letter}
            style={{
              position: "absolute",
              left: `${pos * 100}%`,
              transform: "translateX(-50%)",
              fontSize: 11,
              fontWeight: 600,
              color: "#999",
              userSelect: "none",
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
    </>
  );
}
