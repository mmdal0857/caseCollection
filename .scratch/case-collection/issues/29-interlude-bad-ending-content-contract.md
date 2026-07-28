# 인터루드·BAD 엔딩 콘텐츠 생성 규약

Status: closed
Labels: wayfinder:grilling
Assignee: Codex
Reviewed-by: Claude (2026-07-29)
Blocked-by: 18

## Question

확정된 `GeneratedCase` 계약 위에서 인터루드 이벤트와 BAD 엔딩 콘텐츠를 빌드타임에 어떻게 생성·검증할지 구체화한다.

- 입력은 이전 case의 tag·축 이동 이력, 고정축·`axisProfile`, `storySeed`, `presentation`, 출처 envelope로 제한한다.
- 런타임 LLM 없이 같은 입력과 버전에서 같은 이벤트·엔딩이 나오도록 한다.
- 인터루드가 다음 사건을 예고하거나 이전 선택을 회수하되, 아직 공개되지 않은 `truth`를 누출하지 않는 규칙을 정한다.
- BAD 엔딩은 도달 가능한 실패 상태와 기계적으로 연결되고, 실제 플레이 로그 없이 임의로 발명되지 않아야 한다.
- 문장 템플릿과 자유 표현 중 무엇을 `presentation`이 소유하는지, validator가 도달성·복선·조사 누출·출처를 어디까지 검사하는지 정한다.
- 출력이 `GeneratedCase`와 같은 provenance를 유지하도록 별도 envelope 또는 pack 내 위치를 확정한다.

결과는 인터루드·BAD 엔딩의 입력/출력 스키마, 결정론 경계, 기계 검증 항목, 최소 콘텐츠 예시를 포함해야 한다.

## Resolution

- 입력 계약 `NarrativeGenerationInput@1`과 출력 계약 `InterludeDefinition` / `EndingDefinition`을 `src/lib/narrative-content.ts`에 구현했다.
  - 허용 입력은 이전 case의 공개 tag·axis 이동·risk axis, 다음 case의 공개 복선·guest facet allowlist, 공개 `storySeed.axisProfile`, `presentation`, provenance뿐이다.
  - 알 수 없는 키는 exact-key validator가 거부한다. `next.truth`를 삽입한 negative fixture는 `next.truth` 경로에서 실패한다.
- 결정론 경계:
  - `buildInterludeDefinition`은 네트워크·시계·난수·런타임 LLM을 사용하지 않는다.
  - `canonicalNarrativeJson`으로 동일 입력 두 번과 승인 expected fixture를 byte 비교한다.
  - 입력: `prototype/core-loop/fixtures/narrative/c1-c2.public-input.json`
  - 승인 출력: `prototype/core-loop/fixtures/narrative/c1-c2.expected-interlude.json`
- pack v2:
  - `interludes`와 `endings`를 실제 TypeScript 타입으로 승격했다.
  - `interlude` / `ending`을 alongside 추가와 명시적 promotion 상쇄 대상으로 포함하고 merge provenance를 남긴다.
  - schema의 promotion kind, stabilize 방향, BAD trigger/warning enum을 계약과 동기화하고 standalone Ajv ESM validator를 재생성했다.
- 기계 검증:
  - 모든 인접 case 전환에 인터루드가 정확히 하나 존재
  - AP 2, `recon` / `interview` / `stabilize` 각 1개
  - recon 결과가 다음 case의 공개 `teaser` / `contextHint` / title / 첫 공개 frame 중 하나와 byte-identical
  - interview 측면이 다음 case `guestFacets` allowlist에 포함
  - stabilize가 heat를 낮추거나 trust를 높임
  - BAD 엔딩이 `bad-press→press`, `bad-collapse→collapse`로 짝지어지고 실제 tag delta로 warning에서 trigger까지 도달 가능
  - 실제 경고 이력이 없으면 임계 상태에서도 BAD 엔딩을 만들지 않음
- 최소 콘텐츠:
  - `c1→c2`, `c2→c3`, `c3→boss` 인터루드 3개
  - 언론 재판 / 수사반 붕괴 BAD 엔딩 2개
  - `c2`와 `boss`에 명시적 guest facet allowlist를 추가했다.
- 런타임 replay:
  - `Clear → Interlude(AP 2, 3선 2택) → Briefing` 화면 그래프를 그대로 사용한다.
  - pack 정의의 presentation·action 문장·guest facet만 replay하며, 세 번째 행동은 AP 0에서 상태를 바꾸지 않는다.
  - pack BAD presentation은 실제 경고 이력과 도달한 실패 이벤트가 모두 맞을 때만 재생한다.
- 재현 명령:
  - `npm run schema:check`
  - `npm run smoke:narrative`
  - `npm run smoke:datapack`
  - `npm run smoke:run-flow`
  - `npx tsc --noEmit`
  - `npm run build`

### Claude review checklist (2026-07-29)

- [x] **exact-key allowlist·truth negative test** — `src/lib/narrative-content.ts`를 직접 읽었다: `INPUT_KEYS`/`PREVIOUS_KEYS`/`NEXT_KEYS`/`STORY_KEYS`/`PRESENTATION_KEYS`/`PROVENANCE_KEYS` 어디에도 `truth` 경로가 없어 어느 레벨에서도 유출 불가함을 코드로 확인. `npm run smoke:narrative` 독립 재실행 PASS — "미공개 truth가 입력 경계에서 기계적으로 거부된다" 케이스 포함.
- [x] **공개 복선·guest facet 교차 참조 + byte 동일 fixture** — 같은 스모크의 "정찰 결과는 다음 사건 foreshadow allowlist에서만 온다", "결정론적 emit이 승인된 expected fixture와 byte-identical이다" PASS.
- [x] **alongside·promotion provenance** — "namespaced 인터루드는 base와 alongside 병합된다", "명시적 promotion만 기존 인터루드를 상쇄한다", "인터루드 상쇄 provenance가 merge report에 남는다" PASS.
- [x] **warning 선행 없는 BAD 거부·도달성** — "실제 경고 이력 없이 BAD 엔딩을 임의 발명하지 않는다", "도달한 실패 상태와 선행 경고가 함께 있을 때 pack BAD 엔딩을 재생한다" PASS.
- [x] **티켓 22 AP 2/3선 2택 replay** — "런 화면 계약에서 세 행동 중 둘만 실행하고 공개 복선·allowlist 측면만 얻는다", "티켓 22 화면 그래프대로 인터루드 뒤 다음 Briefing으로 간다" PASS. `smoke:run-flow`와 교차해도 일관됨을 확인.

결론: **승인.**
