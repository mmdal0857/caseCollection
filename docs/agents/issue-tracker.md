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
- Ticket numbering is monotonic across the effort — new tickets take the next `<NN>` regardless of how many are closed.
