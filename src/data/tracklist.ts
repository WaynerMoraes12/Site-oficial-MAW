export interface Track { n: string; title: string; detail: string; key: string }
export interface Side { name: string; subtitle: string; tracks: Track[] }

// Atalhos conferidos no README da MAW (tabela de atalhos) e em Source/UI/MawPianoRoll.h (Ctrl+U).
export const sides: Side[] = [
  {
    name: 'Side A',
    subtitle: 'RECORD & EDIT',
    tracks: [
      { n: '01', title: '24-bit multitrack recording', detail: 'Several tracks at once through ASIO, with input monitoring', key: 'R' },
      { n: '02', title: 'Metronome & count-in', detail: 'Beep, wood or rim sounds, tap tempo, 1 or 2 bars of count-in', key: 'METRO' },
      { n: '03', title: 'Split, fades & crossfades', detail: 'An automatic 5 ms micro-fade on every cut', key: 'S' },
      { n: '04', title: 'Snap grid with triplets', detail: 'From 1/1 to 1/32, with lasso selection and nudge', key: 'G' },
      { n: '05', title: 'Named markers', detail: 'Name your song sections and jump between them', key: 'K' },
      { n: '06', title: 'Piano roll', detail: 'Quantize with strength and swing, velocity and transpose', key: 'Ctrl U' },
      { n: '07', title: 'USB MIDI controllers', detail: 'Picked up automatically, even when plugged in with the app open', key: 'MIDI' },
      { n: '08', title: 'Built-in synth', detail: '7 presets: Sine, Keys, Bass, Lead, Pad, Pluck, Organ', key: 'KEYBOARD' },
    ],
  },
  {
    name: 'Side B',
    subtitle: 'MIX & DELIVER',
    tracks: [
      { n: '09', title: 'Mixer with peak meters', detail: 'Red clip latch, pan, mute, solo, arm and a master fader', key: 'MIXER' },
      { n: '10', title: 'Effects rack + VST3', detail: '7 built-in effects in a chain, with plugin delay compensation', key: 'EFEITO' },
      { n: '11', title: 'AutoTune with key & scale', detail: 'Major, minor, pentatonics and chromatic', key: 'UI' },
      { n: '12', title: 'Volume automation', detail: 'Draw nodes right on the track', key: 'A' },
      { n: '13', title: 'Named undo', detail: '50 levels, including mix and effect changes', key: 'Ctrl Z' },
      { n: '14', title: 'Autosave & recovery', detail: 'Every 3 minutes, with portable project folders', key: 'Ctrl S' },
      { n: '15', title: 'Export with loudness', detail: 'WAV, FLAC, OGG, MP3 — integrated LUFS and true peak', key: 'E' },
      { n: '16', title: 'Stems, one file per track', detail: 'The whole song or just the loop region', key: 'MENU' },
    ],
  },
];
