import type { ImageMetadata } from 'astro';
import performance from '../assets/screens/det-desempenho.png';
import tests from '../assets/screens/det-testes.png';

// Números do README da MAW (benchmark e suíte de testes). valueComma = formato pt/es (vírgula decimal).
// Rótulos em src/i18n (backstage.stats).
export const stats: { value: string; valueComma: string; purple?: boolean }[] = [
  { value: '0.29%', valueComma: '0,29%' },
  { value: '3,934', valueComma: '3.934', purple: true },
  { value: '24', valueComma: '24' },
  { value: '50', valueComma: '50', purple: true },
];

// Legendas em src/i18n (backstage.shots), na mesma ordem.
export const backstageShots: ImageMetadata[] = [performance, tests];
