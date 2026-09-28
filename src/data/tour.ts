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
export const tourStops = snapshot.stops as TourStop[];
