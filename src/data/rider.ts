export const riderRows: { ch: string; item: string; min: string; rec: string }[] = [
  { ch: '01', item: 'System', min: 'Windows 10 64-bit', rec: 'Windows 11 64-bit' },
  { ch: '02', item: 'Audio', min: 'PC sound card', rec: 'Interface with an ASIO driver' },
  { ch: '03', item: 'Display', min: '1329 × 620', rec: '1580 px wide or more (full header)' },
  { ch: '04', item: 'MIDI', min: '—', rec: 'USB controller (picked up on plug-in)' },
  { ch: '05', item: 'AI: stems & transcription', min: 'MAW Neural Server (Python 3.10 + ffmpeg)', rec: 'NVIDIA GPU with CUDA' },
  { ch: '06', item: 'Disk', min: 'About 10 MB for MAW', rec: '+ ~3 GB for the Whisper model on first use' },
  { ch: '07', item: 'Advisor with Gemini', min: '— (local rules)', rec: 'Your own Gemini API key' },
  { ch: '08', item: 'Internet', min: 'Not needed to produce', rec: 'Only for AI model downloads and Gemini' },
];

export const riderNote = 'Also required: Microsoft Visual C++ Redistributable (x64). The installer adds it automatically if it is missing.';
