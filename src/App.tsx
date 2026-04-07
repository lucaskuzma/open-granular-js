import { useState, useRef, useCallback, useEffect } from "react";
import { AudioManager } from "./audio/AudioManager";
import {
  DEFAULT_AUDIO_URL,
  loadBufferFromUrl,
  loadBufferFromFile,
} from "./audio/BufferLoader";
import { ParamStore } from "./engine/ParamStore";
import { GranularEngine } from "./engine/granular/GranularEngine";
import { SlotManager, SLOT_KEYS } from "./control/SlotManager";
import { GranularPanel } from "./ui/GranularPanel";
import { getRecentFiles, addRecentFile } from "./storage/recentFiles";

const audioManager = new AudioManager();
const paramStore = new ParamStore();
const granularEngine = new GranularEngine();
const slotManager = new SlotManager(paramStore);

paramStore.load(granularEngine.paramDefs);

export default function App() {
  const [running, setRunning] = useState(false);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [status, setStatus] = useState("Stopped");
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>(getRecentFiles);
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
        slotManager.clearAll();
        setBuffer(buf);
        setCurrentFileName(file.name);
        if (running) {
          granularEngine.loadBuffer(buf);
        }
        setStatus(running ? "Running" : "File loaded");
        setRecentFiles(addRecentFile(file.name));
      } catch (err) {
        setStatus(`Decode error: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [running],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();

      const div = parseInt(key, 10);
      if (div >= 1 && div <= 9) {
        slotManager.setDivision(div);
        return;
      }

      // Slot keys
      const slotIndex = (SLOT_KEYS as readonly string[]).indexOf(key);
      if (slotIndex === -1) return;

      if (e.shiftKey) {
        slotManager.save(slotIndex);
      } else {
        slotManager.recall(slotIndex);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

        {recentFiles.length > 0 && (
          <select
            value={currentFileName ?? ""}
            onChange={(e) => {
              if (e.target.value) fileInputRef.current?.click();
            }}
            style={selectStyle}
          >
            <option value="" disabled>
              Recent files…
            </option>
            {recentFiles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}

        <span style={{ fontSize: 12, color: "#666" }}>{status}</span>
      </div>

      {/* Synth panel */}
      <GranularPanel store={paramStore} engine={granularEngine} buffer={buffer} slotManager={slotManager} />
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

const selectStyle: React.CSSProperties = {
  padding: "4px 8px",
  backgroundColor: "#f0f0f0",
  color: "#000",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 13,
  maxWidth: 192,
  cursor: "pointer",
};
