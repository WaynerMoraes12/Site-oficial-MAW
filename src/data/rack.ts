import type { ImageMetadata } from 'astro';
import autotune from '../assets/screens/det-autotune.png';
import eq from '../assets/screens/det-eq.png';
import metro from '../assets/screens/det-metro.png';

// Nomes dos efeitos como aparecem na MAW (não se traduzem).
export const pedals: { name: string; color: string; ink?: string; knobs: number[] }[] = [
  { name: 'Noise Gate', color: '#2a2a31', knobs: [-40, 30] },
  { name: 'Distor\u00adtion', color: '#c2410c', knobs: [70, -20] },
  { name: 'Equal\u00adizer', color: '#d8d3c4', ink: '#111', knobs: [30, -60, 10] },
  { name: 'Compres\u00adsor', color: '#1d4ed8', knobs: [-30, 50] },
  { name: 'Reverb', color: '#6A00AD', knobs: [40, 30] },
  { name: 'Delay', color: '#0f766e', knobs: [-70, 20] },
  { name: 'Auto\u00adTune', color: '#9D00FF', knobs: [90, -10] },
];

// Legendas em src/i18n (rack.shots), na mesma ordem.
export const rackShots: ImageMetadata[] = [autotune, eq, metro];
