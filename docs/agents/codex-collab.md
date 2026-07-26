# Codex Collaboration (this project)

Project-local override of the global `codex-collab` skill for `caseCollection`. This file **replaces** the global skill's project-specific example block (the global skill's Unity/C# example does not apply here) rather than appending to it. Read the global skill for workflow-letter mechanics (R/A/T) and the CLI invocation path (`codex-companion.mjs`); this file governs authority, lifecycle, and the result contract for this repo.

Design rationale and the four verification scenarios live in `docs/superpowers/specs/2026-07-26-claude-codex-vertical-collaboration-design.md` — read it once for the "why"; this file is the operative reference for day-to-day use.

## Authority model

Three distinct authorities, not two:

1. **Decision authority — Claude.** Owns open Wayfinder design tickets; makes domain/architecture/UI/scope decisions; owns `CLAUDE.md`, `docs/agents/`, Wayfinder tickets, and `MAP.md`; accepts or rejects Codex results, closes tickets, creates integration commits.
2. **Execution authority — Codex.** Reviews, diagnoses, implements within an explicit file scope handed to it. Changes source and tests only, unless the user directly asks for a documentation task. Does not commit delegated work. Returns unresolved design questions instead of guessing.
3. **Evidence authority — project docs and the OUT LLM wiki.** A ticket `## Resolution` is the decision authority for a project decision — `MAP.md` is an index, never a substitute for the ticket text. This repo's `CONTEXT.md` is authoritative for caseCollection terminology. The OUT wiki supplies source-domain facts, not project decisions.

## Entry Lane A — Claude-led work

```
Claude decision -> optional Codex advisory review -> Claude delegation -> Codex execution -> Claude verification and integration
```

1. **Decision.** Claude claims and owns the open ticket. While it's open, Codex may only do read-only Workflow A (adversarial review) when Claude explicitly asks — Workflow A must not modify files.
2. **Delegation.** Write-enabled Workflow T is allowed only when the referenced decision ticket is `closed`, or an implementation ticket generated from an approved spec is ready for an agent. Record the delegation in the existing implementation ticket (see Delegation Contract below); open a child ticket only if the work is independently schedulable, spans sessions, or has its own blocking edges.
3. **Execution.** Codex edits only the declared paths. It never edits `CLAUDE.md`, `docs/agents/`, `.scratch/`, or `MAP.md`, and never commits. If implementation needs a missing decision, Codex returns `decision_required`; if evidence conflicts with the governing ticket, it returns `source_conflict`.
4. **Integration.** Claude inspects the diff and verification evidence — independently, not by trusting Codex's self-report (run the smoke tests yourself). Claude may invoke a fresh Workflow R for a second opinion, then accepts/revises/rejects, updates the ticket and map, and creates the commit.

## Entry Lane B — user-initiated standalone Codex work

The user may hand Codex a task directly, with no preceding Claude delegation. Before proceeding, Codex should check: current branch/dirty worktree, claimed Wayfinder tickets, whether the request would decide an open design question, and whether its write scope overlaps another owner's changes. It proceeds for an explicit user spec, a closed decision, diagnosis, review, or behavior-preserving maintenance; it returns `decision_required` instead of implementing across an open Claude-owned design boundary. A commit is always a separate authorization.

**Mandatory housekeeping** closes every standalone task: distinguish this task's changes from pre-existing changes, record the diff and verification result, and — only when durable cross-agent knowledge remains unresolved — create a Claude intake issue (below). Direct work never infers permission to delete, commit, stash, or push.

**Lesson from the first run (2026-07-26)**: a standalone task read this project's own `docs/agents/codex-collab.md` and, unprompted, authored a full governance redesign as a new file outside its declared scope. That output happened to be exactly what the user wanted here — but it was outside the task's action_safety and had to be caught in review, not assumed safe. Treat "Codex wrote something insightful but unscoped" as a finding to surface, not a deliverable to accept silently.

## Session continuity — Claude ↔ Codex

Token expiry changes the active executor, not the goal, authority, or permission boundary. Use one redacted handoff at `%TEMP%\caseCollection-handoff.md`; update it at meaningful checkpoints rather than waiting for the final tokens. The receiving agent must treat it as a claim to verify, not as decision authority.

```markdown
# Agent Handoff

- Updated:
- Source agent: Claude | Codex
- Next agent: Codex | Claude
- Status: in_progress | blocked | review_required | complete

## Goal and completion criteria
## Governing ticket/spec and decision state
## Confirmed current state
## Work completed
## Files changed and ownership
## Verification performed
## Remaining work
## Exact next action
## Decisions requiring the user
## Risks, failures, and do-not-do
## References
## Suggested skills
```

Do not duplicate tickets, plans, ADRs, commits, or diffs in the handoff; link their paths or revisions. Never include secrets, auth files, environment values, or personal data. A handoff transfers context only: it does not grant commit, push, delete, stash, deployment, publication, or broader write authority.

### Claude → Codex resume

1. Claude records the goal, governing evidence, exact write scope, dirty-file ownership, completed verification, and the next executable action.
2. Codex independently checks the worktree, branch, recent commits, cited ticket/spec state, mentioned files, and last verification result.
3. If the handoff conflicts with the repository, the repository and governing evidence win; Codex reports `source_conflict` or `decision_required` instead of guessing.
4. Codex states the verified resume point and continues only within the inherited scope. Any materially new action needs the same authorization it would have needed without a handoff.

### Codex → Claude review and integration

Codex ends changed work with `Status: review_required` and its result contract, then hands back:

- the exact changed paths and whether each was pre-existing, modified by Codex, or merely observed;
- the governing ticket/spec and any deviation;
- commands actually run, their results, and checks not run;
- unresolved decisions, risks, documentation/wiki candidates, and the exact next action for Claude.

Claude then performs an independent integration review:

1. compare the handoff to `git status`, the scoped diff, and the governing ticket/spec;
2. reject or isolate any out-of-scope change instead of silently accepting it;
3. re-run the narrow acceptance checks and, for refactors, the behavior-preservation gate below;
4. record accepted/revision-requested/rejected status in the governing ticket or intake item;
5. update shared docs/map only when the verified result creates durable knowledge;
6. commit or push only under the user's separate authorization.

Claude marks the handoff `complete` only after acceptance and required integration work are finished. If revision is needed, keep `review_required`, state the failed acceptance item, and return an exact bounded task to Codex.

## Claude intake queue

Separate from the game Wayfinder map — for unresolved cross-agent work only:

```
.scratch/codex-intake/issues/<NN>-<slug>.md
```

```markdown
# <title>

Status: open
Labels: coordination:intake
Assignee:
Blocked-by:

## Source

- Mode: direct
- Related ticket: <path or none>
- Diff: <paths>
- Verification: <commands and results>

## Intake

- Decision required: <question or none>
- Documentation candidate: <target and evidence or none>
- Wiki candidate: <view/node/evidence or none>
- Risk: <conflict or none>
```

Claude processes intake by folding it into an existing ticket, creating a proper ticket, updating a shared doc, or closing as no-action. An intake file is never decision authority by itself.

## Delegation contract (for Entry Lane A)

Add this section to the governing implementation ticket rather than creating a synthetic one:

```markdown
## Codex delegation

Mode: A | T | R
Owner: Claude
Source-ticket: <ticket path>
Decision-state: open-advisory | closed
Write-scope: <exact paths>
Knowledge-sources:
  - CONTEXT.md
  - <ticket or ADR paths>
  - pd_wiki: <view function, arguments, OUT source revision>
Acceptance:
  - <command and expected result>
Integration-owner: Claude
Status: delegated | returned | accepted
```

Read the source ticket in full — a `MAP.md` summary line is never sufficient. Direct work (Lane B) doesn't create this block; it's identified as `Mode: direct` in the housekeeping report.

## Codex result contract

```markdown
Outcome: completed | decision_required | source_conflict | blocked
Changed: <file list>
Ownership: <pre-existing | Codex | observed for each changed path>
Verification: <commands and results>
Not-run: <checks not run and why>
Deviations: <none or exact deviation>
Housekeeping:
  docs: updated | candidate | skip
  wiki: updated | wiki_candidate | skip
  memory: updated | candidate | skip
  git: clean | changes-left | commit-approval-needed
Handoff: review_required | complete | not-needed
```

`completed` is valid only when every acceptance item was checked. A task that changed files but couldn't run its required validation is `blocked`, never `completed`.

## Document handoff (Codex analysis/report deliverables)

Not every Codex output is a diff. Standalone analysis — an architecture review, a code-quality audit,
a technology comparison — is itself a deliverable and needs its own standard, not the diff-shaped
Result Contract above and not an ad-hoc file dropped wherever the task happened to write it.

**Location.** `docs/research/<date>-<slug>.md` — the same directory and dated-filename convention
root `CLAUDE.md` already uses for research artifacts ("리서치 산출물은 `docs/research/`"), regardless
of whether Claude or Codex authored it. One evidence-document shelf for the whole repo. A
document-type deliverable never lives as a loose top-level file — that's how the first
`CODE_QUALITY_HANDOFF.md` landed and had to be relocated (2026-07-26).

**Required header**, before the body:

```markdown
# <title>

> Source: Codex (Entry Lane A delegated | Entry Lane B direct) | <date>
> Scope reviewed: <paths, or "whole repo">
> Verification performed by Codex: <commands + results, or "analysis only, no verification run">
> Verified by Claude: <date — what was independently re-checked, or "pending">
> Status: proposal | accepted | superseded
> Follow-up: <ticket or intake path, or "none yet">
```

**Claude's processing on receipt:**

1. Spot-check a sample of the document's factual claims against the repo — line references,
   test/build results — rather than accepting them at face value. Same evidentiary bar as the
   Result Contract's `Verification` field.
2. Append a `## Claude 검증 및 처리` section at the bottom: what was independently re-verified, what's
   accepted vs. deferred, and the ticket/intake path that will act on it.
3. If the document describes small, already-applied, behavior-preserving edits (e.g. an added npm
   script), call them out explicitly and check they haven't gone unnoticed inside a dirty working
   tree shared with unrelated in-progress work — flag it for a separate commit even when the change
   itself is fine.
4. A document is evidence, not decision authority — same rule as the intake queue below. It informs
   a ticket or a future delegation; it doesn't substitute for either. If it surfaces a decision no
   open ticket owns, file a Claude intake issue pointing at it rather than acting on it inline.

## LLM wiki as a shared evidence plane

The OUT LLM wiki (`f:/Project/out`) is read-only evidence, not a decision authority. Prefer deterministic `pd_wiki` alpha-layer view functions; cite the view function, arguments/node IDs, and the OUT revision used. Use `render_for_llm()` rather than slicing arbitrary Markdown; beta semantic search only when semantic similarity is explicitly needed. Claude normally runs the live query and curates what goes into a delegation — Codex queries the wiki directly only when a task explicitly allows read-only OUT access. OUT wiki data must never overwrite caseCollection's intentional redefinition of "case" (see this repo's `CONTEXT.md`). If wiki evidence contradicts a ticket, return `source_conflict`; if evidence is missing or unattributable, return `blocked` or `decision_required` — never invent context. Codex never writes to or regenerates the OUT wiki; a durable finding becomes `wiki_candidate` in housekeeping or a Claude intake issue.

## Image generation stays out of Codex's scope

Card art and marketplace assets go through the Higgsfield CLI directly (`scripts/cardart-generate.sh`, see root `CLAUDE.md` "카드 아트"); Claude calls it, no delegation needed. This is a project decision from ticket 13, not a workaround for a missing tool — route image work to Higgsfield even in a Codex session where `image_gen` happens to be exposed.

## Failure handling

| Condition | Required response |
|---|---|
| Write scope overlaps a dirty file owned by another session | `blocked`; report the exact overlap |
| Source ticket is open for a write-enabled delegated task | `decision_required`; no write |
| Governing ticket and wiki evidence conflict | `source_conflict`; cite both |
| Acceptance command can't run | `blocked`; preserve the diff, report why |
| Work reveals a new product/domain decision | `decision_required`; intake issue only in direct mode |
| A wiki update seems useful but wasn't part of the task | `wiki_candidate`; no wiki write |
| Codex changed a governance file (`CLAUDE.md`, `docs/agents/`, `.scratch/`, `MAP.md`) during delegated work | reject the integration; restore through owner-directed editing, not a destructive git command |

## Standing rules for every Workflow T prompt

- Query live ticket state (`grep "^Status:" .scratch/case-collection/issues/*.md`) at delegation time — never hardcode a list of currently-open ticket numbers into a prompt or this file; it goes stale immediately.
- Svelte 5 files: `$state` proxies can't `structuredClone` — pass `$state.snapshot(state)` to pure reducers (root `CLAUDE.md`).
- `src/lib/protoart.svelte.ts` and `ui/ArtSwitcher.svelte` are explicitly THROWAWAY — exclude from refactor scope, no investment.
- Game balance values (heat/trust thresholds, `Tag`/`Kind`/`SlotFrame` semantics, judgment-rule outcomes) are never a refactor target — structure/naming only, results must stay bit-identical.
- Default to no comments; add one only where the WHY is non-obvious, matching this codebase's existing Korean, ticket-referencing comment style.

## Behavior-preservation gate (mandatory for any refactor task)

`prototype/core-loop/src/lib/*.ts`'s pure modules (`engine.ts`, `facets.ts`, `dramaturgy.ts`, `scenario.ts`, `persona.ts`, `josa.ts`, `datapack.ts`) are promotion candidates for the production content validator (root `CLAUDE.md`), not throwaway — a refactor must not change behavior. The two smoke tests are that contract:

```bash
cd prototype/core-loop
npx esbuild smoke.ts --bundle --format=esm --platform=node --outfile=smoke.mjs && node smoke.mjs
npx esbuild smoke-datapack.ts --bundle --format=esm --platform=node --outfile=smoke-datapack.mjs && node smoke-datapack.mjs
```

Every refactor task's acceptance list must include both smoke outputs captured before and after, plus a clean `npx tsc --noEmit`. Claude re-runs both independently at integration time rather than trusting Codex's self-report.
