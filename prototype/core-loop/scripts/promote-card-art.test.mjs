import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

import { promoteCardArt } from './promote-card-art.mjs';

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function createWorkspace(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'card-promote-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDir = path.join(root, 'source');
  const outputDir = path.join(root, 'public/assets/cards');
  const manifestPath = path.join(root, 'manifest.jsonl');
  const promotionManifestPath = path.join(root, 'promotions.json');
  await mkdir(sourceDir, { recursive: true });
  return { root, sourceDir, outputDir, manifestPath, promotionManifestPath };
}

async function createPng(filePath, width = 880, height = 1168, withMetadata = false) {
  let image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#14120f',
    },
  }).png();
  if (withMetadata) image = image.withMetadata({ exif: { IFD0: { Artist: 'source artist' } } });
  await image.toFile(filePath);
}

test('promotes enabled clues only and records independently verified hashes', async (t) => {
  const { root, sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await createPng(path.join(sourceDir, 'alpha.png'));
  await writeFile(
    manifestPath,
    [
      JSON.stringify({ id: 'alpha', category: 'clue', enabled: true }),
      JSON.stringify({ id: 'pattern', category: 'adjunct', enabled: false }),
    ].join('\n'),
  );

  const report = await promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath });

  assert.deepEqual(report.promoted, ['alpha']);
  assert.equal(await exists(path.join(outputDir, 'alpha.webp')), true);
  assert.equal(await exists(path.join(outputDir, 'pattern.webp')), false);
  const metadata = await sharp(await readFile(path.join(outputDir, 'alpha.webp'))).metadata();
  assert.deepEqual(
    { format: metadata.format, width: metadata.width, height: metadata.height },
    { format: 'webp', width: 440, height: 584 },
  );
  const manifest = JSON.parse(await readFile(promotionManifestPath, 'utf8'));
  assert.equal(manifest.format, 'card-art-promotions@1');
  assert.equal(manifest.items[0].sourceSha256, await sha256(path.join(sourceDir, 'alpha.png')));
  assert.equal(manifest.items[0].outputSha256, await sha256(path.join(outputDir, 'alpha.webp')));
  assert.equal(manifest.items[0].outputPath, 'public/assets/cards/alpha.webp');
});

test('rejects an enabled row with no source PNG', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await writeFile(manifestPath, JSON.stringify({ id: 'missing', enabled: true }));

  await assert.rejects(
    promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath }),
    /missing source PNG: missing/,
  );
});

test('does not require or emit a disabled adjunct', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await writeFile(manifestPath, JSON.stringify({ id: 'pattern', category: 'adjunct', enabled: false }));

  const report = await promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath });

  assert.deepEqual(report.promoted, []);
  assert.equal(await exists(path.join(outputDir, 'pattern.webp')), false);
  assert.deepEqual(JSON.parse(await readFile(promotionManifestPath, 'utf8')).items, []);
});

test('sorts enabled IDs before processing and recording promotions', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await createPng(path.join(sourceDir, 'alpha.png'));
  await createPng(path.join(sourceDir, 'zulu.png'));
  await writeFile(
    manifestPath,
    [JSON.stringify({ id: 'zulu', enabled: true }), JSON.stringify({ id: 'alpha', enabled: true })].join('\n'),
  );

  const report = await promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath });
  const manifest = JSON.parse(await readFile(promotionManifestPath, 'utf8'));

  assert.deepEqual(report.promoted, ['alpha', 'zulu']);
  assert.deepEqual(manifest.items.map((item) => item.id), ['alpha', 'zulu']);
});

test('sorts Unicode IDs with locale-independent ordinal ordering', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await createPng(path.join(sourceDir, 'z.png'));
  await createPng(path.join(sourceDir, 'ä.png'));
  await writeFile(
    manifestPath,
    [JSON.stringify({ id: 'ä', enabled: true }), JSON.stringify({ id: 'z', enabled: true })].join('\n'),
  );

  const report = await promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath });
  const manifest = JSON.parse(await readFile(promotionManifestPath, 'utf8'));

  assert.deepEqual(report.promoted, ['z', 'ä']);
  assert.deepEqual(manifest.items.map((item) => item.id), ['z', 'ä']);
});

test('reruns unchanged inputs with an identical output hash and manifest', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await createPng(path.join(sourceDir, 'bravo.png'));
  await writeFile(manifestPath, JSON.stringify({ id: 'bravo', enabled: true }));
  const options = { manifestPath, sourceDir, outputDir, promotionManifestPath };

  await promoteCardArt(options);
  const firstHash = await sha256(path.join(outputDir, 'bravo.webp'));
  const firstManifest = await readFile(promotionManifestPath, 'utf8');
  await promoteCardArt(options);

  assert.equal(await sha256(path.join(outputDir, 'bravo.webp')), firstHash);
  assert.equal(await readFile(promotionManifestPath, 'utf8'), firstManifest);
  assert.equal(/(?:timestamp|createdAt|updatedAt|generatedAt)/i.test(firstManifest), false);
});

test('strips metadata and does not enlarge a smaller source', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await createPng(path.join(sourceDir, 'small.png'), 220, 292, true);
  await writeFile(manifestPath, JSON.stringify({ id: 'small', enabled: true }));

  await promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath });

  const metadata = await sharp(await readFile(path.join(outputDir, 'small.webp'))).metadata();
  assert.deepEqual(
    { format: metadata.format, width: metadata.width, height: metadata.height },
    { format: 'webp', width: 220, height: 292 },
  );
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.xmp, undefined);
});

test('rejects duplicate IDs before promotion', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await createPng(path.join(sourceDir, 'alpha.png'));
  await writeFile(
    manifestPath,
    [JSON.stringify({ id: 'alpha', enabled: true }), JSON.stringify({ id: 'alpha', enabled: true })].join('\n'),
  );

  await assert.rejects(
    promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath }),
    /duplicate ID: alpha/,
  );
});

test('rejects IDs containing path separators', async (t) => {
  const { sourceDir, outputDir, manifestPath, promotionManifestPath } = await createWorkspace(t);
  await writeFile(manifestPath, JSON.stringify({ id: 'nested/alpha', enabled: true }));

  await assert.rejects(
    promoteCardArt({ manifestPath, sourceDir, outputDir, promotionManifestPath }),
    /path separator in ID: nested\/alpha/,
  );
});
