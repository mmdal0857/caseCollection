---
type: Repository Guide
title: caseCollection Quickstart
description: Entry point for engineers working on the caseCollection Svelte deduction-game prototype, its decision system, content pipelines, and operational constraints.
tags: [quickstart, svelte, game, repository]
---

# caseCollection quickstart

## What this repository is

caseCollection is a Korean-first web card-collection and deduction game derived from public-domain detective-fiction knowledge in the separate OUT project. The playable code in this repository is a static **Svelte 5 + Vite + TypeScript** application under `/prototype/core-loop`; it has no backend, runtime LLM, account system, or router. Its distinctive mechanic is that a clue card has multiple **facets**: placing one interpretation commits it, changes world-state tracks, and constrains later interpretations.

The current MVP scope is one run of four authored cases using 20 clue cards and four pattern cards. That is an intentional foundation build, not a replayability or production-scale generation claim. See the [game model](domain/game-model.md) for the vocabulary and fixed scope.

## Start here

| Need | Read |
|---|---|
| Understand runtime components and state flow | [Architecture overview](architecture/overview.md) |
| Learn cards, facets, tracks, cases, and runs | [Game model](domain/game-model.md) |
| Follow a playthrough or the intended content build chain | [Play and content workflows](workflows/play-and-content.md) |
| Run the app, art tools, or repository process safely | [Operations runbook](operations/runbook.md) |
| Choose and interpret verification gates | [Testing guidance](testing/guidance.md) |
| Find canonical source and decision evidence | [Source map](source-map.md) |

These concepts are connected rather than separate inventories: the [architecture](architecture/overview.md) executes the rules in the [game model](domain/game-model.md), the [workflows](workflows/play-and-content.md) move both player and content through those rules, and the [testing guidance](testing/guidance.md) protects the resulting contracts.

## Run locally

From `prototype/core-loop`:

```bash
npm install
npm run dev
```

Before handing off a change, normally run:

```bash
npm run smoke
npm run smoke:datapack
npm run typecheck
npm run build
```

`npm run smoke` requires reading its output for `FAIL`; unlike the data-pack smoke suite, its logical checks do not reliably force a nonzero exit. The release path instead uses `npm run smoke:ci`, which makes any printed `FAIL` fatal across its full smoke suite. UI work also requires browser play checks. Details and change-specific gates are in [testing guidance](testing/guidance.md).

## Authority model

Do not infer a project decision from the newest-looking document.

1. A closed `/.scratch/case-collection/issues/*.md` ticket’s `## Resolution` is decision authority; ticket 08 explicitly makes its detailed `## Comments` canonical and its resolution an index.
2. `/CONTEXT.md` is authoritative terminology.
3. `/.scratch/case-collection/MAP.md` is a wayfinding index, not a substitute for ticket text. Its rejection and deferral annotations matter.
4. `/docs/research` and `/docs/superpowers` provide evidence or plans, not automatic authority.
5. Current source determines what is actually wired. In particular, `/prototype/core-loop/src/App.svelte` imports hard-coded `CONTENT`; the external data-pack loader is not the app bootstrap.

The repository governance and dirty-worktree precautions are summarized in the [operations runbook](operations/runbook.md), while the [source map](source-map.md) tells future agents where to verify each claim.

## Current-state cautions

- Main has pre-existing uncommitted and untracked files, including the OpenWiki setup. Inspect `git status` and do not absorb unrelated changes.
- The case-generator E2E smoke is now mainline and self-contained through its committed Project Gutenberg 204 source fixture. The OpenWiki candidate pilot remains isolated and rejected as a runtime/core dependency.
- Open tickets and unreviewed worktree-local resolutions do not extend mainline behavior beyond the current source.
- The implemented v2 data-pack validator, persistence, narrative, and audio seams are real, but the live UI still bypasses external pack loading. `scenario.ts` and alternative lock modes also exist without current UI entry points.
- GitHub Pages is the canonical host. Its committed `workflow_dispatch` pipeline publishes only a release-gated `prototype/core-loop/dist`; Higgsfield remains a separate manual distribution process. The command sequence and release boundaries are in the [operations runbook](operations/runbook.md).

## Practical first moves

- **Game-rule change:** start with [game model](domain/game-model.md), then inspect the governing ticket and pure module before touching UI.
- **UI change:** read [architecture](architecture/overview.md), ticket 24’s layout lessons, and [testing guidance](testing/guidance.md). Avoid positioning one element with guessed constants derived from another element’s height.
- **Content/data change:** start with [play and content workflows](workflows/play-and-content.md); preserve facet keys, Korean-particle markers, and post-merge references.
- **Art/tooling change:** use the [operations runbook](operations/runbook.md); the committed style key and release WebP derivatives are tracked, while generated PNG sources stay in `.art-source/cardart` and Drive sync is explicit.
- **Decision work:** read the full ticket, not only `MAP.md`, and follow the close-time housekeeping sequence.

## Backlog

- **Mainline production architecture** — source anchor: ticket 08 and `/prototype/core-loop`; deferred because the repository still labels the runtime as a prototype and the production promotion/rewrite is incomplete.
- **External data-pack startup** — source anchor: `/prototype/core-loop/src/App.svelte` and `src/lib/datapack.ts`; deferred because v2 packs are validated and persistable only through the developer-facing pack view, while ordinary play still initializes authored `CONTENT`.
