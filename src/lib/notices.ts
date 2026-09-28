export interface Plate {
  title: string;
  body: string;
  hot?: boolean;
}

// Placas do "Read before installing". A da IA depende de o servidor neural vir no instalador.
export function readBeforeInstallPlates(neuralServerBundled: boolean): Plate[] {
  const ai: Plate = neuralServerBundled
    ? {
        title: 'AI needs a first-run download',
        body: 'Stem separation and transcription use the bundled MAW Neural Server (Python 3.10 + ffmpeg). The Whisper large-v3 model (about 3 GB) downloads the first time you transcribe.',
      }
    : {
        title: 'AI server not bundled yet',
        body: "Stem separation, transcription and Gemini advice run on the MAW Neural Server, a local Python service that doesn't ship with v1.0.0 yet. Smart Mix, the Advisor's rules, chords, tempo and audio-to-MIDI work out of the box.",
      };
  return [
    {
      title: 'SmartScreen will warn you',
      body: "The installer isn't digitally signed yet. On the blue screen, click “More info”, then “Run anyway”.",
      hot: true,
    },
    { title: 'Windows 64-bit only', body: "Windows 10 or 11. There's no macOS or Linux version yet." },
    {
      title: 'Interface in Brazilian Portuguese',
      body: "MAW's menus and buttons are in Portuguese. This site shows button names exactly as they appear in the app.",
    },
    ai,
    {
      title: 'Your audio stays yours',
      body: "Everything runs on your PC. Only the Advisor's text report goes to Gemini — and only when you press the button.",
    },
    {
      title: 'Version 1.0',
      body: "Actively developed. Known limits today: volume-only automation, AI jobs can't be cancelled, and the master VST3 isn't saved with the project.",
    },
  ];
}
