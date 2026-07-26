import assert from 'node:assert/strict';
import test from 'node:test';

import { extractResultUrl } from './extract-higgsfield-url.mjs';

test('extracts result_url from a completed job array', () => {
  const json = JSON.stringify([{ status: 'completed', result_url: 'https://cdn.example/card.png' }]);
  assert.equal(extractResultUrl(json), 'https://cdn.example/card.png');
});

test('returns an empty string when no result URL exists', () => {
  assert.equal(extractResultUrl(JSON.stringify([{ status: 'failed' }])), '');
});
