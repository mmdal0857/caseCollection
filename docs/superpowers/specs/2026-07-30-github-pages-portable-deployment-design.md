# GitHub Pages Portable Deployment Design

> Status: approved by user on 2026-07-30; implementation pending
> Governing ticket: `.scratch/case-collection/issues/33-github-pages-deploy-pipeline.md`
> Review gate: `Reviewed-by: Claude` is required before this becomes dependable downstream authority

## 1. Purpose

Create one reproducible static release build for caseCollection that can be
published to GitHub Pages and handed unchanged to the manual Higgsfield
deployment path. A clean checkout must produce the same runtime shape without
depending on a developer's Google Drive mount or ignored working files.

The workflow deploys only when a user explicitly starts it with
`workflow_dispatch`. Pushes to `main`, tags, and pull requests do not publish.

## 2. Evidence and constraints

- The application root is `prototype/core-loop/`, not the repository root.
- `vite.config.ts` currently uses Vite's default `/` base.
- `CardChip.svelte`, `CaseScreen.svelte`, `App.svelte`, and the audio manifest
  currently contain root-absolute public paths. Those paths break when the
  Pages site is hosted below `/<repository>/`.
- Final clue PNGs and background WebPs are ignored by Git. The current local
  build succeeds only because Vite copies ignored working files from
  `public/`; a clean Actions checkout does not contain them.
- `public/cardart/benchmark` is about 84 MB, the twenty final clue PNGs are
  about 19.7 MB, and the inspected local `dist/` is about 154 MB. Publishing
  the current local `public/` tree would leak development benchmarks into the
  release artifact.
- Ticket 05 keeps a future desktop wrapper open. A repository-name-specific
  build would unnecessarily bind the artifact to Pages.
- Ticket 13 keeps source-generation binaries out of Git and uses Google Drive
  as the card-art master store. The user approved a narrow exception:
  optimized runtime derivatives may be tracked while source PNGs and
  benchmarks remain outside Git.

GitHub's supported custom Pages workflow is checkout, build, upload a Pages
artifact, then deploy it from a job with `pages: write` and `id-token: write`.
Vite documents `base: './'` for builds whose final base path is not known in
advance.

References:

- <https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages>
- <https://vite.dev/guide/build.html#relative-base>
- <https://vite.dev/guide/static-deploy.html#github-pages>

## 3. Considered approaches

### A. Portable tracked runtime derivatives — selected

Keep original generated PNGs and benchmarks outside Git. Promote only
optimized WebPs into a tracked runtime directory, use a relative Vite base, and
resolve all dynamic public URLs through one helper. The resulting `dist/` is
host-independent and reproducible from a clean checkout.

Trade-off: Git contains selected binary distribution assets, and the promotion
tool becomes part of the release process. This is the approved exception to
ticket 13, not a change to the source-master boundary.

### B. Pages-specific build — rejected

Set `base` to a repository-name path such as `/caseCollection/` and build a
Pages-only artifact.

This is initially simpler but couples the output to an unknown future remote
name and requires separate builds for a custom domain, Higgsfield, or a desktop
wrapper.

### C. Upload a developer-built archive — rejected

Build locally with Drive-mounted assets and upload the archive as a release
input.

This does not prove clean-checkout reproducibility and can silently include the
ignored 84 MB benchmark tree or stale local files.

## 4. Architecture

### 4.1 Source art and release art

The art boundary has two tiers:

1. **Source masters**
   - Original generated clue and pattern PNGs.
   - Model comparison images, generation logs, and other benchmarks.
   - Remain ignored and synchronized with Google Drive.
   - Live under `prototype/core-loop/.art-source/cardart/`, outside Vite's
     `public/` tree, so a normal build cannot copy them by accident.
2. **Runtime derivatives**
   - Optimized WebPs promoted from approved masters.
   - Live under `prototype/core-loop/public/assets/cards/`.
   - The three approved state-owned background WebPs live under
     `prototype/core-loop/public/assets/backgrounds/`.
   - These files are tracked because they are required inputs to a clean
     static build.

The existing card-art manifest remains the inventory. Rows with
`enabled: true` are eligible for promotion. Ticket 33 initially covers the
twenty enabled clue rows; ticket 34 extends that same contract when pattern art
is approved. Disabled hint rows do not become release requirements merely
because they remain in the manifest.

A local promotion command converts approved source PNGs into runtime WebPs.
It never invokes an image model and never overwrites Drive masters. Promotion
uses a lockfile-pinned `sharp` dependency, removes source metadata, resizes to
440×584 with centered `cover` fit and no enlargement, then encodes WebP at
quality 82 and effort 6. These dimensions are exactly one half of the current
880×1168 approved masters and retain roughly three device pixels across the
148-pixel card width.

`prototype/core-loop/release/card-art-promotions.json` records, per promoted
ID, the source SHA-256, output SHA-256, converter version, and the fixed options
above. When source masters are present, local verification detects a stale
derivative by comparing both hashes. A clean CI checkout has no source masters,
so it verifies the tracked output against the recorded output hash instead.

### 4.2 Public asset addressing

Vite uses `base: './'`. Generated HTML, JavaScript, and CSS therefore use
relative asset references.

Dynamic public paths do not receive Vite rewriting automatically. A small pure
helper joins a Vite base with an application-relative asset path. It is used
for:

- clue-card WebPs;
- state-owned background WebPs;
- the audio manifest request; and
- audio file paths read from the manifest.

The helper strips one or more leading slashes from local paths, preserves the
base's trailing slash contract, and leaves fully qualified remote URLs
unchanged. Runtime code must not concatenate `'/assets'` or `'/audio'`
directly.

### 4.3 Release verification

Release verification has two stages.

**Source-stage verification**, before `vite build`:

- every enabled card-art manifest row has its promoted WebP;
- the three state-owned backgrounds exist;
- the tracked audio manifest and every referenced OGG/MP3 file exist;
- source masters and benchmark directories are not inside the release public
  tree.

**Dist-stage verification**, after `vite build`:

- `dist/index.html` contains no root-absolute `/assets/` reference;
- all required runtime derivatives and audio files exist below `dist/`;
- development-only `cardart`, `benchmark`, `protoart`, candidate-audio, and
  generation-log paths are absent;
- the complete artifact is no larger than 64 MiB.

Any failed check exits nonzero and prevents artifact upload.

### 4.4 GitHub Actions workflow

The workflow is `.github/workflows/deploy-pages.yml`.

It has only a `workflow_dispatch` trigger and two jobs:

1. **build**
   - checkout at an immutable action commit;
   - install Node 24, matching the verified local baseline;
   - run `npm ci` in `prototype/core-loop/`;
   - run schema synchronization;
   - run every committed `smoke` and `smoke:*` contract explicitly;
   - run the release-asset source verifier;
   - run TypeScript no-emit and the Vite production build;
   - run the dist verifier;
   - upload only `prototype/core-loop/dist/` as the Pages artifact.
2. **deploy**
   - `needs: build`;
   - targets the `github-pages` environment;
   - receives only `pages: write` and `id-token: write` in addition to the
     default read boundary;
   - deploys the uploaded artifact and exposes the resulting page URL.

The concurrency group is `pages`. A new manual release queues behind an
in-progress deployment instead of cancelling it halfway through.

Official Actions are pinned to immutable commit SHAs selected from the current
official Vite/GitHub examples at implementation time. Comments retain their
human-readable release tags.

The legacy core `npm run smoke` command is invoked through a small CI wrapper
that streams its complete output, propagates a nonzero child exit, and also
fails when any output line contains `FAIL`. Other smoke commands retain their
native nonzero-exit behavior.

### 4.5 Distribution boundary

GitHub Pages is the canonical host. This workflow does not call Higgsfield and
does not publish to its community feed.

Higgsfield remains a manual consumer of the same verified `dist/`. No second
Vite configuration or Pages-specific rebuild is introduced.

The current checkout has no Git remote and the authenticated GitHub connector
exposes no repository. Creating or making a repository public, configuring
Pages as the publishing source, and running the first external deployment are
separate external-state actions requiring explicit user authorization. The
workflow is not considered externally verified until that run succeeds.

## 5. Data flow

```text
Drive/source PNG
  -> explicit local promotion
  -> tracked runtime WebP
  -> source-stage release verification
  -> Vite build with relative base
  -> dist-stage release verification
  -> GitHub Pages artifact
  -> manual deploy-pages job

same verified dist
  -> separate manual Higgsfield deployment
```

No model API, Drive API, Python content pipeline, runtime LLM, or external
data-pack generation runs in the Pages workflow.

## 6. Error handling

- Missing source master during local promotion: fail and name the card ID;
  never generate a substitute.
- Missing promoted derivative: fail before building.
- Stale derivative: when local source masters are present, compare their
  SHA-256 values with `release/card-art-promotions.json`; in CI, compare each
  tracked derivative with its recorded output SHA-256. Fail with a command
  that regenerates only the affected IDs.
- Invalid audio manifest or missing audio file: reuse the existing audio
  verifier and fail before building.
- Root-absolute runtime URL: fail the focused regression test or dist verifier.
- Development asset in `dist/`: fail and report the first forbidden path.
- Smoke output containing `FAIL`: fail even if the legacy core smoke process
  exits zero.
- Pages deployment failure: preserve the successful build artifact for
  inspection; do not fall back to Higgsfield or publish a partial artifact.
- Missing remote or Pages setting: report the external prerequisite; do not
  create or expose a repository without approval.

## 7. Testing strategy

Implementation follows red-green-refactor.

1. Add a failing pure test for base-path joining and remote-URL preservation.
2. Add failing promotion/verifier tests using temporary fixture directories:
   missing master, missing derivative, disabled row, forbidden benchmark, and
   exact selected output paths.
3. Add a failing build-output assertion proving the current absolute asset
   paths are rejected.
4. Implement the smallest asset helper, promotion tool, and verifier changes
   needed to make those tests pass.
5. Generate the twenty approved clue derivatives and promote the three
   backgrounds into the tracked release boundary.
6. Run the complete current baseline:
   - `npm run schema:check`
   - `npm run smoke:validator-esm`
   - `npm run smoke`
   - `npm run smoke:datapack`
   - `npm run smoke:pack-storage`
   - `npm run smoke:run-flow`
   - `npm run smoke:run-session`
   - `npm run smoke:collection`
   - `npm run smoke:narrative`
   - `npm run smoke:audio`
   - `npm run smoke:case-generator-e2e`
   - `npm run typecheck`
   - `npm run build`
   - source and dist release verifiers
7. Preview the relative build under a non-root pathname and verify card,
   background, and audio network requests.
8. After repository authorization, run the workflow manually and repeat the
   browser asset/play check against the deployed URL.

The inspected pre-change baseline passed all commands in step 6 on
2026-07-30. That baseline is evidence for regression comparison, not evidence
that the new deployment path works.

## 8. Claude review gate

Because Codex progressed an open design ticket under direct user approval, the
ticket keeps an empty `Reviewed-by:` field until Claude performs the project
contract's four checks:

1. consistency with closed tickets 05, 08, and 13;
2. consistency with `CONTEXT.md` terminology;
3. existence of every cited asset, script, workflow, and reference;
4. independent rerun of the acceptance commands and deployed-path check.

Claude should pay particular attention to the narrow binary exception:
Drive retains source-master authority; Git tracks only selected distribution
derivatives required to reproduce the static application.

## 9. Out of scope

- automatic deployment on `main` push or tags;
- a custom domain;
- creating or publishing a GitHub repository without explicit authorization;
- Higgsfield `publish`;
- generating new clue, pattern, hint, background, or persona art;
- changing game rules, balance, content-pack loading, or collection behavior;
- resolving ticket 34's pattern/hint visual identity;
- performing ticket 35's full campaign launch playthrough.
