# caseCollection

OUT 프로젝트(`f:/Project/out`)의 LLM 위키를 기반으로 하는 웹 카드 콜렉션 게임. wayfinder 지도로 진행 — 정본은 `.scratch/case-collection/MAP.md` (현재 상태·프론티어는 지도의 Decisions so far와 open 티켓이 권위). 리서치 산출물은 `docs/research/`.

**주의: `MAP.md`는 색인이지 정본이 아니다.** 한 줄 요약은 채택안만 남기고 기각·유예된 대안을 지운다 — 결정 상태를 판정하려면 반드시 티켓 원문을 대조할 것.

## 기술 스택 (ticket 05 확정)

**Svelte 5 + Vite + TypeScript** (SvelteKit 미사용 — 단일 페이지 정적 빌드). 배포는 itch.io butler + GitHub Pages.

- **Svelte 5 `$state` 프록시는 `structuredClone`으로 복제 불가** (`DataCloneError`). 순수 리듀서에 상태를 넘길 땐 반드시 `$state.snapshot(state)`로 평범한 객체를 만들어 전달할 것. 이걸 놓치면 모든 dispatch가 조용히 예외로 죽어 화면이 멈춘다 (프로토 v1에서 실제 발생).
- 파생값은 `$derived`, 복합 계산은 `$derived.by`. `$props()` 값을 지역 상수로 캡처하면 `state_referenced_locally` 경고 — 의도한 초기값 캡처가 아니면 `$derived`로.

## 프로토타입 자산

코어 루프 프로토타입(v1~v10.1, ticket 11·17·19)은 **main의 `prototype/core-loop/`**에 있다 — 2026-07-23 `b2596bf`로 병합됐고 동명 브랜치는 삭제됐다. **예전 문서의 `git checkout prototype/core-loop`는 무효.** 실행: `cd prototype/core-loop && npm install && npm run dev`.

검증된 **순수 모듈**은 스펙 입력이자 **빌드 파이프라인의 콘텐츠 검증기**로 승격 예정 — `engine.ts`(솔버빌리티), `facets.ts`(얼굴 합법성·해석 공간), `dramaturgy.ts`(코믹 반응 생성), `scenario.ts`(서사 응집), `persona.ts`, `josa.ts`, `datapack.ts`(데이터 팩 로더).

**기계 검증기 실행** — `npm run` 스크립트가 아니라 esbuild 번들 후 node 실행이다:

```
cd prototype/core-loop
npx esbuild smoke.ts --bundle --format=esm --platform=node --outfile=smoke.mjs && node smoke.mjs
npx esbuild smoke-datapack.ts --bundle --format=esm --platform=node --outfile=smoke-datapack.mjs && node smoke-datapack.mjs
```

데이터 팩 추출 파이프라인(티켓 14 뼈대 — 3·4단계 STUB): `py scripts/extract_game_data_pack.py`

## Agent skills

### Issue tracker

Local markdown tracker under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default role strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
