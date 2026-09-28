import type { ImageMetadata } from 'astro';
import smartMix from '../assets/screens/det-smartmix.png';
import advisor from '../assets/screens/det-conselheiro.png';
import aiMenu from '../assets/screens/det-ia-menu.png';

export type Runtime = 'app' | 'server';

export const runtimeLabel: Record<Runtime, string> = {
  app: 'Runs in the app',
  server: 'Needs the MAW Neural Server',
};

export interface AiCard {
  id: string;
  size: 'c-a' | 'c-b' | 'c-c' | 'c-d' | 'c-e';
  hud: string;
  title: string;
  text: string;
  runtime: Runtime;
  image?: ImageMetadata;
  alt?: string;
  tall?: boolean;
  keys?: { key: string; label: string }[];
}

// "Runs in the app" foi confirmado rodando a MAW sem o servidor neural (27/09/2026).
export const aiCards: AiCard[] = [
  {
    id: 'smart-mix', size: 'c-a', hud: '// SMART MIX · EQ CLASHES', title: 'Smart Mix', runtime: 'app',
    text: "Finds which tracks fight over the same frequency band — and for how long they actually play together. Then it writes the cuts into each track's equalizer.",
    image: smartMix, alt: 'Smart Mix report listing frequency clashes between drums, bass, guitars and vocals', tall: true,
  },
  {
    id: 'advisor', size: 'c-b', hud: '// PRODUCTION ADVISOR · RULES + GEMINI', title: 'Production Advisor', runtime: 'app',
    text: 'Measures the project and points at what matters: a master about to clip, AutoTune set to the wrong key, clashing tracks, loudness. Asking Gemini for a second opinion needs the Neural Server.',
    image: advisor, alt: 'Production Advisor window warning that the vocal AutoTune is not in the key of the song',
  },
  {
    id: 'stems', size: 'c-c', hud: '// STEMS · 2 · 4 · 5 PARTS', title: 'Stem separation', runtime: 'server',
    text: "Vocals, drums, bass, piano and the rest — or let MAW decide what's actually in the song.",
    image: aiMenu, alt: 'AI assistant menu with stem separation, Smart Mix, Advisor and transcription options',
  },
  {
    id: 'whisper', size: 'c-d', hud: '// WHISPER · PT · EN', title: 'Speech becomes markers', runtime: 'server',
    text: 'Transcribes the speech in the selected clip and turns every segment into a marker on the timeline. Portuguese, English or auto-detect.',
  },
  {
    id: 'keys', size: 'c-e', hud: '// LOCAL ANALYSIS · NO INTERNET', title: 'Keys that listen', runtime: 'app',
    keys: [{ key: 'C', label: 'chords' }, { key: 'T', label: 'tempo' }, { key: 'M', label: 'audio → MIDI' }],
    text: 'Chords are stored in the clip — like the Em, C, G, D tags in the screenshots above.',
  },
];
