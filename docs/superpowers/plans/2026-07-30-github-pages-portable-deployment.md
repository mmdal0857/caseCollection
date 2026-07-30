# GitHub Pages Portable Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build ticket 33's manually triggered GitHub Pages pipeline from one portable, asset-complete `prototype/core-loop/dist/` bundle that can also be handed unchanged to Higgsfield.

**Architecture:** Vite emits relative URLs (`base: './'`), while one pure URL helper rebases every runtime-owned card, background, audio-manifest, and audio-file path. Source PNGs remain ignored under `.art-source/cardart/`; a lockfile-pinned Sharp tool deterministically promotes enabled cards to tracked WebP derivatives and records hashes. Source and built-artifact verifiers enforce the release closure before a SHA-pinned Pages workflow may upload only `dist/`.

**Tech Stack:** Node.js 24, TypeScript 5.7, Svelte 5, Vite 6, Node's built-in test runner, Sharp, YAML, GitHub Actions Pages actions.

## Global Constraints

- The approved design is [2026-07-30-github-pages-portable-deployment-design.md](../specs/2026-07-30-github-pages-portable-deployment-design.md). If code pressure contradicts it, stop and amend/re-approve the design instead of silently diverging.
- Preserve the user's existing `AGENTS.md` and `CLAUDE.md` modifications. Do not stage or edit them.
- Prefix executable shell commands with `rtk`. Use `apply_patch` for text-file edits.
- Use TDD for behavior changes: add one focused failing test, run it and record the expected failure, make the smallest implementation pass, then refactor only while green.
- Do not invoke an image model. Existing approved PNG masters and background derivatives are inputs to this plan.
- Source masters, benchmarks, generation logs, `protoart`, and candidates must never enter Git or `dist/`.
- Runtime WebP card derivatives, three runtime background WebPs, the promotion manifest, audio manifest, OGG, and MP3 files are release inputs and must be tracked.
- `workflow_dispatch` is the only deployment trigger. Do not add `push`, tag, schedule, or pull-request publication.
- GitHub remains the canonical release channel. Higgsfield receives the same verified `dist/` manually; the workflow must not invoke Higgsfield.
- Before every `git commit`, stop and obtain a distinct user approval. The commit commands below are prepared boundaries, not standing authorization.
- Do not create a GitHub repository, add a remote, change Pages settings, or deploy externally until the user separately authorizes those external mutations.
- Keep `.scratch/case-collection/issues/33-github-pages-deploy-pipeline.md` open and `Reviewed-by:` blank until the independent Claude review gate is satisfied.

---

### Task 1: Make every runtime-owned asset URL base-path portable

**Files:**

- Create: `prototype/core-loop/src/lib/public-assets.ts`
- Create: `prototype/core-loop/smoke-public-assets.ts`
- Modify: `prototype/core-loop/src/lib/audio.ts`
- Modify: `prototype/core-loop/src/App.svelte`
- Modify: `prototype/core-loop/src/lib/ui/CardChip.svelte`
- Modify: `prototype/core-loop/src/lib/ui/CaseScreen.svelte`
- Modify: `prototype/core-loop/vite.config.ts`
- Modify: `prototype/core-loop/package.json`
- Modify: `.gitignore`

**Step 1: Add the failing URL and audio-rebasing smoke test**

Create `smoke-public-assets.ts` with behavioral assertions:

```ts
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
```

Add:

```json
"smoke:public-assets": "esbuild smoke-public-assets.ts --bundle --format=esm --platform=node --outfile=smoke-public-assets.mjs && node smoke-public-assets.mjs"
```

and ignore only the generated `prototype/core-loop/smoke-public-assets.mjs`.

**Step 2: Run the test and confirm the expected red state**

Run:

```powershell
rtk npm run smoke:public-assets
```

Working directory: `prototype/core-loop`.

Expected: bundling fails because `src/lib/public-assets.ts` does not exist.

**Step 3: Implement the pure resolver and immutable audio-manifest rebasing**

Create:

```ts
import type { AudioManifest, AudioFileRecord } from './audio';

const REMOTE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function publicAssetUrl(assetPath: string, base: string): string {
  if (REMOTE_URL.test(assetPath)) return assetPath;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${assetPath.replace(/^\/+/, '')}`;
}

function rebaseFile(file: AudioFileRecord, base: string): AudioFileRecord {
  return { ...file, path: publicAssetUrl(file.path, base) };
}

export function rebaseAudioManifest(
  manifest: AudioManifest,
  base: string,
): AudioManifest {
  return {
    ...manifest,
    assets: manifest.assets.map((asset) => ({
      ...asset,
      files: {
        wav: rebaseFile(asset.files.wav, base),
        ogg: rebaseFile(asset.files.ogg, base),
        mp3: rebaseFile(asset.files.mp3, base),
      },
    })),
  };
}
```

Keep the function free of `window`, `document`, and origin assumptions so `./`, `/<repo>/`, desktop wrappers, and tests share the same behavior.

**Step 4: Route all four runtime asset classes through the helper**

- In `App.svelte`, fetch the manifest with:

```ts
fetch(publicAssetUrl('audio/audio-manifest.json', import.meta.env.BASE_URL))
```

After validation, pass `rebaseAudioManifest(manifest, import.meta.env.BASE_URL)` to `createBrowserAudioPort`.

- In `CardChip.svelte`, derive:

```ts
const art = $derived(
  publicAssetUrl(`assets/cards/${card.id}.webp`, import.meta.env.BASE_URL),
);
```

- In `CaseScreen.svelte`, build all three scene paths with `publicAssetUrl(...)`.
- Do not modify `BrowserAudioPort.decode`; it should consume already-rebased manifest paths.
- Set `base: './'` in `vite.config.ts`.

**Step 5: Run focused and type checks**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke:public-assets
rtk npm run smoke:audio
rtk npm run typecheck
rtk npm run build
```

Expected: all pass; the built HTML references `./assets/...`, and no runtime code contains `"/assets/` or `"/audio/` owned paths.

**Step 6: Review and prepare the commit boundary**

Run:

```powershell
rtk git diff -- .gitignore prototype/core-loop/package.json prototype/core-loop/vite.config.ts prototype/core-loop/src prototype/core-loop/smoke-public-assets.ts
rtk git status --short
```

After separate user approval:

```powershell
rtk git add .gitignore prototype/core-loop/package.json prototype/core-loop/vite.config.ts prototype/core-loop/src/App.svelte prototype/core-loop/src/lib/audio.ts prototype/core-loop/src/lib/public-assets.ts prototype/core-loop/src/lib/ui/CardChip.svelte prototype/core-loop/src/lib/ui/CaseScreen.svelte prototype/core-loop/smoke-public-assets.ts
rtk git commit -m "feat: make runtime assets base-path portable"
```

---

### Task 2: Add deterministic card-art promotion

**Files:**

- Create: `prototype/core-loop/scripts/promote-card-art.mjs`
- Create: `prototype/core-loop/scripts/promote-card-art.test.mjs`
- Modify: `prototype/core-loop/package.json`
- Modify: `prototype/core-loop/package-lock.json`

**Step 1: Pin the converter and YAML parser in the lockfile**

Run from `prototype/core-loop`:

```powershell
rtk npm install --save-dev --save-exact sharp yaml
```

Do not hand-edit resolved versions. `package.json` and `package-lock.json` become the converter/toolchain version authority.

Add scripts:

```json
"art:promote": "node scripts/promote-card-art.mjs",
"test:release-tools": "node --test scripts/promote-card-art.test.mjs"
```

**Step 2: Write failing tests against the public promotion API**

The module must export:

```js
export const PROMOTION_OPTIONS = {
  width: 440,
  height: 584,
  fit: 'cover',
  position: 'centre',
  withoutEnlargement: true,
  quality: 82,
  effort: 6,
};

export async function promoteCardArt({
  manifestPath,
  sourceDir,
  outputDir,
  promotionManifestPath,
}) {}
```

Test with `node:test`, a unique `fs.mkdtemp` directory, and Sharp-created input fixtures. Assert behavior rather than implementation text:

```js
test('promotes enabled clues only and records independently verified hashes', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'card-promote-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const sourceDir = path.join(root, 'source');
  const outputDir = path.join(root, 'public/assets/cards');
  await fs.mkdir(sourceDir, { recursive: true });
  await sharp({
    create: {
      width: 880,
      height: 1168,
      channels: 3,
      background: '#14120f',
    },
  }).png().toFile(path.join(sourceDir, 'alpha.png'));
  await fs.writeFile(
    path.join(root, 'manifest.jsonl'),
    [
      JSON.stringify({ id: 'alpha', category: 'clue', enabled: true }),
      JSON.stringify({ id: 'pattern', category: 'adjunct', enabled: false }),
    ].join('\n'),
  );

  const report = await promoteCardArt({
    manifestPath: path.join(root, 'manifest.jsonl'),
    sourceDir,
    outputDir,
    promotionManifestPath: path.join(root, 'promotions.json'),
  });

  assert.deepEqual(report.promoted, ['alpha']);
  assert.equal(await exists(path.join(outputDir, 'alpha.webp')), true);
  assert.equal(await exists(path.join(outputDir, 'pattern.webp')), false);
  const metadata = await sharp(path.join(outputDir, 'alpha.webp')).metadata();
  assert.deepEqual(
    { format: metadata.format, width: metadata.width, height: metadata.height },
    { format: 'webp', width: 440, height: 584 },
  );
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'promotions.json'), 'utf8'));
  assert.equal(manifest.items[0].sourceSha256, await sha256(path.join(sourceDir, 'alpha.png')));
  assert.equal(manifest.items[0].outputSha256, await sha256(path.join(outputDir, 'alpha.webp')));
});
```

Add separate tests that assert:

- an enabled row with no source PNG rejects with `missing source PNG: <id>`;
- a disabled adjunct is not required or emitted;
- rerunning unchanged inputs produces the same output SHA-256 and stable manifest content apart from no timestamps (the manifest must contain no clock-derived field);
- metadata is stripped and a source smaller than the target is not enlarged.

**Step 3: Run the tests and confirm the expected red state**

Run from `prototype/core-loop`:

```powershell
rtk npm run test:release-tools
```

Expected: import fails because `scripts/promote-card-art.mjs` does not exist.

**Step 4: Implement the minimal deterministic transformer**

Implementation contract:

- Parse nonblank JSONL rows and select only `enabled === true`.
- Sort selected rows by `id` before processing and before writing the manifest.
- Reject duplicate IDs, path separators in IDs, and missing PNGs.
- Read the source bytes once and hash them with `crypto.createHash('sha256')`.
- Render with:

```js
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
```

- Do not call `withMetadata`.
- Write `prototype/core-loop/release/card-art-promotions.json` atomically through a sibling temporary file.
- Use this schema:

```json
{
  "format": "card-art-promotions@1",
  "converter": {
    "package": "sharp",
    "version": "<sharp.versions.sharp>",
    "options": {
      "width": 440,
      "height": 584,
      "fit": "cover",
      "position": "centre",
      "withoutEnlargement": true,
      "quality": 82,
      "effort": 6
    }
  },
  "items": [
    {
      "id": "alpha",
      "sourceSha256": "<64 lowercase hex>",
      "outputSha256": "<64 lowercase hex>",
      "outputPath": "public/assets/cards/alpha.webp"
    }
  ]
}
```

- The CLI defaults must resolve from repository root:
  - manifest: `scripts/cardart-manifest.jsonl`
  - source: `prototype/core-loop/.art-source/cardart`
  - output: `prototype/core-loop/public/assets/cards`
  - record: `prototype/core-loop/release/card-art-promotions.json`
- Print one `PASS promoted=<count>` line. Any failure prints `FAIL <specific reason>` and exits nonzero.

**Step 5: Run focused tests**

Run:

```powershell
rtk npm run test:release-tools
```

Expected: all promotion tests pass.

**Step 6: Review and prepare the commit boundary**

Run:

```powershell
rtk git diff -- prototype/core-loop/scripts/promote-card-art.mjs prototype/core-loop/scripts/promote-card-art.test.mjs prototype/core-loop/package.json prototype/core-loop/package-lock.json
rtk git status --short
```

After separate user approval:

```powershell
rtk git add prototype/core-loop/scripts/promote-card-art.mjs prototype/core-loop/scripts/promote-card-art.test.mjs prototype/core-loop/package.json prototype/core-loop/package-lock.json
rtk git commit -m "build: add deterministic card art promotion"
```

---

### Task 3: Separate source art from tracked runtime derivatives

**Files:**

- Modify: `.gitignore`
- Modify: `scripts/cardart-generate.sh`
- Modify: `scripts/cardart-batch.mjs`
- Modify: `scripts/cardart-batch.test.mjs`
- Modify: `scripts/cardart-compare.mjs`
- Modify: `scripts/cardart-compare.test.mjs`
- Modify: `scripts/sync-cardart.cmd`
- Modify: `docs/art/README.md`
- Create: `prototype/core-loop/release/card-art-promotions.json` (generated)
- Add: `prototype/core-loop/public/assets/cards/*.webp` (20 generated derivatives)
- Add: `prototype/core-loop/public/assets/backgrounds/*.webp` (3 existing approved derivatives)
- Move locally, still ignored: `prototype/core-loop/public/cardart/` → `prototype/core-loop/.art-source/cardart/`
- Move locally, still ignored: `prototype/core-loop/public/protoart/` → `prototype/core-loop/.art-source/protoart/` when present

**Step 1: Make path expectations fail first**

Extend existing root-script tests to assert:

- card generation and batch defaults resolve to `.art-source/cardart`;
- comparison output resolves to `.art-source/cardart/benchmark`;
- the generation-log record names `.art-source/cardart/<id>.png`;
- no tested source path contains `public/cardart`.

Extract small exported path builders where necessary instead of reading script source text in tests:

```js
export function cardArtSourceDir(root) {
  return path.join(root, 'prototype/core-loop/.art-source/cardart');
}
```

Run from repository root:

```powershell
rtk node --test scripts/cardart-batch.test.mjs scripts/cardart-compare.test.mjs
```

Expected: assertions fail because defaults still point at `public/cardart`.

**Step 2: Update source-tool paths and documentation**

- Change generation, batch, comparison, and sync paths to `.art-source/cardart`.
- Keep benchmark under `.art-source/cardart/benchmark`.
- Update the logged path to `prototype/core-loop/.art-source/cardart/<id>.png`.
- Update `docs/art/README.md` to distinguish:
  - Drive/source authority: `.art-source/cardart/*.png`;
  - ignored comparison and generation records under `.art-source/cardart/`;
  - tracked deploy derivatives: `public/assets/cards/*.webp`;
  - deterministic reproduction: `cd prototype/core-loop && npm run art:promote`.
- Change `.gitignore` to ignore `prototype/core-loop/.art-source/` and stop ignoring `prototype/core-loop/public/assets/backgrounds/`.
- Keep `prototype/core-loop/public/protoart/` ignored temporarily until the local move is verified; remove the obsolete ignore only after it is empty.

**Step 3: Verify and perform recoverable local moves**

Resolve the exact workspace-local source and destination paths before moving. Then move directories without deletion:

```powershell
rtk powershell -NoProfile -Command '$root=(Resolve-Path "F:\Project\caseCollection\prototype\core-loop").Path; $source=Join-Path $root "public\cardart"; $target=Join-Path $root ".art-source\cardart"; if ((Test-Path $source) -and (Test-Path $target)) { throw "both card-art locations exist" }; if (Test-Path $source) { New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null; Move-Item -LiteralPath $source -Destination $target }'
rtk powershell -NoProfile -Command '$root=(Resolve-Path "F:\Project\caseCollection\prototype\core-loop").Path; $source=Join-Path $root "public\protoart"; $target=Join-Path $root ".art-source\protoart"; if ((Test-Path $source) -and (Test-Path $target)) { throw "both proto-art locations exist" }; if (Test-Path $source) { New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null; Move-Item -LiteralPath $source -Destination $target }'
```

Verify:

```powershell
rtk powershell -NoProfile -Command 'Get-ChildItem "F:\Project\caseCollection\prototype\core-loop\.art-source\cardart" -File -Filter *.png | Measure-Object | Select-Object -ExpandProperty Count'
rtk powershell -NoProfile -Command 'Test-Path "F:\Project\caseCollection\prototype\core-loop\public\cardart"; Test-Path "F:\Project\caseCollection\prototype\core-loop\public\protoart"'
```

Expected: 20 top-level approved PNGs; both old public source directories are absent.

**Step 4: Generate tracked runtime card derivatives**

Run from `prototype/core-loop`:

```powershell
rtk npm run art:promote
```

Expected: `PASS promoted=20`, 20 WebPs under `public/assets/cards`, and a 20-item promotion manifest.

**Step 5: Validate asset inventory**

Run:

```powershell
rtk node --test scripts/cardart-batch.test.mjs scripts/cardart-compare.test.mjs scripts/check-cardart-manifest.test.mjs
rtk powershell -NoProfile -Command 'Get-ChildItem "F:\Project\caseCollection\prototype\core-loop\public\assets\cards" -File -Filter *.webp | Measure-Object | Select-Object -ExpandProperty Count'
rtk powershell -NoProfile -Command 'Get-ChildItem "F:\Project\caseCollection\prototype\core-loop\public\assets\backgrounds" -File -Filter *.webp | Measure-Object | Select-Object -ExpandProperty Count'
rtk git status --short
```

Expected: tests pass, counts are 20 and 3, ignored `.art-source` files do not appear in Git status, and only runtime derivatives/metadata plus intended script/docs changes are untracked or modified.

**Step 6: Review and prepare the commit boundary**

After checking that no PNG master, benchmark, generation log, or `protoart` file is staged, obtain separate user approval and run:

```powershell
rtk git add .gitignore docs/art/README.md scripts/cardart-generate.sh scripts/cardart-batch.mjs scripts/cardart-batch.test.mjs scripts/cardart-compare.mjs scripts/cardart-compare.test.mjs scripts/sync-cardart.cmd prototype/core-loop/release/card-art-promotions.json prototype/core-loop/public/assets/cards prototype/core-loop/public/assets/backgrounds
rtk git diff --cached --stat
rtk git commit -m "chore: promote release art derivatives"
```

---

### Task 4: Enforce source and built-artifact release closure

**Files:**

- Create: `prototype/core-loop/scripts/verify-release.mjs`
- Create: `prototype/core-loop/scripts/verify-release.test.mjs`
- Modify: `prototype/core-loop/package.json`

**Step 1: Define the verifier API and failing fixtures**

Export:

```js
export async function verifySourceRelease(options) {}
export async function verifyDistRelease(options) {}
export async function directorySize(root) {}
```

Use temporary fixture trees in `verify-release.test.mjs`. Each test should make exactly one contract invalid and assert its specific diagnostic:

1. enabled manifest row missing `public/assets/cards/<id>.webp`;
2. output hash differs from `card-art-promotions.json`;
3. source PNG exists locally but its source hash is stale;
4. one of `trust-low.webp`, `trust-mid.webp`, `trust-high.webp` is missing;
5. an audio-manifest OGG or MP3 is missing;
6. source/benchmark/protoart directory exists under `public`;
7. textual `dist` asset contains `"/assets/` or `"/audio/`;
8. `dist` contains `cardart`, `benchmark`, `protoart`, `audio-candidates`, or `generation-log`;
9. total artifact bytes exceed `64 * 1024 * 1024`;
10. a valid minimal source and a valid minimal `dist` both return no issues.

The public functions should return structured issues for testability:

```js
{
  ok: false,
  issues: [{ path: 'public/assets/cards/alpha.webp', message: 'missing enabled card derivative' }]
}
```

The CLI prints `FAIL <path>: <message>` for every issue and exits 1, or one `PASS ...` summary and exits 0.

**Step 2: Run the tests and confirm the expected red state**

Add:

```json
"release:verify-source": "node scripts/verify-release.mjs source",
"release:verify-dist": "node scripts/verify-release.mjs dist",
"test:release-tools": "node --test scripts/promote-card-art.test.mjs scripts/verify-release.test.mjs"
```

Run:

```powershell
rtk npm run test:release-tools
```

Expected: import fails because `scripts/verify-release.mjs` does not exist.

**Step 3: Implement source verification**

Source-mode defaults:

- app root: current working directory;
- card manifest: `../../scripts/cardart-manifest.jsonl`;
- promotion manifest: `release/card-art-promotions.json`;
- optional source directory: `.art-source/cardart`;
- runtime public root: `public`.

Rules:

- Parse all enabled rows, require exactly one promotion item and one WebP for each, and reject promotion records for disabled/unknown IDs.
- Require `card-art-promotions@1`, `converter.package === 'sharp'`, the currently installed `sharp.versions.sharp`, and exact equality with `PROMOTION_OPTIONS`; configuration drift must fail before hashes are considered.
- Independently compute each output SHA-256.
- If the corresponding source PNG exists, independently compute and compare its source SHA-256; absence is valid in clean CI.
- Require the three exact background filenames.
- Parse `public/audio/audio-manifest.json`; require each listed OGG and MP3 path after stripping only leading `/`. WAV is provenance and may remain, but is not a runtime requirement.
- Reject `public/cardart`, `public/protoart`, any segment named `benchmark`, `audio-candidates`, or a generation-log file under `public`.

**Step 4: Implement dist verification**

- Recursively inventory regular files and sum exact byte sizes.
- Reject artifacts larger than 64 MiB.
- Require `index.html`, each enabled card WebP, the three backgrounds, the audio manifest, and its OGG/MP3 files.
- Scan `.html`, `.js`, `.css`, and `.json` as UTF-8 and reject owned root-absolute `/assets/` and `/audio/` URL literals.
- Reject forbidden source/candidate path segments case-insensitively.
- Never repair, copy, or substitute a missing asset.

**Step 5: Run focused verification on fixtures and the real source**

Run:

```powershell
rtk npm run test:release-tools
rtk npm run release:verify-source
rtk npm run build
rtk npm run release:verify-dist
```

Expected: all pass and the real `dist` is at most 64 MiB.

**Step 6: Review and prepare the commit boundary**

After separate user approval:

```powershell
rtk git add prototype/core-loop/scripts/verify-release.mjs prototype/core-loop/scripts/verify-release.test.mjs prototype/core-loop/package.json
rtk git commit -m "build: verify release asset closure"
```

---

### Task 5: Turn the legacy smoke suite into a strict CI gate

**Files:**

- Create: `prototype/core-loop/scripts/run-core-smoke-ci.mjs`
- Create: `prototype/core-loop/scripts/run-core-smoke-ci.test.mjs`
- Modify: `prototype/core-loop/package.json`

**Step 1: Write failing process-behavior tests**

Export:

```js
export async function runChecked(command, args, options = {}) {}
export async function runSmokeSuite(scripts, options = {}) {}
```

Tests create tiny temporary `.mjs` child programs and assert:

- streamed `PASS` plus exit 0 resolves;
- a child that prints `FAIL hidden regression` but exits 0 rejects;
- a child that prints no `FAIL` but exits 7 rejects;
- the suite stops before the next script after the first failure;
- both stdout and stderr are included in FAIL detection and are forwarded to the parent streams.

**Step 2: Run the test and confirm red**

Add:

```json
"smoke:ci": "node scripts/run-core-smoke-ci.mjs"
```

Extend `test:release-tools` with `scripts/run-core-smoke-ci.test.mjs`, then run:

```powershell
rtk npm run test:release-tools
```

Expected: import fails because the CI wrapper does not exist.

**Step 3: Implement strict sequential orchestration**

The executable suite must run these package scripts in order:

```js
export const CORE_SMOKE_SCRIPTS = [
  'smoke:validator-esm',
  'smoke',
  'smoke:datapack',
  'smoke:pack-storage',
  'smoke:run-flow',
  'smoke:run-session',
  'smoke:collection',
  'smoke:narrative',
  'smoke:audio',
  'smoke:public-assets',
  'smoke:case-generator-e2e',
];
```

Use `npm.cmd` on Windows and `npm` elsewhere. Stream each chunk as it arrives, while retaining only enough text to detect `/\bFAIL\b/`. A nonzero exit, signal, spawn error, or any `FAIL` token fails the wrapper. Print `PASS smoke:ci scripts=11` only when all scripts pass.

**Step 4: Run focused and full smoke checks**

Run:

```powershell
rtk npm run test:release-tools
rtk npm run smoke:ci
```

Expected: wrapper tests pass and the 11 real smoke scripts complete with no hidden `FAIL`.

**Step 5: Review and prepare the commit boundary**

After separate user approval:

```powershell
rtk git add prototype/core-loop/scripts/run-core-smoke-ci.mjs prototype/core-loop/scripts/run-core-smoke-ci.test.mjs prototype/core-loop/package.json
rtk git commit -m "ci: make the smoke suite a strict gate"
```

---

### Task 6: Add and semantically validate the manual Pages workflow

**Files:**

- Create: `.github/workflows/deploy-pages.yml`
- Create: `prototype/core-loop/scripts/verify-pages-workflow.mjs`
- Create: `prototype/core-loop/scripts/verify-pages-workflow.test.mjs`
- Modify: `prototype/core-loop/package.json`

**Step 1: Write the failing workflow-contract test**

`verify-pages-workflow.mjs` must parse YAML with `yaml`, not grep source text, and export:

```js
export function validatePagesWorkflow(document) {}
```

Test a valid in-memory document and one mutation per prohibited behavior:

- only `on.workflow_dispatch` exists;
- build permissions contain only `contents: read`;
- deploy permissions are `pages: write` and `id-token: write`;
- deploy uses `environment.name: github-pages`;
- working directory is `prototype/core-loop`;
- commands include `npm ci`, `schema:check`, `test:release-tools`, `smoke:ci`, `release:verify-source`, `typecheck`, `build`, and `release:verify-dist`;
- upload path is exactly `prototype/core-loop/dist`;
- concurrency group is `pages` and `cancel-in-progress` is `false`;
- deploy needs build;
- the `uses:` set is exactly the five approved official action repositories below, each paired with its verified immutable 40-character lowercase SHA rather than a tag.

Add the real-file CLI to `test:release-tools`.

**Step 2: Run the test and confirm red**

Run:

```powershell
rtk npm run test:release-tools
```

Expected: failure because the validator/workflow does not exist.

**Step 3: Implement the semantic validator**

Return the same structured issue form used by the release verifier. The CLI reads repository-root `.github/workflows/deploy-pages.yml`, prints every issue, and exits nonzero on any policy drift.

Be aware that YAML parsers can normalize the `on` key differently under YAML 1.1; use the `yaml` package's YAML 1.2 behavior and assert the parsed `on` property explicitly.

**Step 4: Create the workflow with current approved immutable action SHAs**

The five SHA/tag pairs below were rechecked against each official action repository with `git ls-remote --tags` on 2026-07-30.

Create:

```yaml
name: Deploy GitHub Pages

on:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: prototype/core-loop
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: prototype/core-loop/package-lock.json
      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0
      - run: npm ci
      - run: npm run schema:check
      - run: npm run test:release-tools
      - run: npm run smoke:ci
      - run: npm run release:verify-source
      - run: npm run typecheck
      - run: npm run build
      - run: npm run release:verify-dist
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
        with:
          path: prototype/core-loop/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0
```

Do not add `push`, branches, tags, Higgsfield calls, repository-root uploads, or fallback deploy paths.

**Step 5: Run workflow and release contract checks**

Run:

```powershell
rtk npm run test:release-tools
rtk npm run release:verify-source
rtk npm run build
rtk npm run release:verify-dist
```

Expected: all pass.

**Step 6: Review and prepare the commit boundary**

After separate user approval:

```powershell
rtk git add .github/workflows/deploy-pages.yml prototype/core-loop/scripts/verify-pages-workflow.mjs prototype/core-loop/scripts/verify-pages-workflow.test.mjs prototype/core-loop/package.json prototype/core-loop/package-lock.json
rtk git commit -m "ci: add manual GitHub Pages deployment"
```

---

### Task 7: Run the complete local release proof, including a nested path

**Files:**

- Modify only if a real defect is found; return to the owning task's test first.
- Create temporary preview files outside tracked paths only.

**Step 1: Run the full clean gate**

From `prototype/core-loop`:

```powershell
rtk npm ci
rtk npm run schema:check
rtk npm run test:release-tools
rtk npm run smoke:ci
rtk npm run release:verify-source
rtk npm run typecheck
rtk npm run build
rtk npm run release:verify-dist
```

Expected: every command exits 0, no output contains `FAIL`, and `dist` remains at most 64 MiB.

**Step 2: Prove the bundle works below a repository-like subpath**

Serve the already-built bundle through Vite Preview with a repository-like base:

```powershell
rtk npm run preview -- --host 127.0.0.1 --port 4173 --base /caseCollection/
```

Use the Chrome DevTools integration to open `http://127.0.0.1:4173/caseCollection/` and verify:

- the home screen renders without a blank page;
- every card/background request issued by a representative home → run → collection flow, the audio manifest, and at least one OGG request resolve under `/caseCollection/` without 404;
- the console has no uncaught exception;
- starting a run and rendering a case shows card/background art rather than fallback glyphs.

Stop the preview process after inspection.

**Step 3: Inspect the final change set**

Run:

```powershell
rtk git status --short
rtk git diff --stat HEAD
rtk git diff --check
rtk git log -7 --oneline
```

Expected: only ticket-33 files/commits are present in the feature change set; the user's `AGENTS.md` and `CLAUDE.md` edits remain unstaged and untouched.

---

### Task 8: Satisfy the independent Claude review gate

**Files:**

- Modify after accepted review: `.scratch/case-collection/issues/33-github-pages-deploy-pipeline.md`
- Modify only if review finds a defect: files owned by Tasks 1–6, with a new failing regression test first

**Step 1: Prepare the review packet**

Provide Claude:

- design spec path;
- implementation-plan path;
- commit range beginning after design commit `6f2461a`;
- full local gate commands and concise pass results;
- nested-path URL and network/console observations;
- explicit request for these four checks:
  1. consistency with closed tickets 05, 08, and 13;
  2. `CONTEXT.md` terminology consistency;
  3. dead links and missing asset closure;
  4. runnable commands and deployed-path correctness.

**Step 2: Process review comments technically**

For every comment:

- verify it against the approved design and current code;
- reject unsupported scope expansion with evidence;
- for valid defects, add a failing regression test, implement the smallest fix, rerun the owning task and full gate;
- obtain separate approval before any review-fix commit.

Do not fill `Reviewed-by:` from an informal mention. Require an identifiable Claude review result that addresses all four checks.

**Step 3: Record accepted review**

Only after all actionable findings are resolved, update:

```text
Reviewed-by: Claude (<review identifier or date>)
```

Add a concise comment summarizing reviewed commit range, checks, and any resolved findings. Keep `Status: open` until external Pages verification in Task 9.

After separate user approval:

```powershell
rtk git add .scratch/case-collection/issues/33-github-pages-deploy-pipeline.md
rtk git commit -m "docs: record ticket 33 independent review"
```

---

### Task 9: Authorize and verify the real GitHub Pages deployment

**Files:**

- Modify after successful deployment: `.scratch/case-collection/issues/33-github-pages-deploy-pipeline.md`
- Modify as required by Wayfinder: `.scratch/case-collection/MAP.md`

**Step 1: Stop at the external-mutation gate**

Ask for explicit authorization covering the exact proposed repository visibility/name, remote addition, push, Pages source configuration, and first manual workflow dispatch.

If authorization is not granted, leave ticket 33 open and record the external prerequisite without pretending the pipeline is deployed. Do not block local implementation completion.

**Step 2: After authorization, create/connect and configure**

- Re-check that the intended repository does not already exist.
- Create or connect only the approved public repository.
- Add the approved remote without overwriting an unrelated remote.
- Push the reviewed commits.
- Configure Pages source to GitHub Actions.
- Manually dispatch `Deploy GitHub Pages`.

Use the connected GitHub tooling for external state and read back the repository, workflow run, job conclusions, environment, and deployment URL.

**Step 3: Verify the production deployment**

Wait for both build and deploy jobs to succeed. Open the returned production URL and repeat the Task 7 browser checks, now asserting:

- the URL contains the actual `/<repo>/` path when no custom domain is configured;
- all owned assets load from the deployment path;
- no source-only directory is publicly reachable from the artifact;
- one new run reaches a case screen with art and audio fetches intact.

If CI or production fails, add a local regression test that reproduces the failure before changing code. Never publish a local fallback artifact.

**Step 4: Close ticket 33 with evidence**

Update the ticket with:

- `Status: resolved`;
- workflow run URL/identifier;
- production Pages URL;
- reviewed commit SHA/range;
- exact local and CI gates;
- artifact size;
- explicit note that Higgsfield publishing remains a manual consumer of the same `dist`.

Update `MAP.md` only according to its existing Wayfinder conventions.

Run:

```powershell
rtk git diff -- .scratch/case-collection/issues/33-github-pages-deploy-pipeline.md .scratch/case-collection/MAP.md
rtk git status --short
```

After separate user approval:

```powershell
rtk git add .scratch/case-collection/issues/33-github-pages-deploy-pipeline.md .scratch/case-collection/MAP.md
rtk git commit -m "docs: resolve GitHub Pages pipeline ticket"
rtk git push
```

**Step 5: Hand off to ticket 34**

Re-read ticket 34 and its dependencies after ticket 33 is resolved. Do not fold ticket 34's visual-identity generation into this plan; ticket 34 begins with its own approved design/review cycle.

---

## Final Verification Matrix

| Contract | Local proof | CI proof | Production proof |
|---|---|---|---|
| Relative base paths | `smoke:public-assets`, nested preview | built `dist` verifier | Pages network requests |
| Enabled card closure | promotion tests, source verifier | source + dist verifier | 20 WebP requests |
| Source/runtime separation | Git status + source verifier | clean checkout + upload `dist` only | forbidden paths absent |
| Audio closure | audio smoke + source/dist verifier | same gates | manifest and OGG request |
| Legacy regression safety | strict `smoke:ci` wrapper | same wrapper | representative run |
| Manual-only publication | semantic workflow test | workflow event is dispatch | audited run |
| Independent review | recorded Claude review | reviewed SHA deployed | ticket evidence |

## Plan Self-Review

- Coverage: every approved design decision maps to Tasks 1–9 and the final matrix.
- Scope: ticket 34 art identity and ticket 35 full playthrough remain downstream; no image generation or Higgsfield publication was added.
- External unknowns: production URL/repository identity are intentionally unavailable facts, guarded by an explicit authorization step rather than guessed values.
- Type/interface consistency: URL rebasing works on the existing `AudioManifest`/`AudioFileRecord` types; Node release tools use structured issue results; workflow verification parses YAML 1.2.
- Recovery: ignored source art is moved, not deleted; missing assets cause failure; no fallback deployment exists.
