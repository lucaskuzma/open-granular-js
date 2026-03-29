import type { ParamStore } from "../engine/ParamStore";

const CHANNEL_NAME = "granular-sync";

interface ParamMessage {
  kind: "param";
  key: string;
  value: number;
}

interface CommandMessage {
  kind: "command";
  command: string;
  data?: unknown;
}

type SyncMessage = ParamMessage | CommandMessage;

/**
 * Syncs parameter changes across browser tabs/windows via BroadcastChannel.
 * Incoming messages write to ParamStore; local changes are broadcast out.
 */
export class BroadcastController {
  private channel: BroadcastChannel | null = null;
  private unsubscribe: (() => void) | null = null;
  private suppressEcho = false;

  constructor(
    private store: ParamStore,
    private onCommand?: (command: string, data?: unknown) => void,
  ) {}

  start() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (e: MessageEvent<SyncMessage>) => {
      this.handleIncoming(e.data);
    };

    this.unsubscribe = this.store.subscribeAll((key, value) => {
      if (this.suppressEcho) return;
      this.channel?.postMessage({ kind: "param", key, value } satisfies ParamMessage);
    });
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.channel?.close();
    this.channel = null;
  }

  sendCommand(command: string, data?: unknown) {
    this.channel?.postMessage({ kind: "command", command, data } satisfies CommandMessage);
  }

  private handleIncoming(msg: SyncMessage) {
    switch (msg.kind) {
      case "param":
        this.suppressEcho = true;
        this.store.set(msg.key, msg.value);
        this.suppressEcho = false;
        break;
      case "command":
        this.onCommand?.(msg.command, msg.data);
        break;
    }
  }
}
