import assert from 'node:assert/strict';
import test from 'node:test';

import * as cardArtBatch from './cardart-batch.mjs';

const { planBatch, resolveHiggsfieldBin } = cardArtBatch;

const rows = [
  { id: 'alpha', category: 'clue', enabled: true, description: 'A', composition: 'single' },
  { id: 'beta', category: 'clue', enabled: true, description: 'B', composition: 'group' },
  { id: 'pattern', category: 'adjunct', enabled: false, description: 'P', composition: 'single' },
];

test('plans every enabled clue when no IDs are specified', () => {
  const result = planBatch(rows, { ids: [], existingIds: new Set(), force: false });

  assert.deepEqual(result, {
    planned: [rows[0], rows[1]],
    skipped: [],
    errors: [],
  });
});

test('skips existing files unless force is set', () => {
  const skipped = planBatch(rows, {
    ids: ['alpha'],
    existingIds: new Set(['alpha']),
    force: false,
  });
  const forced = planBatch(rows, {
    ids: ['alpha'],
    existingIds: new Set(['alpha']),
    force: true,
  });

  assert.deepEqual(skipped, { planned: [], skipped: ['alpha'], errors: [] });
  assert.deepEqual(forced, { planned: [rows[0]], skipped: [], errors: [] });
});

test('rejects unknown and disabled IDs', () => {
  const result = planBatch(rows, {
    ids: ['missing', 'pattern'],
    existingIds: new Set(),
    force: false,
  });

  assert.deepEqual(result, {
    planned: [],
    skipped: [],
    errors: ['unknown card id: missing', 'disabled card id: pattern'],
  });
});

test('resolves the existing Windows npm Higgsfield shim from APPDATA', () => {
  const result = resolveHiggsfieldBin(
    { APPDATA: 'C:/Users/test/AppData/Roaming' },
    (candidate) => candidate === 'C:/Users/test/AppData/Roaming/npm/higgsfield.cmd',
  );

  assert.equal(result, 'C:/Users/test/AppData/Roaming/npm/higgsfield.cmd');
});

test('resolves card generation and batch source defaults outside public cardart', () => {
  const sourceDir = cardArtBatch.cardArtSourceDir?.('C:\\repo');

  assert.equal(sourceDir, 'C:\\repo\\prototype\\core-loop\\.art-source\\cardart');
  assert.doesNotMatch(sourceDir, /public[\\/]cardart/);
});

test('records generated source art under the ignored source directory', () => {
  const entry = cardArtBatch.buildGenerationLogEntry?.(
    { id: 'alpha' },
    'https://example.test/alpha.png',
    '2026-07-30T00:00:00.000Z',
  );

  assert.deepEqual(entry, {
    id: 'alpha',
    url: 'https://example.test/alpha.png',
    path: 'prototype/core-loop/.art-source/cardart/alpha.png',
    generatedAt: '2026-07-30T00:00:00.000Z',
  });
  assert.doesNotMatch(entry.path, /public[\\/]cardart/);
});
