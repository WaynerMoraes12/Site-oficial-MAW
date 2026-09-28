import type { ImageMetadata } from 'astro';
import smartMix from '../assets/screens/det-smartmix.png';
import advisor from '../assets/screens/det-conselheiro.png';
import aiMenu from '../assets/screens/det-ia-menu.png';

export type Runtime = 'app' | 'server';
export type AiId = 'smart-mix' | 'advisor' | 'stems' | 'whisper' | 'keys';

// "app" foi confirmado rodando a MAW sem o servidor neural (27/09/2026). Textos em src/i18n (ai.cards).
export const aiCards: { id: AiId; size: 'c-a' | 'c-b' | 'c-c' | 'c-d' | 'c-e'; runtime: Runtime; image?: ImageMetadata; tall?: boolean; keys?: string[] }[] = [
  { id: 'smart-mix', size: 'c-a', runtime: 'app', image: smartMix, tall: true },
  { id: 'advisor', size: 'c-b', runtime: 'app', image: advisor },
  { id: 'stems', size: 'c-c', runtime: 'server', image: aiMenu },
  { id: 'whisper', size: 'c-d', runtime: 'server' },
  { id: 'keys', size: 'c-e', runtime: 'app', keys: ['C', 'T', 'M'] },
];
