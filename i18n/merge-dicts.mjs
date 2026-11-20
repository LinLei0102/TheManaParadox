// Merge all i18n/dicts/*.json fragments into dictionary.json (termbase-approved overlay).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const merged = {};
const conflicts = [];
for (const file of fs.readdirSync(path.join(dir, 'dicts')).filter(f => f.endsWith('.json')).sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'dicts', file), 'utf8'));
  for (const [key, value] of Object.entries(data)) {
    if (merged[key] && merged[key] !== value) conflicts.push({ key, file, existing: merged[key], incoming: value });
    merged[key] = value;
  }
}
if (conflicts.length) {
  console.warn('Conflicts resolved by last-writer-wins:', JSON.stringify(conflicts, null, 2));
}
fs.writeFileSync(path.join(dir, 'dictionary.json'), JSON.stringify(merged, null, 2), 'utf8');
console.log(`Merged ${Object.keys(merged).length} entries from ${fs.readdirSync(path.join(dir, 'dicts')).length} fragments`);
