// Cenários desenhados no build (árvore retorcida, cidade de neon, brasas): sorteio com semente fixa,
// então cada build gera exatamente o mesmo SVG e nada disso pesa no navegador.

// mulberry32: rápido, pequeno e repetível
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

export interface Limb {
  width: number;
  d: string;
}

// Árvore seca e retorcida: cada galho é feito de pedaços tortos e se abre em dois (às vezes três) mais finos.
// Devolve os galhos agrupados pela espessura, do tronco aos gravetos, já encaixados em w × h com a base no chão.
export function gnarledTree(seed: number, w: number, h: number): Limb[] {
  const r = rng(seed);
  const segs: { pts: number[]; width: number }[] = [];

  const grow = (x: number, y: number, angle: number, len: number, width: number, depth: number, root = false) => {
    const pieces = depth > 3 ? 3 : 2;
    let a = angle;
    let wd = width;
    for (let k = 0; k < pieces; k++) {
      a += (r() - 0.5) * 0.75;
      // galho pesado tende a vergar para os lados, não a apontar reto para cima
      a += (a + Math.PI / 2) * 0.06;
      const l = len / pieces;
      // o pé do tronco é y = 0 e para cima é negativo: galho que ia entrar no chão volta a subir (espelha o ângulo)
      // (o ângulo acumula além de ±π, então é o seno que diz se aponta para baixo)
      if (!root && Math.sin(a) > 0 && y + Math.sin(a) * l > -60) a = -a;
      const ex = x + Math.cos(a) * l;
      const ey = y + Math.sin(a) * l;
      const bend = (r() - 0.5) * l * 0.7;
      const mx = (x + ex) / 2 + Math.cos(a + Math.PI / 2) * bend;
      const my = (y + ey) / 2 + Math.sin(a + Math.PI / 2) * bend;
      segs.push({ pts: [x, y, mx, my, ex, ey], width: wd });
      x = ex;
      y = ey;
      wd *= 0.84;
    }
    if (depth === 0) return;
    const n = depth >= 4 && r() < 0.4 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (0.55 + r() * 0.5);
      grow(x, y, a + spread + (r() - 0.5) * 0.35, len * (0.66 + r() * 0.16), wd * 0.74, depth - 1);
    }
  };

  // tronco torto e raízes agarrando o chão: saem da base para os lados e para baixo (y cresce para baixo)
  grow(0, 0, -Math.PI / 2 + (r() - 0.5) * 0.25, 260, 38, 6);
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    const down = 0.35 + r() * 0.35;
    grow(side * 8, -4, side > 0 ? down : Math.PI - down, 46 + r() * 30, 18 - i * 2.5, 0, true);
  }

  // encaixa no quadro: mesma escala nos dois eixos, base no chão, centralizada
  const xs = segs.flatMap((s) => [s.pts[0], s.pts[2], s.pts[4]]);
  const ys = segs.flatMap((s) => [s.pts[1], s.pts[3], s.pts[5]]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(w / (maxX - minX), h / (maxY - minY));
  const offX = (w - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = h - maxY * scale;
  // pixel inteiro: no tamanho em que a árvore aparece não se vê diferença, e o SVG fica 1/4 menor
  const fx = (v: number) => Math.min(w, Math.max(0, Math.round(v * scale + offX)));
  const fy = (v: number) => Math.min(h, Math.max(0, Math.round(v * scale + offY)));

  const groups = new Map<number, string[]>();
  for (const s of segs) {
    const width = Math.max(0.8, Math.round(s.width * scale * 2) / 2);
    const [x0, y0, mx, my, ex, ey] = s.pts;
    const d = `M${fx(x0)} ${fy(y0)}Q${fx(mx)} ${fy(my)} ${fx(ex)} ${fy(ey)}`;
    groups.set(width, [...(groups.get(width) ?? []), d]);
  }
  return [...groups.entries()].sort(([a], [b]) => b - a).map(([width, ds]) => ({ width, d: ds.join('') }));
}

export interface SkylineOptions {
  width: number;
  height: number;
  // topo dos prédios comuns; torres altas passam um pouco acima de minTop
  minTop: number;
  maxTop: number;
}

export interface Skyline {
  towers: string;
  // janelas acesas em três intensidades (cada caminho vai com uma opacidade)
  windows: string[];
  // filetes de neon no alto de alguns prédios
  neon: string;
}

// Cidade do futuro vista de longe: prédios com recuos, antenas, janelas acesas e neon nos telhados.
export function skyline(seed: number, { width, height, minTop, maxTop }: SkylineOptions): Skyline {
  const r = rng(seed);
  const towers: string[] = [];
  const windows: string[][] = [[], [], []];
  const neon: string[] = [];
  let x = -12;
  while (x < width + 12) {
    // o último prédio termina logo depois da borda, sem janelas fora do quadro
    const w = Math.min(Math.round(28 + r() * 64), width + 12 - x);
    let top = Math.round(minTop + r() * (maxTop - minTop));
    if (r() < 0.12) top = Math.max(4, minTop - Math.round(20 + r() * 30));
    towers.push(`M${x} ${height}V${top}h${w}V${height}z`);
    // recuo no alto: um bloco mais estreito em cima
    if (r() < 0.35 && top > 24) {
      const inset = Math.round(w * (0.18 + r() * 0.15));
      const lift = Math.round(14 + r() * 26);
      towers.push(`M${x + inset} ${top}V${top - lift}h${w - 2 * inset}V${top}z`);
      if (r() < 0.5) towers.push(`M${x + w / 2 - 1} ${top - lift}v${-Math.round(10 + r() * 24)}h2V${top - lift}z`);
    } else if (r() < 0.22) {
      towers.push(`M${x + Math.round(w * 0.3)} ${top}v${-Math.round(12 + r() * 30)}h2V${top}z`);
    }
    if (r() < 0.3) neon.push(`M${x + 2} ${top + 3}h${w - 4}`);
    for (let wy = top + 10; wy < height - 8; wy += 11) {
      for (let wx = x + 5; wx < x + w - 6; wx += 8) {
        const lit = r();
        if (lit < 0.075) windows[lit < 0.02 ? 0 : lit < 0.045 ? 1 : 2].push(`M${wx} ${wy}h3v4h-3z`);
      }
    }
    x += w + (r() < 0.25 ? Math.round(r() * 6) : 0);
  }
  return { towers: towers.join(''), windows: windows.map((g) => g.join('')), neon: neon.join('') };
}

export interface Ember {
  left: number; // % da largura
  size: number; // px
  duration: number; // s
  delay: number; // s (negativo: a brasa já começa no meio do voo)
  drift: number; // px para o lado durante a subida
}

// Brasas subindo da fumaça da batalha.
export function embers(seed: number, count: number): Ember[] {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const duration = r1(6 + r() * 7);
    return {
      left: r1(r() * 100),
      size: r1(1.5 + r() * 2.5),
      duration,
      delay: -r1(r() * duration),
      drift: Math.round((r() - 0.5) * 120),
    };
  });
}
