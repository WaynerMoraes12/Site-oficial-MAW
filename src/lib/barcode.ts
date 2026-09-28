export interface Bar {
  x: number;
  width: number;
}

// Código de barras decorativo e determinístico (mesmo desenho a cada build).
export function barcodeBars(seed: number, width: number): Bar[] {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const bars: Bar[] = [];
  let x = 0;
  while (x < width) {
    const w = 1 + Math.floor(rand() * 3.2);
    if (rand() > 0.42 && x + w <= width) bars.push({ x, width: w });
    x += w + 1;
  }
  return bars;
}
