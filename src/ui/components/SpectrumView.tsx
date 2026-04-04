import { useRef, useEffect } from "react";
import type { SpectrogramData } from "../../audio/fft";

interface SpectrumViewProps {
  spectrogram: SpectrogramData | null;
  width: number;
  height: number;
}

const DB_FLOOR = -60;

export function SpectrumView({ spectrogram, width, height }: SpectrumViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(width * dpr);
    const ph = Math.round(height * dpr);
    canvas.width = pw;
    canvas.height = ph;

    if (!spectrogram) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#999";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No audio loaded", width / 2, height / 2);
      return;
    }

    const { data, numBins, numFrames } = spectrogram;

    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i]! > peak) peak = data[i]!;
    }
    if (peak === 0) peak = 1;

    const img = ctx.createImageData(pw, ph);
    const px = img.data;

    for (let x = 0; x < pw; x++) {
      const frame = Math.min(Math.floor((x * numFrames) / pw), numFrames - 1);
      const row = frame * numBins;

      for (let y = 0; y < ph; y++) {
        const freqT = 1 - y / ph;
        const bin = Math.min(Math.floor(freqT * numBins), numBins - 1);
        const raw = data[row + bin]! / peak;

        const db = 20 * Math.log10(Math.max(raw, 1e-10));
        const m = Math.max(0, 1 - db / DB_FLOOR);

        const idx = (y * pw + x) * 4;
        px[idx] = Math.round(255 * (1 - m * freqT));
        px[idx + 1] = Math.round(255 - m * 127);
        px[idx + 2] = 255;
        px[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
  }, [spectrogram, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block", borderRadius: 4 }}
    />
  );
}
