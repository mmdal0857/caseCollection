---
type: Operations Runbook
title: Repository Operations Runbook
description: Safe commands and operational conventions for local development, decision tracking, art generation, external source extraction, distribution, and isolated worktrees.
tags: [operations, runbook, git, art, governance]
---

# Repository operations runbook

## Local development

Run the application from `prototype/core-loop`:

```bash
npm install
npm run dev
npm run build
npm run preview
```

The project is a static Vite application. There is no server process beyond Vite’s development/preview server and no runtime credential requirement. The [architecture overview](../architecture/overview.md) explains the in-memory runtime.

Svelte-specific hazards recorded by the project:

- Snapshot `$state` before sending it to code that uses `structuredClone`.
- Use `$derived` for reactive computations rather than capturing props unintentionally.
- Keep Korean names and particles in one inline layout unit; flex `gap` can create grammatically wrong whitespace.
- Leading whitespace in inline Svelte markup may be removed; use CSS for deliberate spacing.
- If `.svelte` HMR appears stale, perform a full browser refresh before diagnosing the code.

## Standard verification

From `prototype/core-loop`:

```bash
npm run smoke
npm run smoke:datapack
npx tsc --noEmit
npm run build
```

Always inspect core smoke output for `FAIL`; a zero exit is not sufficient. UI changes require browser interaction and layout checks. Use the change matrix in [testing guidance](../testing/guidance.md).

## Working-tree discipline

The repository commonly has concurrent and isolated work. Before editing or integrating:

```bash
git status --short
git diff -- <scoped-paths>
git log --max-count=12 --oneline
```

Do not stage, reset, stash, delete, or commit unrelated dirty files. At this documentation run, main had pre-existing modifications/untracked setup files. The latest repository decision also keeps the case-generator and OpenWiki pilot worktrees isolated. Isolation is **deferred integration**, not rejection, and their checks are not reproducible from main.

A dirty data-contracts worktree contains broader pack/storage/narrative/audio experiments. Worktree-local ticket resolutions that remain open, unreviewed, or uncommitted are evidence only. The [source map](../source-map.md) distinguishes authority levels.

## Decision and ticket workflow

Wayfinder state lives in `/.scratch/case-collection`:

1. Read `MAP.md` to locate a domain and candidate ticket.
2. Read the entire ticket; the map is an index, not authority.
3. Claim an open ticket in its `Assignee:` line before work.
4. Respect `Blocked-by:` and distinguish `open`, `closed`, and `deferred`.
5. On close, write `## Resolution`, set closed status, update the map, update `/CONTEXT.md` for vocabulary, propagate consequences, graduate newly clear fog into tickets, and commit only scoped files.
6. Preserve rejected (`기각`) and deferred (`유예`) alternatives in the map so they are not reopened as missing work.

The 10000-number band is a separate deferred queue with a required trigger condition. `/docs/agents/issue-tracker.md` is the full operational reference.

### Agent collaboration

`/docs/agents/codex-collab.md` separates decision authority, bounded execution authority, and evidence authority. Write-enabled delegation requires an approved/closed decision or an explicit user specification, exact write scope, and independent verification. A Claude-limit exception can produce provisional Codex design, but it requires the `Reviewed-by:` review gate before becoming dependable downstream authority.

For pure-module refactors, preserve behavior and rerun both smoke suites plus TypeScript. For UI changes, independent browser review is mandatory because repository history contains semantic and layout defects that passed machine gates.

## Card-art pipeline

The art rule is “generate nouns, compute adjectives”: one neutral object image per clue, with five facet-tag visual treatments computed in CSS. `/docs/art/style-key.png` is a committed input because stochastic generation cannot reproduce it from text alone. Source PNGs, comparison outputs, and generation logs are working artifacts under `prototype/core-loop/.art-source/cardart`; committed WebP derivatives are a separate GitHub Pages release boundary.

Validate and plan before generation:

```bash
node scripts/check-cardart-manifest.mjs
node scripts/cardart-batch.mjs --dry-run
```

Generate enabled clues or selected IDs:

```bash
node scripts/cardart-batch.mjs
node scripts/cardart-batch.mjs --force <card-id>
bash scripts/cardart-generate.sh <card-id> "<object description>" single
```

Operational constraints:

- `scripts/cardart-manifest.jsonl` is the generation inventory and must match `content.ts` IDs.
- Enabled clue rows generate by default; disabled adjunct rows do not.
- `cardart-generate.sh` must fail if the style key is absent.
- The current production choice documented by source is Higgsfield `gpt_image_2`, low, 3:4, 1k. Older plans naming `nano_banana_pro` are historical.
- The batch script locates Higgsfield through `HIGGSFIELD_BIN` or the APPDATA npm shim. Do not expose credential values.
- Generation writes source PNGs and its log under `prototype/core-loop/.art-source/cardart`; comparison outputs belong in its `benchmark/` subdirectory. These are ignored working artifacts, not release files.

### Promote release art

After source PNGs are approved, create the deterministic delivery derivatives from `prototype/core-loop`:

```bash
npm run art:promote
npm run test:release-tools
npm run smoke:public-assets
npm run build
```

`art:promote` reads enabled IDs from `/scripts/cardart-manifest.jsonl`, converts `.art-source/cardart/<id>.png` to tracked `public/assets/cards/<id>.webp`, and atomically records source/output SHA-256 values in `release/card-art-promotions.json`. It uses Sharp to normalize delivery output to 440×584 WebP with the source image centered, cover-fitted, and not enlarged. The committed `public/assets/backgrounds/*.webp` files are likewise release assets. Do not document or create a `public/cardart` output directory: current source consumes the `public/assets` paths.

The tracked derivatives let the static [runtime architecture](../architecture/overview.md) deploy card art with the application, while the Drive-synchronized source art remains outside Git. Use the release-tool test and public-asset smoke check after changing the promotion script, manifest, source images, or runtime asset paths; the broader verification matrix is in [testing guidance](../testing/guidance.md).

### Google Drive boundary

Source clue PNGs are synchronized explicitly with the canonical Drive folder described in `/docs/art/README.md`; promote approved local sources before relying on the tracked WebP delivery derivatives:

```bat
scripts\sync-cardart.cmd pull "<Drive cardart clues folder>"
scripts\sync-cardart.cmd push "<Drive cardart clues folder>"
```

Neither direction deletes destination-only files. Do not synchronize the whole repository, rely on junctions/symlinks, or attempt to bypass the documented Google connector verification failure. The Drive letter is machine-specific and must be supplied, not hard-coded.

The art pipeline supplies assets consumed by the [runtime architecture](../architecture/overview.md) and must preserve IDs governed by the [game model](../domain/game-model.md).

## OUT extraction skeleton

The script reads an external OUT repository and only runs at build time:

```bash
py scripts/extract_game_data_pack.py --out-root <OUT-root>
py scripts/extract_game_data_pack.py --out-root <OUT-root> --emit-draft
```

The first command inventories source and candidates. `--emit-draft` emits placeholder facets and no assembled cases; it is not a production generation run. If the Windows `py <script>` launcher resolves incorrectly, invoke a known Python executable directly. The script forces UTF-8 output to avoid cp949 crashes.

Do not modify the OUT wiki from caseCollection changes. It is source evidence, while this repository’s tickets and `/CONTEXT.md` own game decisions and vocabulary. The complete boundary is in [play and content workflows](../workflows/play-and-content.md).

## Distribution state

Decided channel policy:

- **GitHub Pages:** canonical host.
- **Higgsfield marketplace:** parallel distribution, not canonical due to platform terms.
- **itch.io and Patreon:** rejected for current policy.
- **Steam:** possible later paid channel, undecided.
- **Higgsfield/Stripe direct storefront:** deferred backlog.

A Vite production build exists. Do not claim that application deployment is automated merely because channel policy or untracked workflow files exist; verify committed `.github/workflows` state and the relevant deployment ticket first.

## Incident-oriented checks

| Symptom | First checks |
|---|---|
| All dispatches appear frozen | Confirm `App.svelte` snapshots `$state` before reducer cloning |
| New Svelte markup does not appear | Full refresh before further diagnosis |
| Korean particle spacing is wrong | Keep name plus particle in one inline unit; inspect flex gaps and stripped leading space |
| Card art generation drifts | Confirm committed style key exists and is passed as image reference |
| Hand/background layout overlaps | Check grid rows and viewport height; replace guessed offsets with structural anchors/shared variables |
| Pack validation passes Schema but load fails | Inspect TypeScript cross-field and post-merge integrity issues |
| Feature exists only in docs | Check current imports, ticket status, branch/worktree and commit state through the [source map](../source-map.md) |
