import type { ImageMetadata } from 'astro';
import arrangement from '../assets/screens/maw-arranjo.png';
import mixer from '../assets/screens/maw-mixer.png';
import pianoRoll from '../assets/screens/maw-pianoroll.png';
import midi from '../assets/screens/maw-midi.png';

export const stageShots: { id: string; label: string; image: ImageMetadata; alt: string }[] = [
  { id: 'arrangement', label: 'Arrangement', image: arrangement, alt: 'MAW arrangement view playing the chorus of the demo song, with section markers, chord tags on the guitar clips and the vocal effects rack' },
  { id: 'mixer', label: 'Mixer', image: mixer, alt: 'MAW mixer with seven channel strips, live peak meters and the master fader' },
  { id: 'piano-roll', label: 'Piano Roll', image: pianoRoll, alt: 'MAW piano roll editing a keyboard arpeggio note by note' },
  { id: 'midi', label: 'MIDI + Audio', image: midi, alt: 'MIDI synth pad and keys clips next to audio tracks in the MAW arrangement' },
];
