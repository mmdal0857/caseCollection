import assert from 'node:assert/strict';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runChecked, runSmokeSuite } from './run-core-smoke-ci.mjs';

function createSink() {
  const chunks = [];
  return {
    write(chunk) {
      chunks.push(chunk.toString());
      return true;
    },
    get text() {
      return chunks.join('');
    },
  };
}

async function writeScript(dir, name, body) {
  const filePath = path.join(dir, `${name}.mjs`);
  await writeFile(filePath, body);
  return filePath;
}

test('resolves when a child streams PASS and exits 0', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'smoke-ci-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const script = await writeScript(dir, 'ok', "console.log('PASS ok'); process.exit(0);");
  const stdout = createSink();
  const stderr = createSink();

  await runChecked(process.execPath, [script], { stdout, stderr });

  assert.match(stdout.text, /PASS ok/);
});

test('rejects when a child prints FAIL but exits 0', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'smoke-ci-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const script = await writeScript(dir, 'hidden', "console.log('FAIL hidden regression'); process.exit(0);");

  await assert.rejects(() =>
    runChecked(process.execPath, [script], { stdout: createSink(), stderr: createSink() }));
});

test('rejects when a child exits nonzero without printing FAIL', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'smoke-ci-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const script = await writeScript(dir, 'crash', 'process.exit(7);');

  await assert.rejects(() =>
    runChecked(process.execPath, [script], { stdout: createSink(), stderr: createSink() }));
});

test('forwards both stdout and stderr to the parent streams while detecting FAIL on either', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'smoke-ci-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const script = await writeScript(
    dir,
    'both-streams',
    "console.log('normal output'); console.error('FAIL from stderr'); process.exit(0);",
  );
  const stdout = createSink();
  const stderr = createSink();

  await assert.rejects(() => runChecked(process.execPath, [script], { stdout, stderr }));
  assert.match(stdout.text, /normal output/);
  assert.match(stderr.text, /FAIL from stderr/);
});

test('a FAIL token split across two stream chunks is still detected', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'smoke-ci-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const script = await writeScript(
    dir,
    'split-fail',
    "process.stdout.write('leading FA'); process.stdout.write('IL split token\\n'); process.exit(0);",
  );

  await assert.rejects(() =>
    runChecked(process.execPath, [script], { stdout: createSink(), stderr: createSink() }));
});

test('runs the suite defaults against a real npm script without a spawn error', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'smoke-ci-npm-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'smoke-ci-fixture',
      private: true,
      scripts: { ping: 'node -e "console.log(\'PASS ping\')"' },
    }),
  );
  const stdout = createSink();
  const stderr = createSink();

  await runSmokeSuite(['ping'], { cwd: dir, stdout, stderr });

  assert.match(stdout.text, /PASS ping/);
});

test('stops the suite before running the next script after the first failure', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'smoke-ci-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const sentinel = path.join(dir, 'third-ran.marker');
  await writeScript(dir, 'first', "console.log('PASS first'); process.exit(0);");
  await writeScript(dir, 'second', 'process.exit(3);');
  await writeScript(
    dir,
    'third',
    `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(sentinel)}, 'ran');`,
  );

  await assert.rejects(() =>
    runSmokeSuite(['first', 'second', 'third'], {
      command: process.execPath,
      buildArgs: (name) => [path.join(dir, `${name}.mjs`)],
      stdout: createSink(),
      stderr: createSink(),
    }));

  await assert.rejects(() => access(sentinel));
});
