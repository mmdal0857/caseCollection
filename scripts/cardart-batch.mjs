import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function planBatch(rows, { ids, existingIds, force }) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const selected = [];
  const skipped = [];
  const errors = [];

  if (ids.length === 0) {
    selected.push(...rows.filter((row) => row.category === 'clue' && row.enabled === true));
  } else {
    for (const id of ids) {
      const row = byId.get(id);
      if (!row) {
        errors.push(`unknown card id: ${id}`);
      } else if (row.enabled !== true) {
        errors.push(`disabled card id: ${id}`);
      } else {
        selected.push(row);
      }
    }
  }

  const planned = selected.filter((row) => {
    if (!force && existingIds.has(row.id)) {
      skipped.push(row.id);
      return false;
    }
    return true;
  });

  return { planned, skipped, errors };
}

export function resolveHiggsfieldBin(env, existsSync = fs.existsSync) {
  if (env.HIGGSFIELD_BIN && existsSync(env.HIGGSFIELD_BIN)) return env.HIGGSFIELD_BIN;
  if (!env.APPDATA) return null;
  const npmShim = `${env.APPDATA.replaceAll('\\', '/')}/npm/higgsfield.cmd`;
  return existsSync(npmShim) ? npmShim : null;
}

function loadManifest(manifestPath) {
  return fs.readFileSync(manifestPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

function parseArgs(argv) {
  const ids = [];
  let dryRun = false;
  let force = false;

  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--force') force = true;
    else if (arg.startsWith('--')) throw new Error(`unknown option: ${arg}`);
    else ids.push(arg);
  }

  return { ids, dryRun, force };
}

function existingCardIds(outputDir) {
  if (!fs.existsSync(outputDir)) return new Set();
  return new Set(
    fs.readdirSync(outputDir)
      .filter((name) => name.endsWith('.png'))
      .map((name) => path.basename(name, '.png')),
  );
}

function appendGenerationLog(outputDir, row, stdout) {
  const url = stdout.split(/\r?\n/).find((line) => /^https:\/\//.test(line.trim()))?.trim();
  if (!url) return;
  const entry = {
    id: row.id,
    url,
    path: `prototype/core-loop/public/cardart/${row.id}.png`,
    generatedAt: new Date().toISOString(),
  };
  fs.appendFileSync(
    path.join(outputDir, 'generation-log.jsonl'),
    `${JSON.stringify(entry)}\n`,
    'utf8',
  );
}

function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(scriptDir, '..');
  const outputDir = path.join(root, 'prototype/core-loop/public/cardart');
  const options = parseArgs(process.argv.slice(2));
  const rows = loadManifest(path.join(scriptDir, 'cardart-manifest.jsonl'));
  const plan = planBatch(rows, {
    ids: options.ids,
    existingIds: existingCardIds(outputDir),
    force: options.force,
  });

  for (const error of plan.errors) console.error(`FAIL ${error}`);
  if (plan.errors.length > 0) {
    process.exitCode = 1;
    return;
  }

  for (const id of plan.skipped) console.log(`SKIP ${id} existing`);
  const higgsfieldBin = options.dryRun ? null : resolveHiggsfieldBin(process.env);
  if (!options.dryRun && !higgsfieldBin) {
    console.error('FAIL Higgsfield CLI를 찾을 수 없다. HIGGSFIELD_BIN 또는 APPDATA npm shim을 확인하라.');
    process.exitCode = 1;
    return;
  }
  for (const row of plan.planned) {
    if (options.dryRun) {
      console.log(`PLAN ${row.id} composition=${row.composition}`);
      continue;
    }

    const bash = process.env.CARDART_BASH || 'C:/Program Files/Git/bin/bash.exe';
    const result = spawnSync(
      bash,
      [
        path.join(scriptDir, 'cardart-generate.sh'),
        row.id,
        row.description,
        row.composition,
      ],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, HIGGSFIELD_BIN: higgsfieldBin },
      },
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      return;
    }
    fs.mkdirSync(outputDir, { recursive: true });
    appendGenerationLog(outputDir, row, result.stdout);
  }

  console.log(`TOTAL ${plan.planned.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
