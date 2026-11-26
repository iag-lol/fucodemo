// Persistencia simple en un archivo JSON (data/db.json), con escritura atómica.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DATA = process.env.DATA_DIR || new URL('../data', import.meta.url).pathname;
mkdirSync(join(DATA, 'galleries'), { recursive: true });
const FILE = join(DATA, 'db.json');

const initial = {
  leads: [], galleries: [], blocked: [], demoSeeded: false,
  config: { showPrices: false, rates: { services: {}, duration: { media: 0.6, completa: 1, varios: 2 }, deliverables: {} } },
};
// Si el archivo existe pero está dañado, se detiene en vez de sobrescribirlo.
export const db = existsSync(FILE) ? { ...initial, ...JSON.parse(readFileSync(FILE, 'utf8')) } : structuredClone(initial);

export function save() {
  writeFileSync(`${FILE}.tmp`, JSON.stringify(db, null, 1), { mode: 0o600 });
  renameSync(`${FILE}.tmp`, FILE);
}
