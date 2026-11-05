import { describe, expect, it } from 'vitest';
import { embers, gnarledTree, rng, skyline } from '../../src/lib/scenery';

// todos os pontos por onde um caminho SVG passa (M, L, Q, H, V e os relativos h, v que os cenários usam)
const points = (d: string): [number, number][] => {
  const out: [number, number][] = [];
  let x = 0;
  let y = 0;
  for (const [, cmd, args] of d.matchAll(/([MLQHVhvz])([^MLQHVhvz]*)/g)) {
    const n = (args.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (cmd === 'M' || cmd === 'L' || cmd === 'Q') {
      for (let i = 0; i < n.length; i += 2) out.push([n[i], n[i + 1]]);
      [x, y] = [n[n.length - 2], n[n.length - 1]];
    } else if (cmd === 'H') out.push([(x = n[0]), y]);
    else if (cmd === 'V') out.push([x, (y = n[0])]);
    else if (cmd === 'h') out.push([(x += n[0]), y]);
    else if (cmd === 'v') out.push([x, (y += n[0])]);
  }
  return out;
};

describe('rng', () => {
  it('repeats the same sequence for the same seed and stays in [0, 1)', () => {
    const a = rng(7);
    const b = rng(7);
    const seq = Array.from({ length: 200 }, () => a());
    expect(seq).toEqual(Array.from({ length: 200 }, () => b()));
    for (const v of seq) expect(v >= 0 && v < 1).toBe(true);
    expect(rng(8)()).not.toBe(rng(7)());
  });
});

describe('gnarledTree', () => {
  const tree = gnarledTree(13, 600, 760);
  it('is drawn the same on every build', () => {
    expect(gnarledTree(13, 600, 760)).toEqual(tree);
    expect(gnarledTree(14, 600, 760)).not.toEqual(tree);
  });
  it('groups the limbs from the thick trunk to the thin twigs', () => {
    expect(tree.length).toBeGreaterThan(4);
    const widths = tree.map((l) => l.width);
    expect(widths).toEqual([...widths].sort((x, y) => y - x));
    expect(widths[0]).toBeGreaterThan(widths.at(-1)! * 8);
  });
  it('fits its box, standing on the ground', () => {
    const all = tree.flatMap((l) => points(l.d));
    expect(all.length).toBeGreaterThan(200);
    for (const [x, y] of all) {
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(600);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(760);
    }
    expect(Math.max(...all.map(([, y]) => y))).toBeCloseTo(760, 0);
  });
  it('stands on its trunk: no twig hangs below the base of the trunk', () => {
    // o grupo mais grosso é o pé do tronco; raiz pode chegar ao chão (e afina até 1/4 do tronco), graveto não
    const trunkBase = Math.max(...points(tree[0].d).map(([, y]) => y));
    const twigs = tree.filter((l) => l.width <= tree[0].width / 8).flatMap((l) => points(l.d));
    expect(trunkBase).toBeGreaterThan(700);
    expect(Math.max(...twigs.map(([, y]) => y))).toBeLessThan(trunkBase - 40);
  });
  it('stays light enough to inline in the page', () => {
    expect(tree.reduce((n, l) => n + l.d.length, 0)).toBeLessThan(16_000);
  });
});

describe('skyline', () => {
  const city = skyline(3, { width: 1440, height: 320, minTop: 40, maxTop: 210 });
  it('is drawn the same on every build', () => {
    expect(skyline(3, { width: 1440, height: 320, minTop: 40, maxTop: 210 })).toEqual(city);
  });
  it('covers the whole width, rising from the bottom edge', () => {
    const towers = points(city.towers);
    expect(Math.min(...towers.map(([x]) => x))).toBeLessThanOrEqual(0);
    expect(Math.max(...towers.map(([x]) => x))).toBeGreaterThanOrEqual(1440);
    expect(Math.max(...towers.map(([, y]) => y))).toBe(320);
    expect(Math.min(...towers.map(([, y]) => y))).toBeLessThan(40);
  });
  it('lights windows inside the drawing and stays light enough to inline', () => {
    const windows = city.windows.flatMap((d) => points(d));
    expect(windows.length).toBeGreaterThan(60);
    for (const [x, y] of windows) {
      expect(x).toBeGreaterThanOrEqual(-20);
      expect(x).toBeLessThanOrEqual(1460);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(320);
    }
    const size = city.towers.length + city.neon.length + city.windows.join('').length;
    expect(size).toBeLessThan(14_000);
  });
});

describe('embers', () => {
  it('scatters the asked number of sparks within their ranges', () => {
    const list = embers(5, 16);
    expect(list).toHaveLength(16);
    expect(embers(5, 16)).toEqual(list);
    for (const e of list) {
      expect(e.left).toBeGreaterThanOrEqual(0);
      expect(e.left).toBeLessThanOrEqual(100);
      expect(e.size).toBeGreaterThan(0);
      expect(e.duration).toBeGreaterThan(0);
      expect(e.delay).toBeLessThanOrEqual(0);
    }
  });
});
