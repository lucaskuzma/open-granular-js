/**
 * Matches GrainSwift's Style.colorFor:
 *   Color(red: 1.0 - y, green: 1.0 - x, blue: 1.0, opacity: 0.5)
 */
export function colorFor(x: number, y: number): string {
  const r = Math.round((1 - y) * 255);
  const g = Math.round((1 - x) * 255);
  return `rgba(${r}, ${g}, 255, 0.5)`;
}

export const DISABLED = "rgba(64, 64, 64, 1)";
