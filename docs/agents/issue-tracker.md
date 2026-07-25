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

### 후순위 대기 밴드 (10000번대)

번호 `10000` 이상은 **후순위 대기 밴드**다. 지금 하지 않지만 폐기도 아닌, 필요해지면 꺼내 쓰는 티켓이 여기 산다. 본 밴드(`01`~)와는 **별개 카운터**로 `10001`부터 단조 증가한다.

- **기본 상태는 `Status: deferred`.** 프론티어 쿼리는 `Status: open`으로 돌기 때문에 대기 티켓이 프론티어에 섞이지 않는다 — 번호대를 따로 두는 실질적 이유가 이것이다. `open`으로 두면 "지금 할 수 있는 일" 목록이 영구히 오염된다.
- **번호는 상태가 아니다.** 활성화할 때 번호를 바꾸지 않는다(식별자는 불변, 기존 링크 보존): `Status: deferred` → `open`으로 바꾸고 `## Comments`에 활성화 사유와 날짜를 남긴다. 다시 미룰 때도 역방향으로 같은 기록을 남긴다. 번호가 `10001`인데 상태가 `open`인 티켓은 모순이 아니라 "대기 밴드에서 태어나 지금 활성화된 것"이다.
- **`Trigger:` 헤더 한 줄이 필수다** — "무엇이 참이 되면 이걸 꺼내는가". 트리거 없는 대기 티켓은 반드시 표류하고, 밴드는 묘지가 된다. 날짜가 아니라 조건으로 쓴다.
- **`Blocked-by:`는 그대로 쓸 수 있다.** 트리거와 다른 축이다 — 트리거는 "왜 지금 안 하나", 블로커는 "무엇이 먼저 끝나야 하나".

혼동하기 쉬운 세 가지와 구별할 것:

| | 뜻 | 표기 |
|---|---|---|
| **기각** | 안 하기로 **결정**했다 | `Status: closed` + `wontfix`, 지도 결정 줄에 `/ 기각:` |
| **유예** | 어떤 결정의 **부속 기록** | 지도 결정 줄에 `/ 유예:` |
| **fog** | 아직 정확히 **말할 수 없다** | 지도 "Not yet specified" |
| **대기(10000번대)** | 말할 수 있고 조사까지 됐지만 **순서상 뒤다** | `Status: deferred` + 10000번대 번호 |

지도에는 "Decisions so far"가 아니라 **`## 후순위 대기 (10000번대)`** 섹션에 한 줄로 색인한다. 지도에 없는 티켓은 존재를 잊는다.

### Close-time housekeeping

Every ticket close runs this checklist, in order, before the session moves on:

1. **Record** — `## Resolution` + `Status: closed` + map "Decisions so far" entry (above).
2. **Vocabulary** — if the resolution coined or changed domain terms, update `CONTEXT.md` now (/domain-modeling), not in a later batch.
3. **Ripple** — append `## Comments` notes to tickets the decision amends (e.g. a loop revision), and update or delete tickets it invalidates.
4. **Fog graduation** — re-read "Not yet specified"; anything the answer made specifiable becomes a new ticket (create, then wire `Blocked-by`), and its fog line is removed. Out-of-scope discoveries go to "Out of scope" instead.
5. **Learnings** — judge whether the session surfaced environment facts that live *outside* this repo (tool quirks, infra paths, external data locations): reflect those into agent memory or global CLAUDE.md. Facts already recorded in the repo (resolutions, research docs) are NOT duplicated into memory.
6. **Commit** — re-read the map before editing it (concurrent sessions), stage only this resolution's files (exclude other sessions' uncommitted work — check `git status` for files you didn't touch), commit as `resolve: <ticket title> (ticket NN) — <gist>`.
