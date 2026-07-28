import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENT } from './src/lib/content';
import { loadPacks, packFromContent, validatePack } from './src/lib/datapack';

const packPath = process.argv[2];
if (!packPath) {
  throw new Error('usage: node check-pack-file.mjs <game-data-pack.json>');
}

const candidate = JSON.parse(readFileSync(resolve(packPath), 'utf8')) as unknown;
const shape = validatePack(candidate);
if (!shape.ok) {
  throw new Error(
    `pack shape failed:\n${shape.issues
      .map((issue) => `- ${issue.path}: ${issue.msg}`)
      .join('\n')}`,
  );
}

const loaded = loadPacks(packFromContent('base', CONTENT), [candidate]);
if (!loaded.ok) {
  throw new Error(
    `pack merge failed:\n${loaded.issues
      .map((issue) => `- ${issue.path}: ${issue.msg}`)
      .join('\n')}`,
  );
}

console.log(
  `[pack-check] PASS — cases=${loaded.content?.cases.length ?? 0} overrides=${loaded.report?.overrides.length ?? 0}`,
);
