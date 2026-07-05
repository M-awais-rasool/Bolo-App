/**
 * Exports the bundled ContentPack as JSON for the server's pack-publishing
 * pipeline (server/cmd/packs). The app's lessons.ts stays the authoring
 * source of truth for seed content; this keeps the two in sync by
 * construction instead of by hand.
 *
 *   npx tsx scripts/export-content-pack.ts ../server/seeds/packs/KG.json
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { CONTENT_PACK } from '../src/content/lessons';

const out = resolve(process.argv[2] ?? '../server/seeds/packs/KG.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(CONTENT_PACK, null, 2) + '\n');
console.log(
  `wrote revision ${CONTENT_PACK.revision} (${CONTENT_PACK.lessons.length} lessons) to ${out}`,
);
