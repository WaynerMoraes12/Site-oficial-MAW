import type { ImageMetadata } from 'astro';
import autotune from '../assets/screens/det-autotune.png';
import eq from '../assets/screens/det-eq.png';
import metro from '../assets/screens/det-metro.png';

export const pedals: { name: string; color: string; ink?: string; knobs: number[] }[] = [
  { name: 'Noise Gate', color: '#2a2a31', knobs: [-40, 30] },
  { name: 'Distor­tion', color: '#c2410c', knobs: [70, -20] },
  { name: 'Equal­izer', color: '#d8d3c4', ink: '#111', knobs: [30, -60, 10] },
  { name: 'Compres­sor', color: '#1d4ed8', knobs: [-30, 50] },
  { name: 'Reverb', color: '#6A00AD', knobs: [40, 30] },
  { name: 'Delay', color: '#0f766e', knobs: [-70, 20] },
  { name: 'Auto­Tune', color: '#9D00FF', knobs: [90, -10] },
];

export const rackShots: { image: ImageMetadata; alt: string; caption: string }[] = [
  { image: autotune, alt: 'AutoTune panel with amount, speed, key and scale controls', caption: 'AUTOTUNE — AMOUNT, SPEED, KEY, SCALE' },
  { image: eq, alt: 'Equalizer panel with high-pass, low-pass and three peak bands cut by Smart Mix', caption: 'EQUALIZER — HIGH-PASS, LOW-PASS, 3 PEAK BANDS (SMART MIX CUTS)' },
  { image: metro, alt: 'Metronome window with beat lights, tap tempo, sound, subdivision and count-in', caption: 'METRONOME — SOUND, SUBDIVISION, COUNT-IN, TAP' },
];
