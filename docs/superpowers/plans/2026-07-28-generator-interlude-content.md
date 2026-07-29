# Case Generator E2E and Narrative Content Plan

> **For Codex:** Execute this plan in dependency order. Ticket 28 stays in
> `.worktrees/case-generator-shape`; ticket 29 lands in
> `.worktrees/data-contracts-extraction`. Do not merge or commit without separate
> user approval.

**Goal:** Prove one real source snapshot can produce a deterministic, validated
`GeneratedCase`, then define and validate deterministic interlude/BAD-ending
content that can replay in the ticket 22 runtime.

**Architecture:** Ticket 28 adds a build-time, three-role localhost model
pipeline around the existing pure candidate enumerator. The network boundary
ends at recorded transcripts; replay is the reproducibility boundary. Ticket 29
extends `game-data-pack@2` with strict narrative definitions and uses public-path
allowlists plus reachability checks instead of natural-language secret
heuristics.

**Tech Stack:** TypeScript, Node 24 `fetch`, existing esbuild scripts, Ajv
standalone pack validator, LM Studio OpenAI-compatible API, SHA-256 canonical
JSON.

---

## Task 1: Pin the real Project Gutenberg fixture

**Files:**

- Create:
  `.worktrees/case-generator-shape/prototype/core-loop/fixtures/case-generator/pg204-invisible-man.source.json`
- Create:
  `.worktrees/case-generator-shape/prototype/core-loop/scripts/build-pg204-fixture.mjs`
- Test:
  `.worktrees/case-generator-shape/prototype/core-loop/smoke-case-generator-e2e.ts`

1. Add a failing smoke test requiring `pg_id`, story anchors, full-source
   SHA-256, selected paragraphs, per-paragraph SHA-256, source revision and
   extraction date.
2. Implement the fixture builder against explicit `--source` and `--out`
   arguments; never persist the mutable absolute source path.
3. Select only paragraphs that establish honest watchers, footprints, “mentally
   invisible”, the letter carrier inference, and the postman reveal.
4. Verify every committed paragraph is byte-for-byte present in the source and
   every hash matches.

## Task 2: Approve evidence into a versioned recipe

**Files:**

- Create:
  `.worktrees/case-generator-shape/prototype/core-loop/fixtures/case-generator/pg204-invisible-man.contract.json`
- Modify:
  `.worktrees/case-generator-shape/prototype/core-loop/src/lib/case-generator-prototype.ts`
- Test:
  `.worktrees/case-generator-shape/prototype/core-loop/smoke-case-generator-e2e.ts`

1. Write a failing test for
   `sourceSnapshot → patternEvidence → approved patternRecipe`.
2. Validate evidence paragraph IDs against the pinned fixture; reject invented
   evidence IDs and unapproved recipes.
3. Encode the route/omission → identity → action/trace structure as semantic
   slots without story-specific card allowlists.
4. Assert deterministic candidate order and fingerprint for identical inputs.

## Task 3: Add three narrow model adapters

**Files:**

- Create:
  `.worktrees/case-generator-shape/prototype/core-loop/src/lib/case-generator-e2e.ts`
- Create:
  `.worktrees/case-generator-shape/prototype/core-loop/e2e-case-generator.ts`
- Modify:
  `.worktrees/case-generator-shape/prototype/core-loop/package.json`
- Test:
  `.worktrees/case-generator-shape/prototype/core-loop/smoke-case-generator-e2e.ts`

1. Add failing tests for selector, presenter and taste-filter JSON allowlists.
2. Selector input contains candidate summaries only and accepts only
   `candidateId + reason`.
3. Presenter input contains selected truth and `storySeed`; it accepts only
   `presentation` and may not change truth, IDs or provenance.
4. Taste filter input contains a completed-case summary and accepts only
   `keep|reject + tasteScore + reasons`.
5. Implement a shared localhost OpenAI-compatible adapter with fixed model,
   seed, temperature 0, prompt versions, timeout and raw transcript capture.
6. Support `--live` and `--replay <transcript>`; a failed live call must not
   alter an approved output.

## Task 4: Emit and validate `GeneratedCase`

**Files:**

- Create:
  `.worktrees/case-generator-shape/prototype/core-loop/artifacts/case-generator/`
- Modify:
  `.worktrees/case-generator-shape/prototype/core-loop/src/lib/case-generator-e2e.ts`
- Test:
  `.worktrees/case-generator-shape/prototype/core-loop/smoke-case-generator-e2e.ts`

1. Define a strict `GeneratedCase@1` envelope with source, recipe, model and
   validator provenance.
2. Canonicalize JSON as sorted keys, UTF-8, LF, finite numbers and a trailing
   newline; hash the normalized payload and provenance.
3. Validate truth contract, triple constraints, josa lint, conditional-solution
   lock-time stability, model allowlists and presentation references.
4. Emit a validator report with PASS/FAIL and exact paths.
5. Run one live call sequence, then replay the transcript twice into two
   directories and byte-compare the generated case, report, output hash and
   provenance hash.
6. Validate an alongside `game-data-pack@2` artifact with the ticket 16 loader
   in `.worktrees/data-contracts-extraction` without merging the worktrees.

## Task 5: Add interlude and ending schemas to pack v2

**Files:**

- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/schema/game-data-pack-v2.json`
- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/src/lib/datapack.ts`
- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/src/lib/engine.ts`
- Create:
  `.worktrees/data-contracts-extraction/prototype/core-loop/schema/fixtures/narrative/`
- Create:
  `.worktrees/data-contracts-extraction/prototype/core-loop/smoke-narrative-content.ts`
- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/package.json`

1. Add failing fixtures for valid interlude, valid press BAD ending, valid
   collapse BAD ending, secret truth path, unreachable trigger and missing
   warning.
2. Add optional top-level `interludes` and `endings`; close action kinds to
   `recon|interview|stabilize`.
3. Require item-level provenance while inheriting the pack provenance.
4. Add cross-field validation for public template paths, case/action/facet
   references, warning-before-trigger and failure-rule reachability.
5. Merge definitions by ID using the ticket 16 alongside/promotion policy.

## Task 6: Replay narrative definitions in the run

**Files:**

- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/src/lib/content.ts`
- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/src/lib/engine.ts`
- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/src/lib/ui/InterludeScreen.svelte`
- Modify:
  `.worktrees/data-contracts-extraction/prototype/core-loop/src/lib/ui/EndScreen.svelte`
- Test:
  `.worktrees/data-contracts-extraction/prototype/core-loop/smoke-narrative-content.ts`
- Test:
  `.worktrees/data-contracts-extraction/prototype/core-loop/smoke-run-flow.ts`

1. Drive the three ticket 22 actions from a selected `InterludeDefinition`
   without exposing undeclared truth.
2. Bind BAD endings to the engine’s reachable `press` and `collapse` failure
   rule IDs and require recorded warning beats.
3. Assert identical transcript replay bytes and identical reducer outcomes.
4. Run core, data-pack, storage, collection, session, TypeScript and Vite
   regressions.

## Task 7: Record evidence and integration boundary

**Files:**

- Modify:
  `.scratch/case-collection/issues/28-case-generator-e2e-datapack-prototype.md`
- Modify:
  `.scratch/case-collection/issues/29-interlude-bad-ending-content-contract.md`

1. Add `Assignee: Codex`, blank `Reviewed-by:`, `## Resolution`, exact commands,
   hashes and report paths.
2. Keep both tickets open pending Claude review.
3. State that `prototype/case-generator-shape` remains isolated and that commit,
   merge and push require separate user approval.
4. Run `git diff --check` and inspect both worktrees for unrelated changes.
