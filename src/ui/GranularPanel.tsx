import type { ParamStore } from "../engine/ParamStore";
import type { SynthEngine } from "../engine/types";
import { XYPad } from "./components/XYPad";
import { LabelControl } from "./components/LabelControl";
import { PositionControl } from "./components/PositionControl";

interface GranularPanelProps {
  store: ParamStore;
  engine: SynthEngine | null;
  buffer: AudioBuffer | null;
}

const PAD_SIZE = 96;

export function GranularPanel({ store, engine, buffer }: GranularPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>
      {/* Waveform + position scrubber */}
      <PositionControl
        store={store}
        engine={engine}
        buffer={buffer}
        width={4 * PAD_SIZE + 3 * 48}
      />

      {/* Main XY pads: position, size, spread, pitch */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <PadWithEnv store={store} xKey="position" yKey="positionJitter" envKey="env1Position" label="position" />
        <PadWithEnv store={store} xKey="size" yKey="sizeJitter" envKey="env1Size" label="size" />
        <PadWithEnv store={store} xKey="spread" yKey="spreadJitter" envKey="env1Spread" label="spread" />
        <PadWithEnv store={store} xKey="pitch" yKey="pitchJitter" envKey="env1Pitch" label="pitch" />
      </div>

      {/* LFO mod depth labels */}
      <Section title="LFO 1">
        <LabelControl store={store} paramKey="lfo1Position" label="pos" />
        <LabelControl store={store} paramKey="lfo1Size" label="size" />
        <LabelControl store={store} paramKey="lfo1Spread" label="sprd" />
        <LabelControl store={store} paramKey="lfo1Pitch" label="pitch" />
      </Section>

      <Section title="LFO 2">
        <LabelControl store={store} paramKey="lfo2Position" label="pos" />
        <LabelControl store={store} paramKey="lfo2Size" label="size" />
        <LabelControl store={store} paramKey="lfo2Spread" label="sprd" />
        <LabelControl store={store} paramKey="lfo2Pitch" label="pitch" />
      </Section>

      {/* Single-axis pads and controls */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <XYPad store={store} xKey="density" label="density" size={PAD_SIZE} />
        <XYPad store={store} xKey="ramp" label="ramp" size={PAD_SIZE} />
        <XYPad store={store} xKey="lfo1Period" label="lfo1 rate" size={PAD_SIZE} />
        <XYPad store={store} xKey="lfo2Period" label="lfo2 rate" size={PAD_SIZE} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <XYPad store={store} xKey="env1Attack" label="attack" size={PAD_SIZE} />
        <XYPad store={store} xKey="env1Release" label="release" size={PAD_SIZE} />
        <XYPad store={store} xKey="volume" label="volume" size={PAD_SIZE} />
      </div>
    </div>
  );
}

/** XY pad paired with an envelope depth label control. */
function PadWithEnv({
  store,
  xKey,
  yKey,
  envKey,
  label,
}: {
  store: ParamStore;
  xKey: string;
  yKey: string;
  envKey: string;
  label: string;
}) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
      <XYPad store={store} xKey={xKey} yKey={yKey} label={label} size={PAD_SIZE} />
      <LabelControl store={store} paramKey={envKey} label="env" />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 4, userSelect: "none" }}>
        {title}
      </div>
      <div style={{ display: "flex", gap: 16 }}>{children}</div>
    </div>
  );
}
