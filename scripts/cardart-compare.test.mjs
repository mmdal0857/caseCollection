import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildModelArgs,
  chunkJobs,
  parseCompareArgs,
  resolveHiggsfieldEntrypoint,
} from './cardart-compare.mjs';

test('uses the style reference for Nano Banana 2 Lite', () => {
  assert.deepEqual(buildModelArgs('nano_banana_2_lite', 'style.png', 'prompt'), [
    'generate', 'create', 'nano_banana_2_lite',
    '--prompt', 'prompt',
    '--aspect_ratio', '3:4',
    '--resolution', '1k',
    '--image-references', 'style.png',
    '--thinking', 'HIGH',
    '--wait', '--json',
  ]);
});

test('does not pass unsupported image references to Z Image', () => {
  assert.deepEqual(buildModelArgs('z_image', 'style.png', 'prompt'), [
    'generate', 'create', 'z_image',
    '--prompt', 'prompt',
    '--aspect_ratio', '3:4',
    '--wait', '--json',
  ]);
});

test('resolves the JavaScript entrypoint behind the Windows npm shim', () => {
  assert.equal(
    resolveHiggsfieldEntrypoint('C:/Users/test/npm/higgsfield.cmd'),
    'C:\\Users\\test\\npm\\node_modules\\@higgsfield\\cli\\bin\\higgsfield.js',
  );
});

test('chunks comparison jobs to the Plus image concurrency limit', () => {
  const jobs = Array.from({ length: 16 }, (_, index) => index);
  assert.deepEqual(chunkJobs(jobs, 8), [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14, 15],
  ]);
});

test('parses model and template filters separately from card IDs', () => {
  assert.deepEqual(
    parseCompareArgs([
      '--models=gpt_image_2',
      '--templates=noir-specimen',
      'thread_fiber',
      'venom_trace',
    ]),
    {
      models: ['gpt_image_2'],
      templates: ['noir-specimen'],
      ids: ['thread_fiber', 'venom_trace'],
    },
  );
});
