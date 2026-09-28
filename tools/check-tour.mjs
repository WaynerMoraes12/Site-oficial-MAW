// Roda no check:dist (e no deploy): o World Tour do site precisa estar completo e ser do instalador atual.
import { existsSync, readFileSync } from 'node:fs';
import { snapshotProblems } from './lib/tour.mjs';

const snapshot = JSON.parse(readFileSync('src/data/tour.json', 'utf8'));
const release = existsSync('src/data/release.json') ? JSON.parse(readFileSync('src/data/release.json', 'utf8')) : null;
const problems = snapshotProblems(snapshot, release);
for (const p of problems) console.error(p);
console.log(problems.length ? `World Tour com ${problems.length} problema(s)` : `World Tour ok: ${snapshot.stops.length} paradas`);
if (problems.length) process.exitCode = 1;
