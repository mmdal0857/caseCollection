import assert from 'node:assert/strict';
import {
  publicAssetUrl,
  rebaseAudioManifest,
} from './src/lib/public-assets';
import type { AudioManifest } from './src/lib/audio';

assert.equal(publicAssetUrl('/assets/cards/a.webp', './'), './assets/cards/a.webp');
assert.equal(publicAssetUrl('assets/cards/a.webp', '/caseCollection/'), '/caseCollection/assets/cards/a.webp');
assert.equal(publicAssetUrl('/audio/a.ogg', '/caseCollection'), '/caseCollection/audio/a.ogg');
assert.equal(publicAssetUrl('https://cdn.example/a.ogg', './'), 'https://cdn.example/a.ogg');
assert.equal(publicAssetUrl('//cdn.example/a.ogg', './'), '//cdn.example/a.ogg');

const original = {
  format: 'audio-manifest@1',
  generatedAt: '2026-07-30T00:00:00.000Z',
  assets: [{
    id: 'music_title',
    files: {
      wav: { path: '/audio/a.wav' },
      ogg: { path: '/audio/a.ogg' },
      mp3: { path: 'https://cdn.example/a.mp3' },
    },
  }],
} as unknown as AudioManifest;
const rebased = rebaseAudioManifest(original, '/caseCollection/');

assert.equal(rebased.assets[0].files.wav.path, '/caseCollection/audio/a.wav');
assert.equal(rebased.assets[0].files.ogg.path, '/caseCollection/audio/a.ogg');
assert.equal(rebased.assets[0].files.mp3.path, 'https://cdn.example/a.mp3');
assert.equal(original.assets[0].files.wav.path, '/audio/a.wav');
console.log('PASS public asset URLs');
