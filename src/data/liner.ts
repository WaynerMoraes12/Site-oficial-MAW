export const story = {
  lead: 'MAW started as the undergraduate capstone project of Wayner Pires de Moraes in Computer Engineering at Centro Universitário Hermínio Ometto (FHO), in Araras, Brazil.',
  body: 'The question was simple: why does a DAW record your music without understanding any of it? Six months later, the answer was more than 44,000 lines of C++, an audio engine measured block by block and an AI that talks to the timeline.',
  quote: '“A conventional DAW doesn’t understand the music it’s recording.”',
  closing: 'Built for whoever records alone in their bedroom — a guitar, an audio interface, a computer — and wants to sound like a studio.',
};

export const timeline: { when: string; what: string }[] = [
  { when: '31 MAR 2026', what: 'First visual chassis and the MAW purple' },
  { when: '04 APR', what: 'Pitch detection (YIN) — the tuner is born' },
  { when: '14 APR', what: 'Multitrack' },
  { when: '03 MAY', what: 'The .maw project file' },
  { when: 'JUL', what: 'Neural server and stem separation' },
  { when: '16 JUL', what: 'MIDI and the piano roll' },
  { when: 'AUG', what: 'Export, 4- and 5-stem separation, chord detection' },
  { when: 'SEP', what: 'Mixer, undo, the Advisor, Gemini, test suite — v1.0' },
];

export const credits: { role: string; name: string; note?: string }[] = [
  { role: 'Production, code & arrangement', name: 'Wayner Pires de Moraes' },
  { role: 'Institution', name: 'FHO — Araras, Brazil', note: 'Computer Engineering · 2026' },
  { role: 'Audio engine', name: 'JUCE 8', note: 'Raw Material Software · AGPLv3' },
  { role: 'Drivers & plugins', name: 'ASIO SDK · VST3 SDK', note: 'Steinberg Media Technologies' },
  { role: 'Stem separation', name: 'Spleeter', note: 'Deezer · MIT' },
  { role: 'Transcription', name: 'faster-whisper · Whisper large-v3', note: 'SYSTRAN · OpenAI · MIT' },
  { role: 'Neural server', name: 'Flask', note: 'Pallets · BSD-3' },
  { role: 'Advisor (optional)', name: 'Google Gemini API', note: "with the user's own key" },
  { role: 'License', name: 'GNU GPL v3' },
];
