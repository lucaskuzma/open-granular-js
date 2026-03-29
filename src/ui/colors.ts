/** Derive a background hue from two normalized values, matching Swift's colorFor. */
export function colorFor(x: number, y: number): string {
  const hue = (x * 240 + y * 120) % 360;
  return `hsl(${hue}, 40%, 18%)`;
}
