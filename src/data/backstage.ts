import type { ImageMetadata } from 'astro';
import performance from '../assets/screens/det-desempenho.png';
import tests from '../assets/screens/det-testes.png';

// Números do README da MAW (benchmark e suíte de testes).
export const stats: { value: string; label: string; sub: string; purple?: boolean }[] = [
  { value: '0.29%', label: 'of the audio block', sub: '32 tracks · 48 kHz · 512 samples' },
  { value: '3,934', label: 'automated checks', sub: 'in 396 built-in test blocks', purple: true },
  { value: '24', label: 'bit recording', sub: 'ASIO, several tracks at once' },
  { value: '50', label: 'undo levels', sub: 'each one named after its action', purple: true },
];

export const backstageShots: { image: ImageMetadata; alt: string; caption: string }[] = [
  { image: performance, alt: 'Audio engine performance window showing block load, callback times and sample rate', caption: 'AUDIO ENGINE PERFORMANCE WINDOW (MENU)' },
  { image: tests, alt: 'Built-in automated test suite report with every check passing', caption: 'BUILT-IN TEST SUITE (MENU) · EVERY CHECK PASSED' },
];
