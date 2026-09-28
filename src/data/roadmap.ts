export type TourStatus = 'live' | 'reh' | 'next';

export const stampLabel: Record<TourStatus, string> = { live: 'On the road', reh: 'Rehearsing', next: 'Announced' };

// "Rehearsing" = worktrees em andamento na MAW; "Announced" = trabalhos futuros do README/TCC. Sem datas inventadas.
export const roadmap: { when: string; what: string; status: TourStatus }[] = [
  { when: 'Sep 2026', what: 'Version 1.0 — debut', status: 'live' },
  { when: 'In rehearsal', what: 'Automation for any parameter', status: 'reh' },
  { when: 'In rehearsal', what: 'Sends, buses & sidechain', status: 'reh' },
  { when: 'In rehearsal', what: 'Loop recording, punch-in & take history', status: 'reh' },
  { when: 'In rehearsal', what: 'Time-stretch & track freeze', status: 'reh' },
  { when: 'In rehearsal', what: 'Sampler, sequencer, MIDI learn & CC lanes', status: 'reh' },
  { when: 'In rehearsal', what: 'Guitar string tuner', status: 'reh' },
  { when: 'Next tour', what: 'MAW as a VST3 plugin', status: 'next' },
  { when: 'Next tour', what: 'Tempo map & take comping', status: 'next' },
];
