// Junta um caminho ao base do site (Astro BASE_URL), aceitando base com ou sem barra final.
export function withBase(path: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return `${b}${path.replace(/^\/+/, '')}`;
}
