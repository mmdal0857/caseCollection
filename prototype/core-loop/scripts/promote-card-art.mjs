import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const PROMOTION_OPTIONS = {
  width: 440,
  height: 584,
  fit: 'cover',
  position: 'centre',
  withoutEnlargement: true,
  quality: 82,
  effort: 6,
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../../..');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseSelectedRows(manifestText) {
  const rows = manifestText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line))
    .filter((row) => row.enabled === true);

  const ids = new Set();
  for (const row of rows) {
    if (typeof row.id !== 'string' || row.id === '') {
      throw new Error('invalid ID');
    }
    if (row.id.includes('/') || row.id.includes('\\')) {
      throw new Error(`path separator in ID: ${row.id}`);
    }
    if (ids.has(row.id)) {
      throw new Error(`duplicate ID: ${row.id}`);
    }
    ids.add(row.id);
  }

  return rows.sort((left, right) => left.id.localeCompare(right.id));
}

async function readSourcePng(sourceDir, id) {
  try {
    return await readFile(path.join(sourceDir, `${id}.png`));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`missing source PNG: ${id}`);
    }
    throw error;
  }
}

async function writePromotionManifest(promotionManifestPath, manifest) {
  await mkdir(path.dirname(promotionManifestPath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(promotionManifestPath),
    `.${path.basename(promotionManifestPath)}.${process.pid}.tmp`,
  );
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(temporaryPath, promotionManifestPath);
}

export async function promoteCardArt({
  manifestPath,
  sourceDir,
  outputDir,
  promotionManifestPath,
}) {
  const selectedRows = parseSelectedRows(await readFile(manifestPath, 'utf8'));
  await mkdir(outputDir, { recursive: true });
  const items = [];

  for (const row of selectedRows) {
    const sourceBytes = await readSourcePng(sourceDir, row.id);
    const outputPath = path.join(outputDir, `${row.id}.webp`);
    await sharp(sourceBytes, { failOn: 'warning' })
      .rotate()
      .resize({
        width: PROMOTION_OPTIONS.width,
        height: PROMOTION_OPTIONS.height,
        fit: PROMOTION_OPTIONS.fit,
        position: PROMOTION_OPTIONS.position,
        withoutEnlargement: PROMOTION_OPTIONS.withoutEnlargement,
      })
      .webp({
        quality: PROMOTION_OPTIONS.quality,
        effort: PROMOTION_OPTIONS.effort,
      })
      .toFile(outputPath);
    const outputBytes = await readFile(outputPath);
    items.push({
      id: row.id,
      sourceSha256: sha256(sourceBytes),
      outputSha256: sha256(outputBytes),
      outputPath: `public/assets/cards/${row.id}.webp`,
    });
  }

  await writePromotionManifest(promotionManifestPath, {
    format: 'card-art-promotions@1',
    converter: {
      package: 'sharp',
      version: sharp.versions.sharp,
      options: PROMOTION_OPTIONS,
    },
    items,
  });

  return { promoted: items.map((item) => item.id) };
}

async function main() {
  const report = await promoteCardArt({
    manifestPath: path.join(repositoryRoot, 'scripts/cardart-manifest.jsonl'),
    sourceDir: path.join(repositoryRoot, 'prototype/core-loop/.art-source/cardart'),
    outputDir: path.join(repositoryRoot, 'prototype/core-loop/public/assets/cards'),
    promotionManifestPath: path.join(repositoryRoot, 'prototype/core-loop/release/card-art-promotions.json'),
  });
  console.log(`PASS promoted=${report.promoted.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  });
}
