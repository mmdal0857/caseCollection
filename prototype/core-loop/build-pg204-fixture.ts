import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildSourceFixture } from './src/lib/case-generator-e2e';

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const sourcePath = valueAfter('--source');
const outputPath = valueAfter('--out');
if (!sourcePath || !outputPath) {
  throw new Error(
    'usage: node build-pg204-fixture.mjs --source <204.txt> --out <fixture.json>',
  );
}

const source = readFileSync(resolve(sourcePath), 'utf8');
const fixture = buildSourceFixture(source);
const resolvedOutput = resolve(outputPath);
mkdirSync(dirname(resolvedOutput), { recursive: true });
writeFileSync(resolvedOutput, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log(
  `[pg204-fixture] ${fixture.paragraphs.length} paragraphs · ${fixture.source.sha256}`,
);
