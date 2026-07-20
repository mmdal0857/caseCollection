# Issue tracker: Local Markdown

Issues and PRDs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The PRD is `.scratch/<feature-slug>/PRD.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

This tracker has no native blocking or labels, so wayfinder uses header-line conventions.

- **The map** is `.scratch/<effort-slug>/MAP.md` with `Labels: wayfinder:map` near the top.
- **Tickets** are `.scratch/<effort-slug>/issues/<NN>-<slug>.md` — child issues of the map. Header lines at the top of each file:
  - `Status: open` | `Status: closed`
  - `Labels: wayfinder:<research|prototype|grilling|task>`
  - `Assignee:` — empty means unclaimed; a session claims a ticket by writing an owner name here *before* any work
  - `Blocked-by: <NN>[, <NN>...]` — body convention standing in for native dependency links; omit or leave empty when unblocked
- A ticket is **unblocked** when every ticket in its `Blocked-by` line has `Status: closed`.
- **Frontier query**: files with `Status: open`, empty `Assignee:`, and all blockers closed. E.g. `grep -l "Status: open" .scratch/<effort>/issues/*.md` then filter by assignee/blockers.
- **Resolution**: append the answer under `## Resolution` at the bottom, set `Status: closed`, and add a one-line entry to the map's "Decisions so far" linking the ticket by name.
- **Rejection trail**: if the resolution considered and *discarded* an alternative, record it on the same map line as `/ 기각: …` (rejected outright) or `/ 유예: …` (deferred past MVP). A one-line summary that keeps only what was adopted makes an explicit rejection look like an unexplored gap — readers who see the map but not the ticket then re-raise settled questions, or worse, do work to "fill" it. Demonstrated: `docs/research/2026-07-20-cross-research-audit.md` §3, where 3 of 4 flagged "missing recommendations" were in fact recorded rejections. The map is an **index, not the authority** — ticket bodies remain canonical.
- Ticket numbering is monotonic across the effort — new tickets take the next `<NN>` regardless of how many are closed.

### Close-time housekeeping

Every ticket close runs this checklist, in order, before the session moves on:

1. **Record** — `## Resolution` + `Status: closed` + map "Decisions so far" entry (above).
2. **Vocabulary** — if the resolution coined or changed domain terms, update `CONTEXT.md` now (/domain-modeling), not in a later batch.
3. **Ripple** — append `## Comments` notes to tickets the decision amends (e.g. a loop revision), and update or delete tickets it invalidates.
4. **Fog graduation** — re-read "Not yet specified"; anything the answer made specifiable becomes a new ticket (create, then wire `Blocked-by`), and its fog line is removed. Out-of-scope discoveries go to "Out of scope" instead.
5. **Learnings** — judge whether the session surfaced environment facts that live *outside* this repo (tool quirks, infra paths, external data locations): reflect those into agent memory or global CLAUDE.md. Facts already recorded in the repo (resolutions, research docs) are NOT duplicated into memory.
6. **Commit** — re-read the map before editing it (concurrent sessions), stage only this resolution's files (exclude other sessions' uncommitted work — check `git status` for files you didn't touch), commit as `resolve: <ticket title> (ticket NN) — <gist>`.
