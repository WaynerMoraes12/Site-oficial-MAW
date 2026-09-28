import { parseRelease } from '../lib/release';

// release.json só existe depois do build do instalador (npm run installer). Lido como texto para um JSON
// quebrado não derrubar o build: sem ele, ou corrompido, o site mostra "coming soon".
const found = import.meta.glob<string>('./release.json', { eager: true, query: '?raw', import: 'default' });
export const releaseData: unknown = parseRelease(Object.values(found)[0]);
