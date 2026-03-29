import type { SynthEngine, ParamDefinition } from "../types";
import { GRANULAR_PARAMS } from "./GranularParams";

export class GranularEngine implements SynthEngine {
  readonly name = "Granular";
  readonly paramDefs: ParamDefinition[] = GRANULAR_PARAMS;

  private node: AudioWorkletNode | null = null;

  async connect(
    context: AudioContext,
    destination: AudioNode,
  ): Promise<() => void> {
    await context.audioWorklet.addModule("/granular-processor.js");

    this.node = new AudioWorkletNode(context, "granular-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    this.node.connect(destination);

    return () => {
      this.node?.disconnect();
      this.node = null;
    };
  }

  loadBuffer(buffer: AudioBuffer) {
    if (!this.node) return;

    // Copy channel data so the original AudioBuffer stays usable for UI rendering.
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      channels.push(new Float32Array(buffer.getChannelData(ch)));
    }

    this.node.port.postMessage(
      { type: "loadBuffer", channelData: channels },
      channels.map((c) => c.buffer),
    );
  }

  setParam(key: string, value: number) {
    const param = this.node?.parameters.get(key);
    if (param) {
      param.setValueAtTime(value, 0);
    }
  }

  sendCommand(command: string, data?: unknown) {
    if (!this.node) return;
    this.node.port.postMessage({ type: command, ...(data as object) });
  }
}
