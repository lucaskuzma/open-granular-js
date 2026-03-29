import { useState, useRef, useCallback } from "react";
import { AudioManager } from "./audio/AudioManager";
import {
  DEFAULT_AUDIO_URL,
  loadBufferFromUrl,
  loadBufferFromFile,
} from "./audio/BufferLoader";
import { ParamStore } from "./engine/ParamStore";
import { GranularEngine } from "./engine/granular/GranularEngine";
import { GranularPanel } from "./ui/GranularPanel";

const audioManager = new AudioManager();
const paramStore = new ParamStore();
const granularEngine = new GranularEngine();

paramStore.load(granularEngine.paramDefs);

export default function App() {
  const [running, setRunning] = useState(false);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [status, setStatus] = useState("Stopped");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const start = useCallback(async () => {
    try {
      setStatus("Starting...");
      await audioManager.mountEngine(granularEngine);
      paramStore.bind(granularEngine);

      const ctx = audioManager.audioContext!;

      if (!buffer) {
        setStatus("Loading default audio...");
        try {
          const buf = await loadBufferFromUrl(ctx, DEFAULT_AUDIO_URL);
          granularEngine.loadBuffer(buf);
          setBuffer(buf);
        } catch {
          setStatus("No default audio found. Load a file.");
        }
      } else {
        granularEngine.loadBuffer(buffer);
      }

      await audioManager.resume();
      setRunning(true);
      setStatus("Running");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [buffer]);

  const stop = useCallback(async () => {
    await audioManager.suspend();
    setRunning(false);
    setStatus("Stopped");
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      const ctx = audioManager.audioContext ?? (await audioManager.init());
      setStatus("Decoding...");
      try {
        const buf = await loadBufferFromFile(ctx, file);
        setBuffer(buf);
        if (running) {
          granularEngine.loadBuffer(buf);
        }
        setStatus(running ? "Running" : "File loaded");
      } catch (err) {
        setStatus(`Decode error: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [running],
  );

  return (
    <div
      style={{
        backgroundColor: "#fff",
        color: "#000",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 16 }}>Open Granular</span>

        <button onClick={running ? stop : start} style={buttonStyle}>
          {running ? "Stop" : "Start"}
        </button>

        <button onClick={() => fileInputRef.current?.click()} style={buttonStyle}>
          Load File
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
          }}
        />

        <span style={{ fontSize: 12, color: "#666" }}>{status}</span>
      </div>

      {/* Synth panel */}
      <GranularPanel store={paramStore} engine={granularEngine} buffer={buffer} />
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "4px 16px",
  backgroundColor: "#f0f0f0",
  color: "#000",
  border: "1px solid #ccc",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
};
