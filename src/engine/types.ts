export interface ParamDefinition {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
}

export interface SynthEngine {
  readonly name: string;
  readonly paramDefs: ParamDefinition[];

  /**
   * Create and connect the engine's audio nodes to the given destination.
   * Returns a disconnect function.
   */
  connect(
    context: AudioContext,
    destination: AudioNode,
  ): Promise<() => void>;

  /** Transfer a decoded audio buffer to the engine. */
  loadBuffer(buffer: AudioBuffer): void;

  /** Set a parameter value (already clamped by ParamStore). */
  setParam(key: string, value: number): void;

  /** Send a named command (e.g. envelope hold/release). */
  sendCommand(command: string, data?: unknown): void;
}
