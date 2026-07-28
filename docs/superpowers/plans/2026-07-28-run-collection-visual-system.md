# Run, Collection, and Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement tickets 22, 21, and 23 as one verified browser flow: explicit review and clear beats, resumable run snapshots, two-choice interludes, persistent collection/notebook surfaces, and a flat-cell-noir visual system.

**Architecture:** Keep `engine.ts` as the pure game reducer, add `run-session.ts` as the only browser persistence boundary, and add `collection.ts` as the pure permanent-progression model. `App.svelte` owns Home/Run/Collection navigation and delegates run screens to focused Svelte components. CSS tokens carry semantic tag state; suit identity is rendered by icon, label, and border pattern.

**Tech Stack:** TypeScript, Svelte 5, localStorage, esbuild smoke tests, Vite, browser DOM/accessibility inspection.

## Global Constraints

- The approved screen graph is Home → Briefing → Case Compose → Case Review → Clear Feedback → Interlude → next Briefing/Boss → Ending → Run Summary → Home.
- `Case: Review` is a state of `CaseScreen`, not a separate route; review may return to compose or proceed to final submission.
- Interlude AP is a scene-local budget of 2; exactly three `recon | interview | stabilize` actions are offered and exactly two may be chosen.
- Case clear permanently owns guest cards; BAD endings preserve permanent collection state.
- `RunSnapshot@1` is validated before restore; corrupt/future raw data remains available for diagnosis and never silently starts.
- Collection progress is dynamic: owned/current-pack cards, known/owned-card facets, and known/current-pack facets.
- Unknown facet count is visible while meaning remains hidden; rejected interpretations dedupe by `caseId + slotId + cardId + facetKey`.
- Tags own semantic color. Suits use icon, label, and border pattern, including without color.
- No gradients, glass effects, glossy buttons, runtime LLM, server persistence, shop, pack reward, or rollback UI.
- Do not commit, merge, push, close tickets, or edit `Reviewed-by:` without separate authorization/review.

---

### Task 1: Explicit Run Beats and Reducer Contract

**Files:**
- Create: `prototype/core-loop/smoke-run-flow.ts`
- Modify: `prototype/core-loop/src/lib/engine.ts`
- Modify: `prototype/core-loop/src/lib/content.ts`
- Modify: `prototype/core-loop/package.json`

**Interfaces:**
- Produces: `CasePhase = 'compose' | 'review'`
- Produces: `ReviewResult { kind: 'sound' | 'incomplete' | 'countered'; weakSlotId: string | null; total: number; outOf: number }`
- Produces actions: `REQUEST_REVIEW`, `RETURN_TO_COMPOSE`, `FINAL_SUBMIT`, `INTERLUDE_ACTION { kind }`
- Produces: `INTERLUDE_AP_BUDGET = 2` and `InterludeActionKind = 'recon' | 'interview' | 'stabilize'`

- [ ] **Step 1: Write failing reducer smoke**

```ts
const started = reduce(initGame(CONTENT), { type: 'START' }, CONTENT);
assert(started.casePhase === 'compose', 'case starts in compose');
const reviewed = reduce(fillCorrect(started), { type: 'REQUEST_REVIEW' }, CONTENT);
assert(reviewed.casePhase === 'review' && reviewed.review?.kind === 'sound', 'review is explicit');
const revised = reduce(reviewed, { type: 'RETURN_TO_COMPOSE' }, CONTENT);
assert(revised.casePhase === 'compose' && revised.submits === 0, 'review can revise without submit');
const cleared = reduce(reviewed, { type: 'FINAL_SUBMIT' }, CONTENT);
assert(cleared.screen === 'clear' && cleared.submits === 1, 'final submit enters clear feedback');
```

Add assertions that interlude starts with AP 2, refuses a third action, never carries AP forward, `interview` lends only a declared next-case guest facet, and BAD ending cannot trigger without a recorded warning.

- [ ] **Step 2: Run the smoke and verify RED**

Run: `npm run smoke:run-flow`

Expected: compile failure because `casePhase`, `REQUEST_REVIEW`, and `FINAL_SUBMIT` do not exist.

- [ ] **Step 3: Implement the reducer states**

Replace the direct `SUBMIT` UI contract with review followed by final submit. A review computes a non-mutating preview:

```ts
export interface ReviewResult {
  kind: 'sound' | 'incomplete' | 'countered';
  weakSlotId: string | null;
  total: number;
  outOf: number;
}
```

`FINAL_SUBMIT` is ignored unless `casePhase === 'review'`. A clear result sets `screen = 'clear'`; `ADVANCE` leaves clear feedback and enters the interlude or final ending. Remove reachable reward-pack flow.

- [ ] **Step 4: Implement the three-action interlude**

Set `interludeAP` to 2 and expose exactly one action of each kind. `recon` reads only next-case title/context/slot-frame public fields, `interview` borrows one facet from the next case guest allowlist, and `stabilize` moves heat down or trust up by one. Store chosen kinds so repeats and a third choice are rejected.

- [ ] **Step 5: Run reducer and existing core smokes**

Run: `npm run smoke:run-flow`

Expected: every run-flow assertion prints PASS.

Run: `npm run smoke`

Expected: existing core smoke prints PASS after using request-review/final-submit.

---

### Task 2: Validated RunSnapshot and Home/Continue Graph

**Files:**
- Create: `prototype/core-loop/src/lib/run-session.ts`
- Create: `prototype/core-loop/smoke-run-session.ts`
- Create: `prototype/core-loop/src/lib/ui/HomeScreen.svelte`
- Create: `prototype/core-loop/src/lib/ui/ClearFeedbackScreen.svelte`
- Create: `prototype/core-loop/src/lib/ui/RunSummaryScreen.svelte`
- Modify: `prototype/core-loop/src/App.svelte`
- Modify: `prototype/core-loop/package.json`

**Interfaces:**
- Produces: `RUN_SNAPSHOT_KEY = 'case-collection.run-snapshot.v1'`
- Produces: `RunSnapshotV1 { format: 'case-collection-run'; version: 1; savedAt: string; actionSeq: number; game: GameState }`
- Produces: `loadRunSnapshot(storage): SnapshotLoadResult`
- Produces: `saveRunSnapshot(storage, game, now): RunSnapshotV1`

- [ ] **Step 1: Write failing snapshot smoke**

```ts
const saved = saveRunSnapshot(memoryStorage(), game, () => '2026-07-28T00:00:00.000Z');
assert(loadRunSnapshot(store).snapshot?.actionSeq === game.seq, 'round trip');
store.setItem(RUN_SNAPSHOT_KEY, '{"version":2}');
assert(loadRunSnapshot(store).issue?.code === 'FUTURE_VERSION', 'future version isolated');
store.setItem(RUN_SNAPSHOT_KEY, '{broken');
assert(loadRunSnapshot(store).raw === '{broken', 'corrupt raw preserved');
```

Also save after a locked placement, review entry, final submit, interlude action, and screen transition; reload and assert the action effect appears exactly once.

- [ ] **Step 2: Run the smoke and verify RED**

Run: `npm run smoke:run-session`

Expected: module-not-found for `run-session.ts`.

- [ ] **Step 3: Implement strict load/save**

Parse the envelope, reject non-object data, exact format/version mismatch, missing `GameState` essentials, and `actionSeq !== game.seq`. Do not remove or rewrite invalid raw data. Serialize to a new string before the single `setItem` call.

- [ ] **Step 4: Wire Home, Continue, and atomic persistence**

Home shows “새 수사” as primary, “이어하기” only for a valid snapshot, and “컬렉션” as secondary. New run requests confirmation if any snapshot raw exists. Dispatch saves after every accepted reducer action; compare `next.seq` and state before saving so ignored actions do not create checkpoints.

- [ ] **Step 5: Add clear and summary screens**

Clear feedback owns the case result and `ADVANCE`. Ending proceeds to Run Summary, which reports cases cleared and collection changes before returning Home. No checkpoint rollback control is rendered.

- [ ] **Step 6: Run snapshot smoke and TypeScript**

Run: `npm run smoke:run-session`

Expected: all snapshot/duplicate-effect assertions PASS.

Run: `npx tsc --noEmit`

Expected: zero TypeScript errors.

---

### Task 3: Permanent Collection and Two Note Surfaces

**Files:**
- Create: `prototype/core-loop/src/lib/collection.ts`
- Create: `prototype/core-loop/smoke-collection.ts`
- Create: `prototype/core-loop/src/lib/ui/CollectionScreen.svelte`
- Create: `prototype/core-loop/src/lib/ui/CaseNotebookDrawer.svelte`
- Modify: `prototype/core-loop/src/lib/ui/CaseScreen.svelte`
- Modify: `prototype/core-loop/src/App.svelte`
- Modify: `prototype/core-loop/package.json`

**Interfaces:**
- Produces: `CollectionStateV1 { format: 'case-collection'; version: 1; ownedCardIds: string[]; knownFacetKeys: string[]; rejectedInterpretations: RejectedInterpretation[] }`
- Produces: `mergeGameProgress(collection, before, after, content, now): CollectionStateV1`
- Produces: `collectionProgress(collection, content): CollectionProgress`
- Produces: `RejectedInterpretation` with the exact dedupe key `caseId + slotId + cardId + facetKey`

- [ ] **Step 1: Write failing collection smoke**

```ts
const progress = collectionProgress(collection, CONTENT);
assert(progress.ownedCards.total === Object.keys(CONTENT.clues).length, 'pack dynamic');
assert(progress.knownOwnedFacets.value <= progress.knownAllFacets.value, 'three-axis denominator');
const twice = recordRejected(recordRejected(collection, item), item);
assert(twice.rejectedInterpretations.length === 1, 'rejection dedupe');
```

Assert guest ownership persists after clear, BAD-ending game merge never deletes ownership, unknown facet slot count is returned without its meaning, and run-only borrowed facets never enter permanent known facets.

- [ ] **Step 2: Run the smoke and verify RED**

Run: `npm run smoke:collection`

Expected: module-not-found for `collection.ts`.

- [ ] **Step 3: Implement pure collection progression**

Use pack content as the only denominator. Normalize all ID arrays to sorted unique values. Convert a wrong `SlotReaction` plus its placement into one immutable rejected interpretation using the injected clock for `firstSeenAt`.

- [ ] **Step 4: Build the full collection screen**

Render three numeric progress axes, four suit stacks, owned/unowned filter, and a separate pattern stack. An unowned card renders silhouette/suit only. An owned card detail renders known meanings and one labelled empty slot per unknown facet; it never includes unknown meaning text.

- [ ] **Step 5: Build the case notebook drawer**

Render only owned, borrowed, and currently usable cards plus known facets and deduped rejected interpretations. Use a labelled dialog/drawer, 44px controls, Escape/close support, and restore focus to its opener.

- [ ] **Step 6: Run collection smoke and accessibility-oriented build**

Run: `npm run smoke:collection`

Expected: all progression, secrecy, and dedupe assertions PASS.

Run: `npx tsc --noEmit`

Expected: zero TypeScript errors.

---

### Task 4: Flat-Cell-Noir Tokens, Suit Patterns, and Motion

**Files:**
- Modify: `prototype/core-loop/src/app.css`
- Modify: `prototype/core-loop/src/lib/ui/CardChip.svelte`
- Modify: `prototype/core-loop/src/lib/ui/HandRail.svelte`
- Modify: `prototype/core-loop/src/lib/ui/Meters.svelte`
- Modify: `prototype/core-loop/src/lib/ui/CaseScreen.svelte`
- Test: `prototype/core-loop/scripts/smoke-visual-contract.mjs`
- Modify: `prototype/core-loop/package.json`

**Interfaces:**
- Produces CSS tokens: `--space-1` through `--space-8`, `--tag-public`, `--tag-secret`, `--tag-force`, `--tag-care`, `--tag-logic`
- Produces suit markers through text/icon/pattern, not semantic fill color.
- Produces motion classes for pick/place, facet lock, propagation, chain release, and danger elevation only.

- [ ] **Step 1: Write failing static visual-contract smoke**

The script reads `app.css` and fails when it finds `linear-gradient`, `radial-gradient`, `backdrop-filter`, infinite animation, a missing `prefers-reduced-motion` block, or missing 44px interactive minimum.

- [ ] **Step 2: Run the smoke and verify RED**

Run: `npm run smoke:visual`

Expected: FAIL on current gradient and backdrop declarations.

- [ ] **Step 3: Replace chrome and color roles**

Use flat near-black panels, one ink border, no blur/gradient/gloss, 4px spacing tokens, and gold only for focus/confirmation/primary action. Tag state uses the five tag tokens. Suit classes render icon, Korean label, and distinct solid/dashed/double/dotted border patterns.

- [ ] **Step 4: Constrain meaningful motion**

Keep 120–220ms pick/place/lock transitions and 60ms propagation staggering. Remove continuously animated hover/background/panel decoration. In `prefers-reduced-motion: reduce`, remove transform/position movement and animation delay while retaining immediate opacity/state changes.

- [ ] **Step 5: Protect Korean inline composition and responsive actions**

Keep card name and resolved `이/가` style marker in one inline container with no flex gap or leading-space dependency. Preserve the 45% deduction area at 1280×720 and 1024×768; at narrow width collapse hand/notebook into drawers without hiding primary actions.

- [ ] **Step 6: Run visual smoke, full build, and browser QA**

Run: `npm run smoke:visual`

Expected: PASS.

Run: `npm run build`

Expected: Vite production build succeeds.

Browser evidence: inspect 1280×720, 1024×768, and narrow touch width; verify Home → review → clear → interlude → continue, collection and notebook keyboard focus, refresh restore, and reduced-motion state equivalence.

---

### Task 5: Regression, Ticket Evidence, and Review Gate

**Files:**
- Modify: `.scratch/case-collection/issues/22-run-beats-and-screen-graph.md`
- Modify: `.scratch/case-collection/issues/21-collection-and-notes-screen.md`
- Modify: `.scratch/case-collection/issues/23-interface-visual-system.md`
- Modify only if vocabulary changed: `CONTEXT.md`

**Interfaces:**
- Produces: one `## Resolution` and one `## Claude 검토` section per ticket.

- [ ] **Step 1: Run every wave smoke**

Run: `npm run smoke:run-flow`

Run: `npm run smoke:run-session`

Run: `npm run smoke:collection`

Run: `npm run smoke:visual`

Run: `npm run smoke`

Run: `npm run smoke:datapack`

Run: `npm run smoke:pack-storage`

Expected: every command exits 0.

- [ ] **Step 2: Run compiler, build, and diff checks**

Run: `npx tsc --noEmit`

Run: `npm run build`

Run from repository root: `git diff --check`

Expected: all exit 0.

- [ ] **Step 3: Record actual evidence**

Claim the three tickets as `Assignee: Codex`, add blank `Reviewed-by:`, append the implemented contract, exact command outcomes, browser viewport/accessibility evidence, and any explicit limitation under `## Resolution`.

- [ ] **Step 4: Leave integration decisions untouched**

Keep all three tickets `Status: open`, do not update `MAP.md`, and do not commit/merge/push until the separate Claude review and user integration authorization occur.

