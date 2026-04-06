import type { ParamDefinition } from "../types";

// All ranges derived from GrainSwift's GrainControl.swift.
// Sample-count ranges assume 44100 Hz; the processor adapts at runtime.

export const GRANULAR_PARAMS: ParamDefinition[] = [
  // --- Core ---
  { key: "density",   label: "Density",   min: 0.01, max: 1,     default: 0.1 },
  { key: "position",  label: "Position",  min: 0,    max: 1,     default: 0.5 },
  { key: "size",      label: "Size",      min: 0,    max: 1,     default: 0.1 },
  { key: "spread",    label: "Spread",    min: 0,    max: 1,     default: 0   },
  { key: "ramp",      label: "Ramp",      min: 0,    max: 1,     default: 0.5 },
  { key: "pitch",     label: "Pitch",     min: 0,    max: 1,     default: 0.5 },
  { key: "volume",    label: "Volume",    min: 0,    max: 1,     default: 0.8 },

  // --- Jitters (all normalized 0-1) ---
  { key: "positionJitter", label: "Pos Jitter",    min: 0, max: 1, default: 0 },
  { key: "sizeJitter",     label: "Size Jitter",   min: 0, max: 1, default: 0 },
  { key: "spreadJitter",   label: "Spread Jitter", min: 0, max: 1, default: 0 },
  { key: "pitchJitter",    label: "Pitch Jitter",  min: 0, max: 1, default: 0 },

  // --- LFO 1 ---
  { key: "lfo1Period",   label: "LFO1 Period",   min: 0, max: 1, default: 0.5 },
  { key: "lfo1Position", label: "LFO1 Pos",      min: 0, max: 1, default: 0 },
  { key: "lfo1Size",     label: "LFO1 Size",     min: 0, max: 1, default: 0 },
  { key: "lfo1Spread",   label: "LFO1 Spread",   min: 0, max: 1, default: 0 },
  { key: "lfo1Pitch",    label: "LFO1 Pitch",    min: 0, max: 1, default: 0 },
  { key: "lfo1HarmonicPosition", label: "LFO1 H-Pos",  min: 0, max: 1, default: 0 },
  { key: "lfo1HarmonicGain",     label: "LFO1 H-Gain", min: 0, max: 1, default: 0 },

  // --- LFO 2 ---
  { key: "lfo2Period",   label: "LFO2 Period",   min: 0, max: 1, default: 0.5 },
  { key: "lfo2Position", label: "LFO2 Pos",      min: 0, max: 1, default: 0 },
  { key: "lfo2Size",     label: "LFO2 Size",     min: 0, max: 1, default: 0 },
  { key: "lfo2Spread",   label: "LFO2 Spread",   min: 0, max: 1, default: 0 },
  { key: "lfo2Pitch",    label: "LFO2 Pitch",    min: 0, max: 1, default: 0 },
  { key: "lfo2HarmonicPosition", label: "LFO2 H-Pos",  min: 0, max: 1, default: 0 },
  { key: "lfo2HarmonicGain",     label: "LFO2 H-Gain", min: 0, max: 1, default: 0 },

  // --- Harmonic LFO tilt (shared across LFO1/LFO2) ---
  { key: "harmonicLfoPositionTilt", label: "H-Pos Tilt",  min: 0, max: 1, default: 1 },
  { key: "harmonicLfoGainTilt",     label: "H-Gain Tilt", min: 0, max: 1, default: 1 },

  // --- Envelope ---
  { key: "env1Attack",   label: "Env Attack",    min: 0, max: 1, default: 0.25 },
  { key: "env1Release",  label: "Env Release",   min: 0, max: 1, default: 0.25 },
  { key: "hold",         label: "Hold",          min: 0, max: 1, default: 1    },
  { key: "env1Position", label: "Env Pos",       min: 0, max: 1, default: 0 },
  { key: "env1Size",     label: "Env Size",      min: 0, max: 1, default: 0 },
  { key: "env1Spread",   label: "Env Spread",    min: 0, max: 1, default: 0 },
  { key: "env1Pitch",    label: "Env Pitch",     min: 0, max: 1, default: 0 },

  // --- Harmonic drawbars (probability weights, Hammond order, 7th harmonic skipped) ---
  { key: "drawbar1", label: "16'",    min: 0, max: 1, default: 0 },
  { key: "drawbar2", label: "5⅓'",   min: 0, max: 1, default: 0 },
  { key: "drawbar3", label: "8'",     min: 0, max: 1, default: 1 },
  { key: "drawbar4", label: "4'",     min: 0, max: 1, default: 0 },
  { key: "drawbar5", label: "2⅔'",   min: 0, max: 1, default: 0 },
  { key: "drawbar6", label: "2'",     min: 0, max: 1, default: 0 },
  { key: "drawbar7", label: "1⅗'",   min: 0, max: 1, default: 0 },
  { key: "drawbar8", label: "1⅓'",   min: 0, max: 1, default: 0 },
  { key: "drawbar9", label: "1'",     min: 0, max: 1, default: 0 },
];
