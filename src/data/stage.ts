import type { ImageMetadata } from 'astro';
import arrangement from '../assets/screens/maw-arranjo.png';
import mixer from '../assets/screens/maw-mixer.png';
import pianoRoll from '../assets/screens/maw-pianoroll.png';
import midi from '../assets/screens/maw-midi.png';

// Nome do projeto demo das capturas: é nome próprio, fica igual em toda língua.
export const demoProject = 'Noite Roxa';

export type StageId = 'arrangement' | 'mixer' | 'piano-roll' | 'midi';

export const stageShots: { id: StageId; image: ImageMetadata }[] = [
  { id: 'arrangement', image: arrangement },
  { id: 'mixer', image: mixer },
  { id: 'piano-roll', image: pianoRoll },
  { id: 'midi', image: midi },
];
