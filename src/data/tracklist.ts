// Atalhos conferidos no README da MAW (tabela de atalhos) e em Source/UI/MawPianoRoll.h (Ctrl+U).
// Os títulos das faixas ficam nos dicionários (src/i18n); aqui só o que é igual em toda língua.
export const trackKeys: string[][] = [
  ['R', 'METRO', 'S', 'G', 'K', 'Ctrl U', 'MIDI', 'KEYBOARD'],
  ['MIXER', 'EFEITO', 'UI', 'A', 'Ctrl Z', 'Ctrl S', 'E', 'MENU'],
];

// Nomes dos presets do sintetizador como aparecem no app (Source/Audio/MawTrack.cpp, mawSynthPresetTable).
export const synthPresets: readonly string[] = ['Senoide', 'Teclas', 'Baixo', 'Lead', 'Pad', 'Pluck', 'Orgao'];
