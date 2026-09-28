export const faq: { q: string; a: string }[] = [
  { q: 'Is MAW free?', a: "Yes. The download is free and there's no sign-up." },
  { q: 'Does it run on Mac or Linux?', a: 'Not yet. Version 1.0 runs on Windows 10 and 11, 64-bit only.' },
  { q: 'Is the interface in English?', a: "Not yet — MAW's interface is in Brazilian Portuguese. This site shows button names exactly as they appear in the app, so you can find them." },
  { q: 'Do I need an audio interface?', a: "Not to get started — your PC's sound card works. For low-latency recording, an interface with an ASIO driver is recommended." },
  { q: 'Do my VST3 plugins work?', a: 'Yes. MAW scans the standard VST3 folder, keeps a cache and compensates plugin latency.' },
  { q: 'Does the AI send my music to the internet?', a: "No. Separation, transcription and analysis run on your PC. Only the Advisor's text report goes to Gemini, and only if you ask." },
  { q: 'Why does Windows say the app might be unsafe?', a: "That's SmartScreen: the installer isn't digitally signed yet. Click “More info”, then “Run anyway”." },
  { q: 'Is what I make in MAW mine?', a: 'Yes. Your recordings, mixes, stems and projects belong to you.' },
];
