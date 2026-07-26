import assert from 'node:assert/strict';
import test from 'node:test';

import { planBatch, resolveHiggsfieldBin } from './cardart-batch.mjs';

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
