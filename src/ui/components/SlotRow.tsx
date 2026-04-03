import { useEffect, useState } from "react";
import { SlotManager, SLOT_KEYS, type SlotData } from "../../control/SlotManager";
import { colorFor, DISABLED } from "../colors";

interface SlotRowProps {
  slotManager: SlotManager;
}

const SLOT_SIZE = 32;
const HALF = SLOT_SIZE / 2;

const QUADRANTS: { key: string; jitterKey: string; top: number; left: number }[] = [
  { key: "position", jitterKey: "positionJitter", top: 0, left: 0 },
  { key: "size", jitterKey: "sizeJitter", top: 0, left: HALF },
  { key: "spread", jitterKey: "spreadJitter", top: HALF, left: 0 },
  { key: "pitch", jitterKey: "pitchJitter", top: HALF, left: HALF },
];

function quadrantColor(data: SlotData | null, key: string, jitterKey: string): string {
  if (!data) return DISABLED;
  return colorFor(data[key] ?? 0, data[jitterKey] ?? 0);
}

export function SlotRow({ slotManager }: SlotRowProps) {
  const [, setTick] = useState(0);
  useEffect(() => slotManager.subscribe(() => setTick((n) => n + 1)), [slotManager]);

  const active = slotManager.currentActiveSlot;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
      {/* BPM / note display */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 48 }}>
        <span style={{ fontSize: 11, color: "#666", fontVariantNumeric: "tabular-nums" }}>
          {slotManager.bpm} bpm
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {slotManager.divisionLabel}
        </span>
      </div>

      {/* Slots */}
      {SLOT_KEYS.map((letter, i) => {
        const data = slotManager.slots[i] ?? null;
        const isActive = i === active;
        return (
          <div key={letter} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div
              style={{
                width: SLOT_SIZE,
                height: SLOT_SIZE,
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                border: isActive ? "2px solid #000" : "1px solid rgba(0,0,0,0.15)",
                boxSizing: "border-box",
              }}
            >
              {QUADRANTS.map(({ key, jitterKey, top, left }) => (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    top,
                    left,
                    width: HALF,
                    height: HALF,
                    backgroundColor: quadrantColor(data, key, jitterKey),
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "#999", userSelect: "none" }}>{letter}</span>
          </div>
        );
      })}
    </div>
  );
}
