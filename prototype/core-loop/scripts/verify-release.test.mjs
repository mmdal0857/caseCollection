import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { verifyDistRelease, verifySourceRelease } from './verify-release.mjs';

const BACKGROUNDS = ['trust-low.webp', 'trust-mid.webp', 'trust-high.webp'];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function issue(pathname, message) {
  return { path: pathname, message };
}

async function createReleaseFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'verify-release-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(root, 'cardart-manifest.jsonl');
  const promotionManifestPath = path.join(root, 'card-art-promotions.json');
  const sourceDir = path.join(root, '.art-source/cardart');
  const publicRoot = path.join(root, 'public');
  const distRoot = path.join(root, 'dist');
  const cardBytes = Buffer.from('alpha card derivative');
  const sourceBytes = Buffer.from('alpha source PNG');
  const audioManifest = {
    format: 'audio-manifest@1',
    assets: [{ files: { ogg: { path: 'audio/cue.ogg' }, mp3: { path: 'audio/cue.mp3' } } }],
  };

  await writeFile(manifestPath, `${JSON.stringify({ id: 'alpha', enabled: true })}\n`);
  await mkdir(path.join(publicRoot, 'assets/cards'), { recursive: true });
  await mkdir(path.join(publicRoot, 'assets/backgrounds'), { recursive: true });
  await mkdir(path.join(publicRoot, 'audio'), { recursive: true });
  await writeFile(path.join(publicRoot, 'assets/cards/alpha.webp'), cardBytes);
  await Promise.all(BACKGROUNDS.map((name) => writeFile(path.join(publicRoot, 'assets/backgrounds', name), name)));
  await writeFile(path.join(publicRoot, 'audio/audio-manifest.json'), JSON.stringify(audioManifest));
  await writeFile(path.join(publicRoot, 'audio/cue.ogg'), 'ogg');
  await writeFile(path.join(publicRoot, 'audio/cue.mp3'), 'mp3');
  await writeFile(
    promotionManifestPath,
    JSON.stringify({
      format: 'card-art-promotions@1',
      converter: {
        package: 'sharp',
        version: '0.35.3',
        options: { width: 440, height: 584, fit: 'cover', position: 'centre', withoutEnlargement: true, quality: 82, effort: 6 },
      },
      items: [{ id: 'alpha', sourceSha256: sha256(sourceBytes), outputSha256: sha256(cardBytes), outputPath: 'public/assets/cards/alpha.webp' }],
    }),
  );
  await mkdir(sourceDir, { recursive: true });

  const sourceOptions = { manifestPath, promotionManifestPath, sourceDir, publicRoot };
  const distOptions = { manifestPath, distRoot };
  return { publicRoot, distRoot, sourceDir, sourceOptions, distOptions, sourceBytes, cardBytes, audioManifest };
}

async function populateDist(fixture, extraFiles = {}) {
  const { distRoot, cardBytes, audioManifest } = fixture;
  await mkdir(path.join(distRoot, 'assets/cards'), { recursive: true });
  await mkdir(path.join(distRoot, 'assets/backgrounds'), { recursive: true });
  await mkdir(path.join(distRoot, 'audio'), { recursive: true });
  await writeFile(path.join(distRoot, 'index.html'), '<!doctype html>');
  await writeFile(path.join(distRoot, 'assets/cards/alpha.webp'), cardBytes);
  await Promise.all(BACKGROUNDS.map((name) => writeFile(path.join(distRoot, 'assets/backgrounds', name), name)));
  await writeFile(path.join(distRoot, 'audio/audio-manifest.json'), JSON.stringify(audioManifest));
  await writeFile(path.join(distRoot, 'audio/cue.ogg'), 'ogg');
  await writeFile(path.join(distRoot, 'audio/cue.mp3'), 'mp3');
  await Promise.all(Object.entries(extraFiles).map(async ([relativePath, contents]) => {
    const filePath = path.join(distRoot, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents);
  }));
}

async function createDirectoryLink(t, target, linkPath) {
  try {
    await symlink(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    return true;
  } catch (error) {
    if (!['EACCES', 'EPERM', 'ENOTSUP'].includes(error?.code)) throw error;
    t.skip(`filesystem links unavailable on ${process.platform}: ${error.code} ${error.message}`);
    return false;
  }
}

test('reports an enabled card missing its promoted WebP derivative', async (t) => {
  const fixture = await createReleaseFixture(t);
  await unlink(path.join(fixture.publicRoot, 'assets/cards/alpha.webp'));

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/assets/cards/alpha.webp', 'missing enabled card derivative'),
  ]);
});

test('reports an enabled card derivative whose bytes differ from its promotion hash', async (t) => {
  const fixture = await createReleaseFixture(t);
  await writeFile(path.join(fixture.publicRoot, 'assets/cards/alpha.webp'), 'changed derivative');

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/assets/cards/alpha.webp', 'output SHA-256 differs from promotion manifest'),
  ]);
});

test('reports a locally present source PNG whose hash is stale in the promotion manifest', async (t) => {
  const fixture = await createReleaseFixture(t);
  await writeFile(path.join(fixture.sourceDir, 'alpha.png'), 'changed source PNG');

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('.art-source/cardart/alpha.png', 'source SHA-256 differs from promotion manifest'),
  ]);
});

test('reports a missing required trust background', async (t) => {
  const fixture = await createReleaseFixture(t);
  await unlink(path.join(fixture.publicRoot, 'assets/backgrounds/trust-mid.webp'));

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/assets/backgrounds/trust-mid.webp', 'missing required trust background'),
  ]);
});

test('reports an audio-manifest OGG runtime asset that is missing', async (t) => {
  const fixture = await createReleaseFixture(t);
  await unlink(path.join(fixture.publicRoot, 'audio/cue.ogg'));

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/audio/cue.ogg', 'missing audio-manifest runtime asset'),
  ]);
});

test('reports forbidden source art under the public runtime root', async (t) => {
  const fixture = await createReleaseFixture(t);
  await mkdir(path.join(fixture.publicRoot, 'protoart'), { recursive: true });

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/protoart', 'forbidden source or candidate path'),
  ]);
});

test('release links reject a source directory link and do not trust required files outside public', async (t) => {
  const fixture = await createReleaseFixture(t);
  const externalCards = path.join(path.dirname(fixture.publicRoot), 'external-cards');
  await mkdir(externalCards);
  await writeFile(path.join(externalCards, 'alpha.webp'), fixture.cardBytes);
  const cardsPath = path.join(fixture.publicRoot, 'assets/cards');
  await rm(cardsPath, { recursive: true });
  if (!(await createDirectoryLink(t, externalCards, cardsPath))) return;

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/assets/cards/alpha.webp', 'required file resolves outside public root'),
    issue('public/assets/cards', 'symbolic link or junction is not allowed'),
  ]);
});

test('reports a textual dist asset with an owned root-absolute asset URL', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, { 'assets/app.js': 'const card = "/assets/cards/alpha.webp";' });

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('assets/app.js', 'contains root-absolute owned asset URL'),
  ]);
});

test('reports root-absolute audio paths in the dist audio manifest JSON', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture);
  await writeFile(
    path.join(fixture.distRoot, 'audio/audio-manifest.json'),
    JSON.stringify({ assets: [{ files: { ogg: { path: '/audio/cue.ogg' }, mp3: { path: 'audio/cue.mp3' } } }] }),
  );

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('audio/audio-manifest.json', 'contains root-absolute owned asset URL'),
  ]);
});

test('decoded JSON rejects an escaped-slash owned root URL', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, { 'assets/escaped.json': '{"cue":"\\/audio\\/cue.ogg"}' });

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('assets/escaped.json', 'contains root-absolute owned asset URL'),
  ]);
});

test('decoded JSON rejects a Unicode-escaped owned root URL', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, { 'assets/unicode.json': '{"card":"\\u002fassets\\u002fcards\\u002falpha.webp"}' });

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('assets/unicode.json', 'contains root-absolute owned asset URL'),
  ]);
});

test('decoded JSON accepts scheme-qualified and protocol-relative remote URLs', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, {
    'assets/remotes.json': JSON.stringify({
      nested: [
        'https://cdn.example/file?next=/assets/a.webp#fallback=/audio/cue.ogg',
        '//cdn.example/audio/cue.ogg?next=/assets/a.webp',
      ],
    }),
  });

  assert.deepEqual(await verifyDistRelease(fixture.distOptions), { ok: true, issues: [] });
});

test('reports an unquoted CSS url with a root-absolute owned asset URL', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, { 'assets/site.css': '.card { background: url(/assets/cards/alpha.webp); }' });

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('assets/site.css', 'contains root-absolute owned asset URL'),
  ]);
});

test('reports an unquoted HTML source with a root-absolute owned audio URL', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, { 'embed.html': '<audio src=/audio/cue.ogg></audio>' });

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('embed.html', 'contains root-absolute owned asset URL'),
  ]);
});

test('accepts scheme-qualified and protocol-relative remote URLs whose query or fragment values mention owned paths', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, {
    'assets/remote.js': 'const remote = "https://cdn.example/file?next=/assets/a.webp#fallback=/audio/cue.ogg"; const protocolRelative = "//cdn.example/file?next=/assets/a.webp#fallback=/audio/cue.ogg";',
  });

  assert.deepEqual(await verifyDistRelease(fixture.distOptions), { ok: true, issues: [] });
});

test('reports an audio-manifest runtime path that escapes the public root', async (t) => {
  const fixture = await createReleaseFixture(t);
  await writeFile(path.join(path.dirname(fixture.publicRoot), 'outside.ogg'), 'outside');
  await writeFile(
    path.join(fixture.publicRoot, 'audio/audio-manifest.json'),
    JSON.stringify({ assets: [{ files: { ogg: { path: '../outside.ogg' }, mp3: { path: 'audio/cue.mp3' } } }] }),
  );

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/audio/audio-manifest.json', 'audio-manifest runtime path escapes public root'),
  ]);
});

test('reports an audio-manifest runtime path containing traversal even when it resolves under public', async (t) => {
  const fixture = await createReleaseFixture(t);
  await writeFile(
    path.join(fixture.publicRoot, 'audio/audio-manifest.json'),
    JSON.stringify({ assets: [{ files: { ogg: { path: 'audio/../audio/cue.ogg' }, mp3: { path: 'audio/cue.mp3' } } }] }),
  );

  assert.deepEqual((await verifySourceRelease(fixture.sourceOptions)).issues, [
    issue('public/audio/audio-manifest.json', 'audio-manifest runtime path escapes public root'),
  ]);
});

test('reports a forbidden candidate directory in dist', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, { 'audio-candidates/draft.ogg': 'candidate' });

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('audio-candidates', 'forbidden source or candidate path'),
  ]);
});

test('release links reject a directory link anywhere under dist without traversing it', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture);
  const external = path.join(path.dirname(fixture.distRoot), 'external-dist');
  await mkdir(external);
  await writeFile(path.join(external, 'outside.js'), 'const escaped = true;');
  if (!(await createDirectoryLink(t, external, path.join(fixture.distRoot, 'linked-outside')))) return;

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('linked-outside', 'symbolic link or junction is not allowed'),
  ]);
});

test('reports a dist artifact whose total bytes exceed 64 MiB', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture, { 'assets/oversize.bin': Buffer.alloc(64 * 1024 * 1024 + 1) });

  assert.deepEqual((await verifyDistRelease(fixture.distOptions)).issues, [
    issue('dist', 'artifact bytes exceed 64 MiB'),
  ]);
});

test('accepts a valid minimal source tree and a valid minimal dist tree', async (t) => {
  const fixture = await createReleaseFixture(t);
  await populateDist(fixture);

  assert.deepEqual(await verifySourceRelease(fixture.sourceOptions), { ok: true, issues: [] });
  assert.deepEqual(await verifyDistRelease(fixture.distOptions), { ok: true, issues: [] });
});
