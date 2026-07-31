import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

import { PROMOTION_OPTIONS } from './promote-card-art.mjs';

const BACKGROUNDS = ['trust-low.webp', 'trust-mid.webp', 'trust-high.webp'];
const ARTIFACT_LIMIT_BYTES = 64 * 1024 * 1024;
const FORBIDDEN_SEGMENTS = new Set(['cardart', 'benchmark', 'protoart', 'audio-candidates']);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function issue(issues, pathname, message) {
  issues.push({ path: pathname, message });
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function inventory(root) {
  const files = [];
  const directories = [];
  async function visit(current, relative = '') {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const nextRelative = relative === '' ? entry.name : path.join(relative, entry.name);
      const nextAbsolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        directories.push(toPosix(nextRelative));
        await visit(nextAbsolute, nextRelative);
      } else if (entry.isFile()) {
        files.push({ absolute: nextAbsolute, relative: toPosix(nextRelative), size: (await stat(nextAbsolute)).size });
      }
    }
  }
  await visit(root);
  return { files, directories };
}

export async function directorySize(root) {
  return (await inventory(root)).files.reduce((total, file) => total + file.size, 0);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function enabledRows(manifestPath) {
  return (await readFile(manifestPath, 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line))
    .filter((row) => row.enabled === true);
}

function sourceDefaults(options = {}) {
  const appRoot = options.appRoot ?? process.cwd();
  return {
    manifestPath: options.manifestPath ?? path.resolve(appRoot, '../../scripts/cardart-manifest.jsonl'),
    promotionManifestPath: options.promotionManifestPath ?? path.join(appRoot, 'release/card-art-promotions.json'),
    sourceDir: options.sourceDir ?? path.join(appRoot, '.art-source/cardart'),
    publicRoot: options.publicRoot ?? path.join(appRoot, 'public'),
  };
}

function distDefaults(options = {}) {
  const appRoot = options.appRoot ?? process.cwd();
  return {
    manifestPath: options.manifestPath ?? path.resolve(appRoot, '../../scripts/cardart-manifest.jsonl'),
    distRoot: options.distRoot ?? path.join(appRoot, 'dist'),
  };
}

function checkPromotionConfiguration(manifest, issues) {
  if (manifest.format !== 'card-art-promotions@1') {
    issue(issues, 'release/card-art-promotions.json', 'unexpected promotion manifest format');
  }
  const converter = manifest.converter;
  if (converter?.package !== 'sharp') {
    issue(issues, 'release/card-art-promotions.json', 'promotion converter package must be sharp');
  }
  if (converter?.version !== sharp.versions.sharp) {
    issue(issues, 'release/card-art-promotions.json', 'promotion converter version differs from installed sharp');
  }
  if (!isDeepStrictEqual(converter?.options, PROMOTION_OPTIONS)) {
    issue(issues, 'release/card-art-promotions.json', 'promotion converter options differ from promotion contract');
  }
}

function audioPaths(manifest) {
  if (!Array.isArray(manifest.assets)) return [];
  return manifest.assets.flatMap((asset) => ['ogg', 'mp3'].flatMap((format) => {
    const runtimePath = asset?.files?.[format]?.path;
    return typeof runtimePath === 'string' ? [runtimePath] : [];
  }));
}

function resolveRuntimeAudioPath(root, runtimePath) {
  if (
    path.isAbsolute(runtimePath) ||
    /^[A-Za-z]:[\\/]/.test(runtimePath) ||
    runtimePath.split(/[\\/]/).includes('..')
  ) return null;
  const absolutePath = path.resolve(root, runtimePath);
  const relativePath = path.relative(root, absolutePath);
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) return null;
  return { absolutePath, relativePath: toPosix(relativePath) };
}

function isForbidden(relativePath) {
  return relativePath.split('/').some((segment) => {
    const lower = segment.toLowerCase();
    return FORBIDDEN_SEGMENTS.has(lower) || lower.includes('generation-log');
  });
}

function reportForbiddenPaths(issues, relativePaths, prefix = '') {
  const reported = [];
  for (const relativePath of relativePaths) {
    if (!isForbidden(relativePath) || reported.some((parent) => relativePath.startsWith(`${parent}/`))) continue;
    reported.push(relativePath);
    issue(issues, `${prefix}${relativePath}`, 'forbidden source or candidate path');
  }
}

function containsOwnedRootAbsoluteUrl(text) {
  const withoutRemoteUrls = text.replace(/(?:\b[a-z][a-z\d+.-]*:|(?<=[\s"'`(=]))\/\/[^\s"'`<>)]*/gi, '');
  return /(?:^|[\s"'`(=])\/(?:assets|audio)\//.test(withoutRemoteUrls);
}

export async function verifySourceRelease(options) {
  const { manifestPath, promotionManifestPath, sourceDir, publicRoot } = sourceDefaults(options);
  const issues = [];
  const rows = await enabledRows(manifestPath);
  const promotions = await readJson(promotionManifestPath);
  checkPromotionConfiguration(promotions, issues);
  if (issues.length > 0) return { ok: false, issues };

  const enabledIds = new Set(rows.map((row) => row.id));
  const items = Array.isArray(promotions.items) ? promotions.items : [];
  const promotionById = new Map();
  for (const item of items) {
    if (!enabledIds.has(item.id)) {
      issue(issues, 'release/card-art-promotions.json', `promotion record has disabled or unknown ID: ${item.id}`);
      continue;
    }
    if (promotionById.has(item.id)) {
      issue(issues, 'release/card-art-promotions.json', `multiple promotion records for enabled ID: ${item.id}`);
      continue;
    }
    promotionById.set(item.id, item);
  }

  for (const row of rows) {
    const cardPath = path.join(publicRoot, 'assets/cards', `${row.id}.webp`);
    const cardDisplayPath = `public/assets/cards/${row.id}.webp`;
    const item = promotionById.get(row.id);
    if (item === undefined) {
      issue(issues, cardDisplayPath, 'missing promotion record for enabled card');
      continue;
    }
    if (item.outputPath !== cardDisplayPath) {
      issue(issues, 'release/card-art-promotions.json', `promotion output path differs for enabled ID: ${row.id}`);
    }
    if (!(await exists(cardPath))) {
      issue(issues, cardDisplayPath, 'missing enabled card derivative');
    } else if (sha256(await readFile(cardPath)) !== item.outputSha256) {
      issue(issues, cardDisplayPath, 'output SHA-256 differs from promotion manifest');
    }
    const sourcePath = path.join(sourceDir, `${row.id}.png`);
    if (await exists(sourcePath)) {
      const sourceDisplayPath = `.art-source/cardart/${row.id}.png`;
      if (sha256(await readFile(sourcePath)) !== item.sourceSha256) {
        issue(issues, sourceDisplayPath, 'source SHA-256 differs from promotion manifest');
      }
    }
  }

  for (const background of BACKGROUNDS) {
    const backgroundPath = path.join(publicRoot, 'assets/backgrounds', background);
    if (!(await exists(backgroundPath))) {
      issue(issues, `public/assets/backgrounds/${background}`, 'missing required trust background');
    }
  }

  const audioManifestPath = path.join(publicRoot, 'audio/audio-manifest.json');
  if (!(await exists(audioManifestPath))) {
    issue(issues, 'public/audio/audio-manifest.json', 'missing audio manifest');
  } else {
    for (const runtimePath of audioPaths(await readJson(audioManifestPath))) {
      const resolvedPath = resolveRuntimeAudioPath(publicRoot, runtimePath);
      if (resolvedPath === null) {
        issue(issues, 'public/audio/audio-manifest.json', 'audio-manifest runtime path escapes public root');
      } else if (!(await exists(resolvedPath.absolutePath))) {
        issue(issues, `public/${resolvedPath.relativePath}`, 'missing audio-manifest runtime asset');
      }
    }
  }

  const contents = await inventory(publicRoot);
  reportForbiddenPaths(issues, [...contents.directories, ...contents.files.map((file) => file.relative)], 'public/');
  return { ok: issues.length === 0, issues };
}

export async function verifyDistRelease(options) {
  const { manifestPath, distRoot } = distDefaults(options);
  const issues = [];
  const rows = await enabledRows(manifestPath);
  const contents = await inventory(distRoot);
  const files = new Map(contents.files.map((file) => [file.relative, file]));
  const requiredPaths = [
    'index.html',
    ...rows.map((row) => `assets/cards/${row.id}.webp`),
    ...BACKGROUNDS.map((name) => `assets/backgrounds/${name}`),
    'audio/audio-manifest.json',
  ];
  const audioManifestFile = files.get('audio/audio-manifest.json');
  if (audioManifestFile !== undefined) {
    for (const runtimePath of audioPaths(await readJson(audioManifestFile.absolute))) {
      const resolvedPath = resolveRuntimeAudioPath(distRoot, runtimePath);
      if (resolvedPath === null) {
        if (!/^\/(?:assets|audio)\//.test(runtimePath)) {
          issue(issues, 'audio/audio-manifest.json', 'audio-manifest runtime path escapes public root');
        }
      } else {
        requiredPaths.push(resolvedPath.relativePath);
      }
    }
  }
  for (const requiredPath of requiredPaths) {
    if (!files.has(requiredPath)) issue(issues, requiredPath, 'missing required dist artifact');
  }

  reportForbiddenPaths(issues, [...contents.directories, ...files.keys()]);

  for (const file of contents.files) {
    if (!/\.(?:html|js|css|json)$/i.test(file.relative)) continue;
    if (containsOwnedRootAbsoluteUrl(await readFile(file.absolute, 'utf8'))) {
      issue(issues, file.relative, 'contains root-absolute owned asset URL');
    }
  }
  if (await directorySize(distRoot) > ARTIFACT_LIMIT_BYTES) {
    issue(issues, 'dist', 'artifact bytes exceed 64 MiB');
  }
  return { ok: issues.length === 0, issues };
}

async function main() {
  const mode = process.argv[2];
  const report = mode === 'source'
    ? await verifySourceRelease()
    : mode === 'dist'
      ? await verifyDistRelease()
      : { ok: false, issues: [{ path: 'mode', message: 'expected source or dist' }] };
  if (!report.ok) {
    for (const current of report.issues) console.error(`FAIL ${current.path}: ${current.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${mode} release closure verified`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  });
}
