# core-loop 프로토타입 승격 구조 결정 필요

Status: open
Labels: coordination:intake
Assignee:
Blocked-by:

## Source

- Mode: direct
- Related ticket: `.scratch/case-collection/issues/11-core-loop-prototype.md` (closed — "순수 모듈을
  스펙 입력으로 승격 권장"까지만 결의, 승격 방법은 열어둠)
- Diff: `prototype/core-loop/package.json` (`smoke`/`smoke:datapack` npm 스크립트 추가, 2줄,
  behavior-preserving)
- Verification: Claude가 2026-07-26 독립 재실행 — `npm run build` PASS, `npm run smoke` PASS,
  `npm run smoke:datapack` PASS (전부 보고서 주장과 일치). 상세는
  `docs/research/2026-07-26-core-loop-code-quality-audit.md`.

## Intake

- Decision required: `prototype/core-loop`의 순수 모듈(`engine.ts`, `datapack.ts` 등)을 정식 코드로
  승격할 때 —
  1. `engine.ts`를 `domain/model.ts` + `domain/state.ts` + `rules/*`로 분리할지, 분리한다면 정확한
     파일별 책임과 허용 import 방향은?
  2. `datapack.ts`를 `schema.ts`/`merge.ts`/`integrity.ts`/`index.ts`로 재구성할지?
  3. 데이터 팩 정본(JSON Schema / TypeScript 타입 / 런타임 validator 3중 중복)을 무엇으로 통합할지 —
     스키마 우선(JSON Schema→TS 생성) vs 코드 우선(Zod/Valibot→JSON Schema 생성)?
  4. 기존 `smoke.ts`를 Vitest로 이전하는 시점을 승격 이전/이후 중 언제로 할지?
  셋 다 아직 어느 Wayfinder 티켓도 소유하지 않은 열린 설계 질문이다. 근거·권장안:
  `docs/research/2026-07-26-core-loop-code-quality-audit.md`.
- Documentation candidate: 위 결정이 나면 `docs/agents/codex-collab.md`의 "Standing rules for every
  Workflow T prompt"에 승격 후 구조 규칙을 추가한다 (현재는 프로토타입을 throwaway로 다루는 규칙만
  있고, 승격된 모듈에 대한 별도 규칙이 없다).
- Wiki candidate: none — OUT LLM wiki와 무관한 순수 구조 결정.
- Risk: none. 순수 모듈은 이미 ticket 11에서 승격 대상으로 확정됐고 이 인테이크는 승격 실행 방법만
  다룬다 — 게임 규칙(밸런스·판정)은 범위 밖이고, 리포트 자체도 "동작을 고정한 뒤 구조만 이동"을
  핵심 제약으로 명시한다.
