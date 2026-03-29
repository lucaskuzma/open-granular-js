import type { ParamStore } from "../engine/ParamStore";

export interface MidiMapping {
  channel: number;
  cc: number;
  paramKey: string;
}

/**
 * Bridges Web MIDI API input to ParamStore.
 * Call start() to request MIDI access and begin listening.
 */
export class MidiController {
  private access: MIDIAccess | null = null;
  private mappings: MidiMapping[] = [];

  constructor(private store: ParamStore) {}

  setMappings(mappings: MidiMapping[]) {
    this.mappings = mappings;
  }

  async start(): Promise<void> {
    if (!navigator.requestMIDIAccess) return;
    this.access = await navigator.requestMIDIAccess();
    this.access.inputs.forEach((input) => {
      input.onmidimessage = (e) => this.handleMessage(e);
    });
    this.access.onstatechange = () => {
      this.access?.inputs.forEach((input) => {
        if (!input.onmidimessage) {
          input.onmidimessage = (e) => this.handleMessage(e);
        }
      });
    };
  }

  stop() {
    this.access?.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    this.access = null;
  }

  private handleMessage(e: MIDIMessageEvent) {
    const data = e.data;
    if (!data || data.length < 3) return;

    const status = data[0]!;
    const isCC = (status & 0xf0) === 0xb0;
    if (!isCC) return;

    const channel = (status & 0x0f) + 1;
    const cc = data[1]!;
    const value = data[2]! / 127;

    for (const mapping of this.mappings) {
      if (mapping.channel === channel && mapping.cc === cc) {
        const def = this.store.getDef(mapping.paramKey);
        if (def) {
          this.store.set(mapping.paramKey, def.min + value * (def.max - def.min));
        }
      }
    }
  }
}
