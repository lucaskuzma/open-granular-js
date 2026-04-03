import type { ParamStore } from "../engine/ParamStore";
import type { SynthEngine } from "../engine/types";
import type { SlotManager } from "../control/SlotManager";
import { XYPad } from "./components/XYPad";
import { LabelControl } from "./components/LabelControl";
import { PositionControl } from "./components/PositionControl";
import { SlotRow } from "./components/SlotRow";

interface GranularPanelProps {
  store: ParamStore;
  engine: SynthEngine | null;
  buffer: AudioBuffer | null;
  slotManager: SlotManager;
}

const PAD_SIZE = 96;

export function GranularPanel({ store, engine, buffer, slotManager }: GranularPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>
      {/* Waveform + position scrubber */}
      <PositionControl
        store={store}
        engine={engine}
        buffer={buffer}
        slotManager={slotManager}
        width={4 * PAD_SIZE + 3 * 48}
      />

      {/* Main XY pads with modulation depths underneath */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <PadWithMods store={store} slotManager={slotManager} xKey="position" yKey="positionJitter" envKey="env1Position" lfo1Key="lfo1Position" lfo2Key="lfo2Position" label="position" onDragStart={() => engine?.sendCommand("envHold")} />
        <PadWithMods store={store} slotManager={slotManager} xKey="size" yKey="sizeJitter" envKey="env1Size" lfo1Key="lfo1Size" lfo2Key="lfo2Size" label="size" />
        <PadWithMods store={store} slotManager={slotManager} xKey="spread" yKey="spreadJitter" envKey="env1Spread" lfo1Key="lfo1Spread" lfo2Key="lfo2Spread" label="spread" />
        <PadWithMods store={store} slotManager={slotManager} xKey="pitch" yKey="pitchJitter" envKey="env1Pitch" lfo1Key="lfo1Pitch" lfo2Key="lfo2Pitch" label="pitch" />
      </div>

      {/* Single-axis pads and controls */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <XYPad store={store} xKey="density" label="density" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("density")} />
        <XYPad store={store} xKey="ramp" label="ramp" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("ramp")} />
        <XYPad store={store} xKey="lfo1Period" label="lfo1 rate" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("lfo1Period")} />
        <XYPad store={store} xKey="lfo2Period" label="lfo2 rate" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("lfo2Period")} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <XYPad store={store} xKey="env1Attack" label="attack" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("env1Attack")} />
        <XYPad store={store} xKey="env1Release" label="release" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("env1Release")} />
        <XYPad store={store} xKey="volume" label="volume" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("volume")} />
      </div>

      {/* Slot row */}
      <SlotRow slotManager={slotManager} />
    </div>
  );
}

/** XY pad with env, lfo1, lfo2 depth controls underneath. */
function PadWithMods({
  store,
  slotManager,
  xKey,
  yKey,
  envKey,
  lfo1Key,
  lfo2Key,
  label,
  onDragStart,
}: {
  store: ParamStore;
  slotManager: SlotManager;
  xKey: string;
  yKey: string;
  envKey: string;
  lfo1Key: string;
  lfo2Key: string;
  label: string;
  onDragStart?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <XYPad store={store} xKey={xKey} yKey={yKey} label={label} size={PAD_SIZE} onDragStart={() => { slotManager.excludeFromInterp(xKey, yKey); onDragStart?.(); }} />
      <div style={{ display: "flex", gap: 4 }}>
        <LabelControl store={store} paramKey={envKey} label="env" onDragStart={() => slotManager.excludeFromInterp(envKey)} />
        <LabelControl store={store} paramKey={lfo1Key} label="lfo1" onDragStart={() => slotManager.excludeFromInterp(lfo1Key)} />
        <LabelControl store={store} paramKey={lfo2Key} label="lfo2" onDragStart={() => slotManager.excludeFromInterp(lfo2Key)} />
      </div>
    </div>
  );
}
