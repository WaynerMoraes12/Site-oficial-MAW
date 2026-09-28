import type { Locale } from '../i18n/types';
import snapshot from './tour.json';

// Paradas do World Tour sincronizadas com o GitHub da MAW por `npm run tour` (tools/tour.mjs).
export type TourStatus = 'live' | 'reh' | 'next';
export interface TourStop {
  id: string;
  status: TourStatus;
  date: string;
  text: Record<Locale, string>;
}
// parada sem texto (sincronização que falhou no meio) não aparece; o check:tour acusa antes do deploy
export const tourStops = (snapshot.stops as (TourStop & { text: TourStop['text'] | null })[]).filter((s): s is TourStop => !!s.text);
