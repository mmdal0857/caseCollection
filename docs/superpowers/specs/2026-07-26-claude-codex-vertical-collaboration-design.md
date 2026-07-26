# Claude–Codex Vertical Collaboration Design

Date: 2026-07-26  
Scope: `caseCollection` repository only

## Purpose

Establish a project-local collaboration contract in which Claude remains the
integration and decision authority while Codex can contribute through both
Claude-delegated work and user-initiated standalone work.

The design must:

- preserve Wayfinder tickets as the decision record;
- prevent Codex from silently making unresolved design decisions;
- make delegation, verification, and acceptance traceable without creating a
  child ticket for every small task;
- allow standalone Codex work to flow back to Claude through housekeeping;
- use the OUT LLM wiki as a shared evidence layer without turning it into a
  task tracker or decision authority.

## Non-goals

- Changing the global Claude or Codex `codex-collab` skills.
- Replacing Wayfinder, the local Markdown issue tracker, or their ownership
  conventions.
- Letting Codex close design tickets, update the Wayfinder map, or integrate
  unreviewed changes.
- Using the runtime game to query an LLM or the OUT wiki.
- Changing the image-generation decision made by ticket 13.

## Authority Model

The project has three distinct authorities.

1. **Decision authority — Claude**
   - Owns open Wayfinder design tickets.
   - Makes domain, architecture, UI, and scope decisions.
   - Owns `CLAUDE.md`, `docs/agents/`, Wayfinder tickets, and `MAP.md`.
   - Accepts or rejects Codex results, closes tickets, and creates integration
     commits.

2. **Execution authority — Codex**
   - Reviews, diagnoses, and implements within an explicit file scope.
   - Changes source and tests only unless the user directly requests a
     documentation task.
   - Does not commit delegated work.
   - Returns unresolved design questions rather than guessing.

3. **Evidence authority — project docs and the OUT LLM wiki**
   - A ticket Resolution is the source of truth for a project decision.
   - `MAP.md` is an index, not a substitute for the ticket text.
   - The local `CONTEXT.md` is authoritative for caseCollection terminology.
   - The OUT wiki supplies source-domain facts and relationships, not project
     decisions.

## Entry Lane A: Claude-led Work

The normal vertical flow is:

```text
Claude decision
  -> optional Codex advisory review
  -> Claude delegation
  -> Codex execution
  -> Claude verification and integration
```

### 1. Decision

Claude claims and owns the open Wayfinder ticket. While the ticket is open,
Codex may participate only through read-only Workflow A when Claude explicitly
requests an adversarial review.

Workflow A must not modify files. Claude evaluates the response and remains the
decision maker.

### 2. Delegation

Write-enabled Workflow T is allowed only when:

- the referenced decision ticket is closed; or
- an implementation ticket generated from an approved spec is ready for an
  agent.

The delegation is recorded in the existing implementation ticket. A separate
child ticket is created only when the delegated work is independently
schedulable, spans multiple sessions, or has its own blocking edges.

### 3. Execution

Codex edits only the declared source and test paths. It does not edit
`CLAUDE.md`, `docs/agents/`, `.scratch/`, or `MAP.md`, and it does not commit.

If implementation requires a missing decision, Codex returns
`decision_required`. If evidence conflicts with the governing ticket, Codex
returns `source_conflict`.

### 4. Integration

Claude inspects the diff and verification evidence. Claude may invoke a fresh
Codex Workflow R for independent review. Claude then accepts, revises, or
rejects the work, updates the governing ticket and map when appropriate, and
creates the commit.

## Entry Lane B: User-initiated Codex Work

The user may start work directly with Codex without a preceding Claude
delegation.

Codex first checks:

- the current branch and dirty worktree;
- claimed Wayfinder tickets;
- whether the requested change would decide an open design question;
- whether its write scope overlaps another owner's changes.

Codex may proceed independently for an explicit user specification, a closed
decision, diagnosis, review, behavior-preserving maintenance, or another task
whose authority is already clear.

Codex stops with `decision_required` rather than implementing across an open
Claude-owned design boundary. A commit remains a separate user authorization.

### Mandatory housekeeping

Every completed standalone Codex task ends with the project `housekeeping`
flow. Housekeeping:

- distinguishes the task's changes from pre-existing user or Claude changes;
- records the exact diff and verification result;
- routes durable knowledge to the appropriate shared destination when the
  evidence and ownership are clear;
- reports documentation, wiki, memory, skill, and Git handling explicitly;
- does not infer permission to delete, commit, stash, or push.

If no durable cross-agent knowledge remains, the housekeeping report is enough.
If Claude must make a follow-up decision or route knowledge into governance
documents, Codex creates a Claude intake issue.

## Claude Intake Queue

Claude intake is separate from the game Wayfinder map:

```text
.scratch/codex-intake/issues/<NN>-<slug>.md
```

An intake issue is created only for unresolved cross-agent work. It uses:

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

Claude processes the intake by folding it into an existing ticket, creating a
proper Wayfinder or implementation ticket, updating a shared document, or
closing it as no action. Intake files never become decision authority by
themselves.

## Delegation Contract

Small and medium delegations use a section in the governing implementation
ticket:

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

The source ticket must be read in full. A `MAP.md` summary alone is
insufficient.

Direct work does not create a synthetic delegation block. It is identified as
`Mode: direct` in the housekeeping report and creates a Claude intake issue
only when unresolved cross-agent knowledge remains.

The project-local contract must query live ticket headers at delegation time.
It must not hardcode a list of currently open ticket numbers.

## Codex Result Contract

Codex returns:

```markdown
Outcome: completed | decision_required | source_conflict | blocked
Changed: <file list>
Verification: <commands and results>
Deviations: <none or exact deviation>
Housekeeping:
  docs: updated | candidate | skip
  wiki: updated | wiki_candidate | skip
  memory: updated | candidate | skip
  git: clean | changes-left | commit-approval-needed
```

`completed` is valid only when every acceptance item was checked. A task that
changed files but could not run its required validation is `blocked`, not
`completed`.

## LLM Wiki as the Knowledge Plane

The OUT LLM wiki is a shared read-only evidence plane for collaboration.

### Query rules

- Prefer deterministic `pd_wiki` alpha-layer view functions for facts and
  relationships.
- Pass the view function name, arguments or node IDs, and the OUT repository
  revision used to produce the evidence.
- Use `render_for_llm()` rather than arbitrary Markdown slicing.
- Use beta semantic search only when semantic similarity is explicitly needed
  and the backend is available.

Claude normally performs the live query and curates the evidence included in a
delegation. Codex may query the wiki directly only when the task explicitly
allows read-only OUT access.

### Authority and conflict rules

- Wayfinder ticket Resolution: project decision authority.
- caseCollection `CONTEXT.md`: local terminology authority.
- OUT `CONTEXT.md` and wiki: source-domain terminology and factual authority.
- OUT wiki data must not overwrite caseCollection's intentional redefinition
  of `case`.

If wiki evidence contradicts a ticket, Codex returns `source_conflict`.
If evidence is missing or its revision cannot be identified, Codex returns
`blocked` or `decision_required` rather than inventing context.

Codex does not write to or regenerate the OUT wiki during ordinary
implementation. A durable finding becomes `wiki_candidate` in housekeeping or
a Claude intake issue. Claude decides whether to promote it into a separate
content-pipeline task.

## Project-local Override Rules

`docs/agents/codex-collab.md` must explicitly state:

- it replaces, rather than appends to, the global skill's project-specific
  example block;
- the global Unity/C# example is inapplicable to caseCollection;
- live ticket state must be queried rather than copied into the document;
- image work is routed to Higgsfield because ticket 13 selected that pipeline,
  regardless of whether a current Codex session exposes `image_gen`;
- Claude owns governance and integration in delegated work;
- standalone Codex work rejoins through housekeeping and, when needed, the
  Claude intake queue.

This repository-local override avoids editing global skills used by other
projects.

## Failure Handling

| Condition | Required response |
|---|---|
| Write scope overlaps a dirty file owned by another session | `blocked`; report the exact overlap |
| Source ticket is open for a write-enabled delegated task | `decision_required`; no write |
| Governing ticket and wiki evidence conflict | `source_conflict`; cite both |
| Acceptance command cannot run | `blocked`; preserve the diff and report why |
| Work reveals a new product or domain decision | `decision_required`; create intake only in direct mode |
| Wiki update seems useful but was not part of the task | `wiki_candidate`; no wiki write |
| Codex changed a governance file during delegated work | reject integration and restore through owner-directed editing, not destructive Git commands |

## Verification

The collaboration contract is verified with four dry scenarios:

1. An open UI design ticket permits Workflow A and rejects Workflow T.
2. A closed implementation ticket permits source/test edits, requires the
   declared checks, and leaves integration and commit to Claude.
3. A direct Codex maintenance task runs housekeeping and creates no intake when
   it produces no durable unresolved knowledge.
4. A direct task with conflicting wiki evidence creates a Claude intake issue
   with `source_conflict` and makes no speculative implementation.

Static review must also confirm:

- no Unity/C# project block appears in the project-local contract;
- no current open-ticket list is hardcoded;
- all referenced repository paths exist or are intentionally introduced by the
  rollout;
- the delegation and result examples contain no unresolved placeholders in
  their actual use;
- the image-pipeline rule is expressed as a project decision, not a claim about
  Windows tool availability.

When implementation code is involved, existing project checks remain
mandatory, including the relevant TypeScript check and both smoke tests
specified in `CLAUDE.md`.

## Rollout

Claude owns the rollout because it changes collaboration governance:

1. Reconcile the currently uncommitted `CLAUDE.md` and
   `docs/agents/codex-collab.md` changes.
2. Replace the project collaboration document with this lifecycle and the
   project-local override rules.
3. Add the Claude intake convention to `docs/agents/issue-tracker.md`.
4. Keep `MAP.md` limited to a short pointer to the collaboration document;
   operational details do not belong in the map.
5. Dry-run the four verification scenarios.
6. Commit the governance changes separately from any product or UI work.

No game Wayfinder ticket is created for the collaboration process itself.
Large delegated product work may still receive a child implementation ticket
under its existing feature effort.
