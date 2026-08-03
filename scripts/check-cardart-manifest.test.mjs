import assert from 'node:assert/strict';
import test from 'node:test';

import { validateManifest } from './check-cardart-manifest.mjs';

const contentSource = `
id: 'alpha', name: 'A', suit: 'physical'
id: 'locked-room', name: 'P'
analysis: { id: 'analysis', name: 'H' }
`;

test('accepts semantic UI adjuncts without generation prompt fields', () => {
  const result = validateManifest([
    { id: 'alpha', category: 'clue', enabled: true, description: 'object', composition: 'single' },
    { id: 'locked-room', category: 'adjunct', enabled: false, artPolicy: 'semantic-ui' },
    { id: 'analysis', category: 'adjunct', enabled: false, artPolicy: 'semantic-ui' },
  ], contentSource);

  assert.deepEqual(result, {
    errors: [],
    counts: { clues: 1, adjuncts: 2 },
  });
});

test('rejects an adjunct without an explicit semantic UI art policy', () => {
  const result = validateManifest([
    { id: 'alpha', category: 'clue', enabled: true, description: 'object', composition: 'single' },
    { id: 'locked-room', category: 'adjunct', enabled: false, description: 'object', composition: 'single' },
    { id: 'analysis', category: 'adjunct', enabled: false, artPolicy: 'semantic-ui' },
  ], contentSource);

  assert.deepEqual(result.errors, [
    'locked-room: adjunct artPolicy must be semantic-ui',
  ]);
});

test('reports duplicate IDs and invalid composition', () => {
  const result = validateManifest([
    { id: 'alpha', category: 'clue', enabled: true, description: 'object', composition: 'single' },
    { id: 'alpha', category: 'clue', enabled: true, description: 'object', composition: 'scene' },
  ], contentSource);

  assert.deepEqual(result.errors, [
    'duplicate id: alpha',
    'alpha: composition must be single or group',
    'missing manifest ids: analysis, locked-room',
  ]);
});

test('rejects enabled adjuncts and disabled clues', () => {
  const result = validateManifest([
    { id: 'alpha', category: 'clue', enabled: false, description: 'object', composition: 'single' },
    { id: 'locked-room', category: 'adjunct', enabled: true, artPolicy: 'semantic-ui' },
    { id: 'analysis', category: 'adjunct', enabled: false, artPolicy: 'semantic-ui' },
  ], contentSource);

  assert.deepEqual(result.errors, [
    'alpha: clue must be enabled',
    'locked-room: adjunct must be disabled',
  ]);
});
