import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveHiggsfieldBin } from './cardart-batch.mjs';
import { extractResultUrl } from './extract-higgsfield-url.mjs';

const MODELS = [
  'nano_banana_2_lite',
  'gpt_image_2',
  'z_image',
  'recraft_v4_1',
];

const TEMPLATES = {
  'noir-specimen': '',
  'small-card-glyph': 'Designed for maximum legibility at 92 pixels wide. Exaggerate the distinctive outer silhouette and one or two identifying structural features. Suppress fine texture and incidental detail.',
};

const STYLE = 'Flat cel-shaded graphic-novel noir illustration. Hard black ink contours, heavy flat black shadow masses, no gradients, limited palette of warm grey and pale bone.';
const GROUND = 'IMPORTANT: the background is a single flat near-black field, edge to edge, with no paper, no card, no border, no frame, no vignette, no surface, no table. The subject floats on flat near-black.';
const LIGHT = 'Neutral even lighting on the subject, no dramatic key light, no coloured light, no rim light.';
const RULES = {
  single: 'Single isolated object, centered. The object alone as a specimen — no scene, no hands, no action, no narrative. No readable words, logos, watermark, or signature; abstract illegible marks are allowed when they are physically part of a document.',
  group: 'One coherent isolated object group, centered. The grouped objects alone as a specimen — no surrounding scene, no hands, no action, no narrative. No readable words, logos, watermark, or signature; abstract illegible marks are allowed when they are physically part of a document.',
};

export function buildModelArgs(model, styleKey, prompt) {
  const common = [
    'generate', 'create', model,
    '--prompt', prompt,
    '--aspect_ratio', '3:4',
  ];

  if (model === 'nano_banana_2_lite') {
    return [...common, '--resolution', '1k', '--image-references', styleKey, '--thinking', 'HIGH', '--wait', '--json'];
  }
  if (model === 'gpt_image_2') {
    return [...common, '--resolution', '1k', '--image-references', styleKey, '--quality', 'low', '--wait', '--json'];
  }
  if (model === 'z_image') {
    return [...common, '--wait', '--json'];
  }
  if (model === 'recraft_v4_1') {
    return [...common, '--resolution', '1k', '--model_type', 'standard', '--background_color', '#14120f', '--wait', '--json'];
  }
  throw new Error(`unsupported comparison model: ${model}`);
}

function buildPrompt(row, template) {
  const templateRule = TEMPLATES[template];
  if (templateRule === undefined) throw new Error(`unknown template: ${template}`);
  return [STYLE, templateRule, `Subject: ${row.description}.`, GROUND, LIGHT, RULES[row.composition]]
    .filter(Boolean)
    .join(' ');
}

function loadManifest(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function resolveHiggsfieldEntrypoint(bin) {
  return path.join(
    path.dirname(bin),
    'node_modules',
    '@higgsfield',
    'cli',
    'bin',
    'higgsfield.js',
  );
}

export function chunkJobs(jobs, size) {
  const chunks = [];
  for (let index = 0; index < jobs.length; index += size) {
    chunks.push(jobs.slice(index, index + size));
  }
  return chunks;
}

function runCli(bin, args, cwd) {
  return new Promise((resolve, reject) => {
    const entrypoint = resolveHiggsfieldEntrypoint(bin);
    const child = spawn(
      process.execPath,
      [entrypoint, ...args],
      { cwd, windowsHide: true },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `Higgsfield exited ${code}`));
    });
  });
}

async function generateOne({ bin, root, styleKey, outputRoot, row, model, template }) {
  const outputPath = path.join(outputRoot, template, model, `${row.id}.png`);
  if (fs.existsSync(outputPath)) {
    console.log(`SKIP ${template}/${model}/${row.id}`);
    return;
  }

  console.log(`START ${template}/${model}/${row.id}`);
  const json = await runCli(bin, buildModelArgs(model, styleKey, buildPrompt(row, template)), root);
  const url = extractResultUrl(json);
  if (!url) throw new Error(`missing result URL: ${template}/${model}/${row.id}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download ${response.status}: ${template}/${model}/${row.id}`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
  console.log(`OK ${template}/${model}/${row.id}`);
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(scriptDir, '..');
  const bin = resolveHiggsfieldBin(process.env);
  if (!bin) throw new Error('Higgsfield CLI를 찾을 수 없다.');
  const requestedIds = process.argv.slice(2);
  const ids = requestedIds.length > 0 ? requestedIds : ['forged_ledger', 'omitted_witness'];
  const rowsById = new Map(loadManifest(path.join(scriptDir, 'cardart-manifest.jsonl')).map((row) => [row.id, row]));
  const rows = ids.map((id) => {
    const row = rowsById.get(id);
    if (!row) throw new Error(`unknown card id: ${id}`);
    return row;
  });
  const styleKey = path.join(root, 'docs/art/style-key.png');
  const outputRoot = path.join(root, 'prototype/core-loop/public/cardart/benchmark');
  const jobs = [];
  for (const row of rows) {
    for (const model of MODELS) {
      for (const template of Object.keys(TEMPLATES)) {
        jobs.push({ bin, root, styleKey, outputRoot, row, model, template });
      }
    }
  }
  for (const batch of chunkJobs(jobs, 8)) {
    await Promise.all(batch.map(generateOne));
  }
  console.log(`TOTAL ${jobs.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  });
}
