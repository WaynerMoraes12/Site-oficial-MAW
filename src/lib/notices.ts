import type { Dictionary } from '../i18n';

export interface Plate {
  title: string;
  body: string;
  hot?: boolean;
}

// Placas do "Read before installing". A da IA depende de o servidor neural vir no instalador.
export function readBeforeInstallPlates(neuralServerBundled: boolean, rb: Dictionary['readBefore']): Plate[] {
  return [
    { ...rb.unsigned, hot: true },
    rb.platforms,
    rb.language,
    neuralServerBundled ? rb.aiBundled : rb.aiNotBundled,
    rb.privacy,
    rb.version,
  ];
}
