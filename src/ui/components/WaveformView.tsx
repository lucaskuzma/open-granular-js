import { useRef, useEffect } from "react";

interface WaveformViewProps {
  buffer: AudioBuffer | null;
  width: number;
  height: number;
}

export function WaveformView({ buffer, width, height }: WaveformViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    if (!buffer) {
      ctx.fillStyle = "#999";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No audio loaded", width / 2, height / 2);
      return;
    }

    const data = buffer.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / width));
    const mid = height / 2;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const start = x * step;
      let min = 0;
      let max = 0;
      for (let j = 0; j < step; j++) {
        const s = data[start + j] ?? 0;
        if (s < min) min = s;
        if (s > max) max = s;
      }
      const yMin = mid + min * mid;
      const yMax = mid + max * mid;
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();
  }, [buffer, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block", borderRadius: 4 }}
    />
  );
}
