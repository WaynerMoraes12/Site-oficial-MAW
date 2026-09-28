export type TourStatus = 'live' | 'reh' | 'next';

// "reh" = worktrees em andamento na MAW; "next" = trabalhos futuros do README/TCC. Sem datas inventadas.
// Os textos de cada parada ficam nos dicionários (tour.stops), na mesma ordem.
export const tourStatuses: TourStatus[] = ['live', 'reh', 'reh', 'reh', 'reh', 'reh', 'reh', 'next', 'next'];
