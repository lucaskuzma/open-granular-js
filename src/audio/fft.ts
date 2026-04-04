/** In-place radix-2 Cooley-Tukey FFT. Arrays must be equal length, power of 2. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;

  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tmpRe = re[i]!;
      const tmpIm = im[i]!;
      re[i] = re[j]!;
      im[i] = im[j]!;
      re[j] = tmpRe;
      im[j] = tmpIm;
    }
  }

  for (let len = 2; len <= n; len *= 2) {
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1,
        curIm = 0;
      const half = len / 2;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const bRe = re[b]!;
        const bIm = im[b]!;
        const aRe = re[a]!;
        const aIm = im[a]!;
        const tRe = curRe * bRe - curIm * bIm;
        const tIm = curRe * bIm + curIm * bRe;
        re[b] = aRe - tRe;
        im[b] = aIm - tIm;
        re[a] = aRe + tRe;
        im[a] = aIm + tIm;
        const next = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = next;
      }
    }
  }
}

function mixChannels(buffer: AudioBuffer): Float32Array {
  const length = buffer.length;
  const numCh = buffer.numberOfChannels;
  if (numCh === 1) return buffer.getChannelData(0);

  const mixed = new Float32Array(length);
  const scale = 1 / numCh;
  for (let ch = 0; ch < numCh; ch++) {
    const src = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mixed[i]! += src[i]! * scale;
  }
  return mixed;
}

/**
 * STFT spectrogram of an AudioBuffer.
 * Returns a flat Float64Array of shape [numFrames × numBins] in row-major order,
 * where each value is a raw magnitude.
 */
export function computeSpectrogram(
  buffer: AudioBuffer,
  numFrames: number,
  fftSize = 1024,
): { data: Float64Array; numBins: number; numFrames: number } {
  const samples = mixChannels(buffer);
  const numBins = fftSize / 2;
  const hop = Math.max(1, Math.floor(samples.length / numFrames));
  const frames = Math.min(numFrames, Math.ceil(samples.length / hop));
  const out = new Float64Array(frames * numBins);

  for (let f = 0; f < frames; f++) {
    const offset = f * hop;
    const re = new Float64Array(fftSize);
    const im = new Float64Array(fftSize);

    for (let i = 0; i < fftSize; i++) {
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
      re[i] = (samples[offset + i] ?? 0) * hann;
    }

    fft(re, im);

    const row = f * numBins;
    for (let i = 0; i < numBins; i++) {
      const r = re[i]!;
      const m = im[i]!;
      out[row + i] = Math.sqrt(r * r + m * m);
    }
  }

  return { data: out, numBins, numFrames: frames };
}
