import type { Dictionary, Locale } from './types';
import { en } from './en';
import { pt } from './pt';
import { es } from './es';

export type { Dictionary, Locale } from './types';

export const locales: readonly Locale[] = ['en', 'pt', 'es'];
export const dictionaries: Record<Locale, Dictionary> = { en, pt, es };

// Língua do site para a lista de preferências do navegador: a primeira suportada vence.
// Autocontida de propósito: o <head> da página em inglês embute o código dela (toString).
export function pickLocale(languages: readonly string[]): Locale {
  for (const raw of languages) {
    const primary = String(raw || '').toLowerCase().split('-')[0];
    if (primary === 'en' || primary === 'pt' || primary === 'es') return primary;
  }
  return 'en';
}

// Inglês fica na raiz do site; as outras línguas ganham /pt/ e /es/.
export function localeUrl(locale: Locale, base: string = import.meta.env.BASE_URL ?? '/'): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return locale === 'en' ? b : `${b}${locale}/`;
}

// Troca {chave} pelos valores (ex.: "Download MAW {version}").
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
