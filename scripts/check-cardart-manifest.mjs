import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function contentCardIds(contentSource) {
  const cardSection = contentSource.split(/\n\s*cases:\s*\[/, 1)[0];
  return new Set([...cardSection.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]));
}

export function validateManifest(rows, contentSource) {
  const errors = [];
  const seen = new Set();
  let clues = 0;
  let adjuncts = 0;

  for (const row of rows) {
    if (seen.has(row.id)) errors.push(`duplicate id: ${row.id}`);
    seen.add(row.id);

    if (row.category === 'clue') {
      clues += 1;
      if (row.composition !== 'single' && row.composition !== 'group') {
        errors.push(`${row.id}: composition must be single or group`);
      }
      if (row.enabled !== true) errors.push(`${row.id}: clue must be enabled`);
      if (typeof row.description !== 'string' || row.description.trim() === '') {
        errors.push(`${row.id}: description is required`);
      }
    } else if (row.category === 'adjunct') {
      adjuncts += 1;
      if (row.enabled !== false) errors.push(`${row.id}: adjunct must be disabled`);
      if (row.artPolicy !== 'semantic-ui') {
        errors.push(`${row.id}: adjunct artPolicy must be semantic-ui`);
      }
    } else {
      errors.push(`${row.id}: category must be clue or adjunct`);
    }
  }

  const contentIds = contentCardIds(contentSource);
  const missing = [...contentIds].filter((id) => !seen.has(id)).sort();
  const extra = [...seen].filter((id) => !contentIds.has(id)).sort();
  if (missing.length > 0) errors.push(`missing manifest ids: ${missing.join(', ')}`);
  if (extra.length > 0) errors.push(`unknown manifest ids: ${extra.join(', ')}`);

  return { errors, counts: { clues, adjuncts } };
}

function loadJsonLines(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1}: ${error.message}`);
      }
    });
}

function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(scriptDir, '..');
  const rows = loadJsonLines(path.join(scriptDir, 'cardart-manifest.jsonl'));
  const contentSource = fs.readFileSync(
    path.join(root, 'prototype/core-loop/src/lib/content.ts'),
    'utf8',
  );
  const result = validateManifest(rows, contentSource);

  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(`FAIL ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`PASS clues=${result.counts.clues} adjuncts=${result.counts.adjuncts}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
