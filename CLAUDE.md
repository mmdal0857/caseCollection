# caseCollection

OUT 프로젝트(`f:/Project/out`)의 LLM 위키를 기반으로 하는 웹 카드 콜렉션 게임. wayfinder 지도로 진행 — 정본은 `.scratch/case-collection/MAP.md` (현재 상태·프론티어는 지도의 Decisions so far와 open 티켓이 권위). 리서치 산출물은 `docs/research/`.

## Agent skills

### Issue tracker

Local markdown tracker under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default role strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
