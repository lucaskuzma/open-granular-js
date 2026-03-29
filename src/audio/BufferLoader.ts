export const DEFAULT_AUDIO_URL = "/audio/default.wav";

export async function loadBufferFromUrl(
  context: AudioContext,
  url: string,
): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return context.decodeAudioData(arrayBuffer);
}

export async function loadBufferFromFile(
  context: AudioContext,
  file: File,
): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return context.decodeAudioData(arrayBuffer);
}
