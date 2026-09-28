// Texto curto de uma parada do World Tour nas três línguas, escrito pelo Claude CLI a partir do PR ou da issue.
const MAX_LENGTH = 60;
const BODY_LIMIT = 1200;

const EXAMPLES = [
  'Version 1.0 — debut',
  'Automation for any parameter',
  'Sends, buses & sidechain',
  'Loop recording, punch-in & take history',
  'MAW as a VST3 plugin',
];

export function buildPrompt(source) {
  const what =
    source.kind === 'version'
      ? `A new MAW version is out: ${source.version}. Name the stop "Version ${source.version.split('.').slice(0, 2).join('.')} — <two or three words about it>".`
      : [
          `Source: ${source.kind === 'issue' ? 'a planned feature (GitHub issue)' : source.kind === 'branch' ? 'work in progress (git branch)' : 'a feature pull request'} of MAW, written in Portuguese.`,
          `Title: ${source.title ?? source.name ?? ''}`,
          source.body ? `Description (excerpt):\n${String(source.body).slice(0, BODY_LIMIT)}` : '',
        ]
          .filter(Boolean)
          .join('\n');
  return [
    'You write the stop names of the "MAW World Tour", the roadmap on the official website of MAW, a music production app (DAW) for Windows.',
    'Each stop is one short feature name, like these: ' + EXAMPLES.map((e) => `"${e}"`).join(', ') + '.',
    'Rules: at most 48 characters per language; no final period; describe what the musician gets, not the code; keep technical terms such as MIDI, VST3, CC, sidechain, Linux, ASIO as they are.',
    'Languages: "en" = English, "pt" = Brazilian Portuguese, "es" = neutral Latin American Spanish.',
    'Answer with only this JSON and nothing else: {"en": "...", "pt": "...", "es": "..."}',
    '',
    what,
  ].join('\n');
}

export function parseTexts(output) {
  const match = String(output).match(/\{[\s\S]*\}/);
  if (!match) throw new Error('resposta do Claude sem JSON');
  let o;
  try {
    o = JSON.parse(match[0]);
  } catch (err) {
    throw new Error(`JSON inválido na resposta do Claude: ${err.message}`);
  }
  const texts = {};
  for (const l of ['en', 'pt', 'es']) {
    const t = typeof o[l] === 'string' ? o[l].trim() : '';
    if (!t) throw new Error(`resposta do Claude sem texto em ${l}`);
    if (t.length > MAX_LENGTH) throw new Error(`texto longo demais em ${l} (${t.length} caracteres): ${t}`);
    texts[l] = t;
  }
  return texts;
}
