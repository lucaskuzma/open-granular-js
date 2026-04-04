import { useMemo } from "react";
import type { ParamStore } from "../engine/ParamStore";
import type { SynthEngine } from "../engine/types";
import type { SlotManager } from "../control/SlotManager";
import { computeSpectrogram } from "../audio/fft";
import { XYPad } from "./components/XYPad";
import { HarmonicsPad } from "./components/HarmonicsPad";
import { LabelControl } from "./components/LabelControl";
import { PositionControl } from "./components/PositionControl";
import { TogglePad } from "./components/TogglePad";
import { SlotRow } from "./components/SlotRow";
import { useParam } from "./hooks";

interface GranularPanelProps {
  store: ParamStore;
  engine: SynthEngine | null;
  buffer: AudioBuffer | null;
  slotManager: SlotManager;
}

const PAD_SIZE = 96;
const SCRUBBER_WIDTH = 4 * PAD_SIZE + 3 * 48;

export function GranularPanel({ store, engine, buffer, slotManager }: GranularPanelProps) {
  const hold = useParam(store, "hold") >= 0.5;
  const spectrogram = useMemo(
    () => buffer ? computeSpectrogram(buffer, SCRUBBER_WIDTH) : null,
    [buffer],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>
      {/* Waveform + position scrubber */}
      <PositionControl
        store={store}
        engine={engine}
        spectrogram={spectrogram}
        slotManager={slotManager}
        width={SCRUBBER_WIDTH}
      />

      {/* Main XY pads with modulation depths underneath */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <PadWithMods store={store} slotManager={slotManager} xKey="position" yKey="positionJitter" envKey="env1Position" lfo1Key="lfo1Position" lfo2Key="lfo2Position" label="position" />
        <PadWithMods store={store} slotManager={slotManager} xKey="size" yKey="sizeJitter" envKey="env1Size" lfo1Key="lfo1Size" lfo2Key="lfo2Size" label="size" />
        <PadWithMods store={store} slotManager={slotManager} xKey="spread" yKey="spreadJitter" envKey="env1Spread" lfo1Key="lfo1Spread" lfo2Key="lfo2Spread" label="spread" />
        <PadWithMods store={store} slotManager={slotManager} xKey="pitch" yKey="pitchJitter" envKey="env1Pitch" lfo1Key="lfo1Pitch" lfo2Key="lfo2Pitch" label="pitch" />
      </div>

      {/* Harmonic drawbars + master harmonics fader */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "flex-start" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <XYPad store={store} slotManager={slotManager} xKey="drawbar1" label="16'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar1")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar2" label="5⅓'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar2")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar3" label="8'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar3")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar4" label="4'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar4")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar5" label="2⅔'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar5")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar6" label="2'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar6")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar7" label="1⅗'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar7")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar8" label="1⅓'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar8")} />
          <XYPad store={store} slotManager={slotManager} xKey="drawbar9" label="1'" size={PAD_SIZE} vertical onDragStart={() => slotManager.excludeFromInterp("drawbar9")} />
        </div>
        <HarmonicsPad store={store} slotManager={slotManager} />
      </div>

      {/* Single-axis pads and controls */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <XYPad store={store} slotManager={slotManager} xKey="density" label="density" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("density")} />
        <XYPad store={store} slotManager={slotManager} xKey="ramp" label="ramp" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("ramp")} />
        <XYPad store={store} slotManager={slotManager} xKey="lfo1Period" label="lfo1 period" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("lfo1Period")} />
        <XYPad store={store} slotManager={slotManager} xKey="lfo2Period" label="lfo2 period" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("lfo2Period")} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <XYPad store={store} slotManager={slotManager} xKey="env1Attack" label="attack" size={PAD_SIZE} disabled={hold} onDragStart={() => slotManager.excludeFromInterp("env1Attack")} />
        <XYPad store={store} slotManager={slotManager} xKey="env1Release" label="release" size={PAD_SIZE} disabled={hold} onDragStart={() => slotManager.excludeFromInterp("env1Release")} />
        <TogglePad store={store} paramKey="hold" label="hold" />
        <XYPad store={store} slotManager={slotManager} xKey="volume" label="volume" size={PAD_SIZE} onDragStart={() => slotManager.excludeFromInterp("volume")} />
      </div>

      {/* Slot row */}
      <SlotRow slotManager={slotManager} pitchAt={spectrogram?.pitchAt ?? null} />
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
      <XYPad store={store} slotManager={slotManager} xKey={xKey} yKey={yKey} label={label} size={PAD_SIZE} onDragStart={() => { slotManager.excludeFromInterp(xKey, yKey); onDragStart?.(); }} />
      <div style={{ display: "flex", gap: 4 }}>
        <LabelControl store={store} paramKey={envKey} label="env" onDragStart={() => slotManager.excludeFromInterp(envKey)} />
        <LabelControl store={store} paramKey={lfo1Key} label="lfo1" onDragStart={() => slotManager.excludeFromInterp(lfo1Key)} />
        <LabelControl store={store} paramKey={lfo2Key} label="lfo2" onDragStart={() => slotManager.excludeFromInterp(lfo2Key)} />
      </div>
    </div>
  );
}
