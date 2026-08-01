---
type: Source Map
title: Repository Source Map
description: Practical map from engineering questions to current source, canonical decisions, supporting evidence, scripts, and non-mainline work that must not be mistaken for shipped behavior.
tags: [source-map, navigation, repository, authority]
---

# Repository source map

## Read in this order

1. `/openwiki/quickstart.md` for scope and current caveats.
2. `/CONTEXT.md` for canonical game vocabulary.
3. `/.scratch/case-collection/MAP.md` to locate topics, then the complete ticket resolution for authority.
4. Current imports and source files to confirm what is actually wired.
5. `/docs/research` or `/docs/superpowers` for supporting rationale and plans.
6. Git history for why a current rule exists and whether a description was superseded.

This order prevents three common errors: treating the map as authority, treating a plan as implementation, or treating an isolated worktree result as mainline capability. Repository process is expanded in the [operations runbook](operations/runbook.md).

## Runtime and application surface

| Question | Start here | Continue with |
|---|---|---|
| How does the app start and hold state? | `/prototype/core-loop/src/main.ts`, `src/App.svelte` | [Architecture overview](architecture/overview.md) |
| What actions and state exist? | `src/lib/engine.ts` | `smoke.ts`, [game model](domain/game-model.md) |
| Which interpretations are usable? | `src/lib/facets.ts` | ticket 12, ticket 17 |
| What content runs today? | `src/lib/content.ts` | ticket 08, `smoke.ts` |
| How are wrong answers voiced? | `src/lib/dramaturgy.ts`, `persona.ts` | ticket 03 |
| How are Korean particles handled? | `src/lib/josa.ts`, `CaseScreen.svelte` | ticket 19, pack validator |
| Which screen renders a feature? | `src/lib/ui/*.svelte` | `src/app.css`, ticket 24/31 |
| What visual assets are attempted? | `CardChip.svelte`, `StageBackground.svelte` | `/docs/art/README.md`, root scripts |

The [architecture page](architecture/overview.md) describes dependencies among these files rather than only listing them.

## Domain and decision anchors

| Area | Canonical evidence | Notes |
|---|---|---|
| Core loop | ticket `03-core-loop.md` | Integrated deduction, collection, dramaturgy and run decision |
| MVP scope | ticket `08-mvp-scope.md` | Detailed `## Comments` explicitly canonical; 24 cards/four cases |
| Facet/context semantics | tickets `12-context-tag-semantics.md`, `17-context-semantics-prototype.md` | Paper decision plus execution validation |
| Korean-particle neutrality | ticket `19-josa-leak-neutralization.md` | Content marker plus runtime calculation |
| Play-screen hierarchy | tickets `20-play-screen-hierarchy.md`, `24-play-screen-build.md` | Design plus browser-validated implementation and layout lessons |
| Note comparison affordance | ticket `31-pickup-affordance.md` | Judged reading plus usable plus role fit, never answer reveal |
| Case generator shape | ticket `18-case-generator-shape.md` | Accepted contract; implementation evidence remains isolated |
| Product terminology | `/CONTEXT.md` | Prefer current terms such as facet and commitment |

See [game model](domain/game-model.md) for the synthesized rules and [testing guidance](testing/guidance.md) for how those decisions become checks.

## Content/data contracts

| Asset | Status | Purpose |
|---|---|---|
| `/prototype/core-loop/src/lib/content.ts` | Live | Hard-coded official prototype run |
| `/prototype/core-loop/src/lib/datapack.ts` | Implemented, developer-facing | v2 shape validation, ordered merge, provenance and integrity |
| `/prototype/core-loop/schema/game-data-pack-v2.json` | Implemented | v2 structural schema; TypeScript owns cross-field checks |
| `/prototype/core-loop/smoke-datapack.ts` | Implemented | Contract regression suite |
| `/scripts/extract_game_data_pack.py` | Implemented | OUT extraction package with facet, taste-filter, and case-assembly stages |
| `/prototype/core-loop/smoke-case-generator-e2e.ts`, fixtures | Implemented | Self-contained Project Gutenberg 204 deterministic-generation smoke |
| ticket 18 and ticket 28 | Closed decisions | Deterministic truth/provenance pipeline and its integrated E2E evidence |

The relationship and flow are documented in [play and content workflows](workflows/play-and-content.md).

## Operations and integration surface

| Area | Source | Boundary |
|---|---|---|
| Local and release commands | `/prototype/core-loop/package.json` | Vite, focused Node release-tool tests, individual smoke checks, strict `smoke:ci`, and source/dist/workflow release verification |
| Tracker workflow | `/docs/agents/issue-tracker.md` | Map indexes decisions; ticket resolutions own them |
| Agent collaboration | `/docs/agents/codex-collab.md` | Bounded writes and independent verification |
| Card-art rules | `/docs/art/README.md`, style key | Style key committed; final card images outside Git |
| Art batch/manifest | `/scripts/cardart-batch.mjs`, `check-cardart-manifest.mjs`, manifest JSONL | Higgsfield generation tooling and ID parity |
| Drive synchronization | `/scripts/sync-cardart.cmd` | Explicit, non-deleting final-asset transfer |
| GitHub Pages delivery | `.github/workflows/deploy-pages.yml`, ticket 33 | Manual release-gated Actions deployment of `prototype/core-loop/dist`; Higgsfield remains parallel and manual |
| External knowledge | `/CLAUDE.md`, extraction script | OUT is read-only source evidence, not game decision authority |

These operations are collected into the [runbook](operations/runbook.md).

## Tests and checks

- `/prototype/core-loop/smoke.ts`: game progression, solvability, coherence, failure reachability, propagation, undo and Korean authoring checks. Inspect printed `FAIL` lines.
- `/prototype/core-loop/smoke-datapack.ts`: pack shape, merge, provenance, integrity and schema-enum synchronization; exits nonzero on failures.
- `/prototype/core-loop/scripts/run-core-smoke-ci.mjs`: runs 11 smoke scripts and treats printed `FAIL` as fatal for CI.
- `/prototype/core-loop/scripts/verify-release.mjs`: validates public-source and built-dist release closure, asset paths, containment, and size.
- `/prototype/core-loop/scripts/verify-pages-workflow.mjs`: verifies the Pages workflow's strict gate and deployment shape.
- `/prototype/core-loop/scripts/*.test.mjs`: focused Node tests, including the release and workflow verifiers.
- `npm run typecheck`: TypeScript no-emit check.
- `npm run build`: Vite production compile.
- Browser play checks: required for Svelte semantics and spatial behavior.

Use [testing guidance](testing/guidance.md) to select the complete gate for a change.

## Git history: high-signal evolution

Recent history explains several non-obvious rules:

- Ticket 24 implementation and fixes established the vertical play hierarchy, state-owned backgrounds, structural CSS anchoring, and the need for browser review beyond machine checks.
- Ticket 31 added note comparison after play revealed repeated dead clicks; it intentionally uses judgment history without exposing correctness.
- Ticket 18 turned generation into deterministic legal-candidate enumeration with LLMs restricted to selection, presentation and taste.
- The OpenWiki candidate pilot was rejected as runtime/core dependency because its prompt/context path was too costly, while provenance prompting and strict validation ideas were retained.
- Ticket 33 established the manually dispatched GitHub Pages release workflow; inspect its closed resolution and workflow verifier before changing deployment gates.

Use `git log -- <path>`, targeted `git show <commit> -- <path>`, and selective blame when the current code’s reason is unclear. Avoid persistent hash inventories unless a branch-only result must be located.

## Files and evidence not to over-trust

- Root `/CLAUDE.md` is useful operational context but currently has uncommitted changes and can contain stale narrative; check source and tickets.
- `/prototype/core-loop/README.md` includes earlier UI and prototype descriptions. Current imports show that visible lock-mode controls and ScenarioBoard are gone.
- `/docs/superpowers/plans/*` are plans, and some are untracked or use superseded technology/model language.
- `.worktrees/*` can contain substantial implementation, but mainline capability requires reviewed, committed integration.
- Generated `/prototype/core-loop/dist`, `.vite`, `node_modules`, `smoke.mjs`, and `smoke-datapack.mjs` are not source.
- `/.github`, `/AGENTS.md`, and `/openwiki` were untracked at initialization; do not cite them as long-standing committed product behavior.

## Change navigation

- **Reducer/game rule:** [game model](domain/game-model.md) → governing ticket → `engine.ts`/`facets.ts` → both smoke suites.
- **Case/card content:** [play/content workflow](workflows/play-and-content.md) → `content.ts` and pack contracts → smoke plus render particle check.
- **UI/layout:** [architecture](architecture/overview.md) → ticket 24/31 → component/CSS → browser checklist.
- **Art:** [operations runbook](operations/runbook.md) → art README/manifest/scripts → focused Node tests and dry run.
- **Generation/external packs:** [play/content workflow](workflows/play-and-content.md) → tickets 14/16/18/28 → confirm current source wiring and developer-facing versus ordinary-startup boundary before coding.
