export type Locale = 'en' | 'pt' | 'es';

// Linha com um trecho em negrito no meio (sem HTML nos dicionários).
// keep: o trecho em negrito é nome de arquivo ou do app, protegido do tradutor do navegador.
export interface RichLine { before: string; bold: string; after: string; keep?: boolean }
export interface Shot { label: string; alt: string }
export interface Caption { alt: string; caption: string }
export interface PlateText { title: string; body: string }
export interface AiText { hud: string; title: string; text: string; alt: string; keyLabels: string[] }

// Todo texto visível do site. Os três idiomas têm exatamente esta forma (teste de paridade).
export interface Dictionary {
  meta: { htmlLang: string; ogLocale: string; title: string; description: string };
  nav: {
    aria: string; home: string; stage: string; tracklist: string; ai: string; rider: string; tour: string;
    story: string; faq: string; download: string; menu: string; language: string;
  };
  hero: {
    title1: string; title2a: string; title2b: string; ledeBefore: string; ledeAfter: string;
    ctaDownload: string; ctaStage: string; meta: string; advisory: string[];
  };
  ticker: { aria: string; items: string[] };
  stage: {
    eyebrow: string; title: string; lede: string; tablist: string;
    shots: { arrangement: Shot; mixer: Shot; 'piano-roll': Shot; midi: Shot };
  };
  tracklist: {
    eyebrow: string; words: string[];
    sides: { name: string; subtitle: string; tracks: { title: string; detail: string }[] }[];
    footer1: string; footer2: string;
  };
  ai: {
    eyebrow: string; titleGlitch: string; titleRest: string; quote: RichLine; runtime: { app: string; server: string };
    cards: { 'smart-mix': AiText; advisor: AiText; stems: AiText; whisper: AiText; keys: AiText };
  };
  rack: { eyebrow: string; titleBefore: string; titleAfter: string; lede: string; boardAria: string; shots: Caption[] };
  backstage: { eyebrow: string; title: string; lede: string; stats: { label: string; sub: string }[]; shots: Caption[] };
  rider: {
    eyebrow: string; title: string; sheet: string; rev: string; headers: string[];
    rows: { item: string; min: string; rec: string }[]; note: string;
  };
  readBefore: {
    eyebrow: string; title1: string; title2: string; smartscreen: PlateText; windows: PlateText; language: PlateText;
    aiNotBundled: PlateText; aiBundled: PlateText; privacy: PlateText; version: PlateText;
  };
  download: {
    eyebrow: string; title1: string; title2: string; lede: string;
    labels: { version: string; platform: string; file: string; license: string };
    steps: RichLine[]; ready: string; pending: string; pendingNote: string; source: string;
  };
  tour: {
    eyebrow: string; title: string; years: string; stamps: { live: string; reh: string; next: string };
    months: string[]; whenReh: string; whenNext: string;
  };
  liner: {
    eyebrow: string; titleBefore: string; titleRed: string; titleAfter: string; titleLine2: string;
    lead: string; body: string; quote: string; closing: string; timeline: { when: string; what: string }[];
    creditsTitle: string; credits: { role: string; name: string; note: string }[];
  };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  contact: { eyebrow: string; title: string; email: string; source: string; pressAria: string; press: string[] };
  footer: { legal: string };
}
