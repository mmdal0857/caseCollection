# Case Collection 코드 품질·구조 개선 리포트

> Source: Codex (Entry Lane B / direct) | 2026-07-26
> Scope reviewed: `prototype/core-loop`
> Verification performed by Codex: `npm run build` PASS, `npm run smoke` PASS (잠금 3모드 완주, 4개 사건 풀이가능성·서사응집 검증, BAD 엔딩 양방향 도달, 조사 누출 린트 통과)
> Verified by Claude: 2026-07-26 — 아래 "Claude 검증 및 처리" 참고
> Status: proposal
> Follow-up: `.scratch/codex-intake/issues/01-core-loop-promotion-follow-up.md`

## 결론

현재 코드는 **실험 목적의 프로토타입으로서는 건강하다**. UI와 게임 규칙이 분리되어 있고, 핵심 판정이
순수 함수 중심이며, 데이터 팩 검증과 기계 스모크 테스트도 존재한다. 프로덕션 빌드와 전체 스모크 시나리오는
통과했다.

다만 `engine.ts`가 도메인 모델, 상태 전이, 사건 진행, 보상, 인터루드까지 한 module에 담고 있고,
`datapack.ts`가 형식 검증·병합·참조 무결성을 함께 담당한다. 정식 코드로 승격할 경우 이 두 파일이 변경
충돌과 인지 부하의 중심이 된다.

README가 이 디렉터리를 명시적으로 "throwaway"라고 규정하므로, 지금 대규모 리팩터링하는 것은 투자 대비
효과가 낮다. **검증된 규칙을 정식 코드로 옮길 때 seam을 다시 설계하는 방식**이 적절하다.

## 검증 결과

- `npm run build`: PASS
- `npm run smoke`: PASS
  - 잠금 모드 3종 모두 4/4 사건 GOOD 완주
  - 4개 사건의 풀이 가능성·서사 응집 검증 통과
  - BAD 엔딩 양방향 도달 가능
  - 앞 문맥 전파, 연쇄 해제, 조사 누출 린트 통과
- 기존 작업 트리 변경은 보존했으며 겹치는 파일을 수정하지 않았다.
- 직접 반영한 소규모 개선: `package.json`에 `smoke` 스크립트를 추가해 README의 수동 명령을
  반복 가능한 프로젝트 명령으로 승격했다.

## 잘된 점

1. **UI와 규칙의 seam이 분명하다.**
   - `App.svelte`는 `initGame`과 `reduce`만 호출한다.
   - 화면 module은 `GameState`, `RunContent`, `dispatch`를 받아 렌더링한다.
   - 호출자가 규칙 세부사항을 알 필요가 없어 interface 대비 구현의 깊이가 좋다.

2. **순수 판정 module은 승격 가치가 높다.**
   - `facets.ts`는 `facetStatus`, `readFacets`, `interpretationSpace`라는 작은 interface 뒤에
     얼굴 게이트 규칙을 숨긴다.
   - `josa.ts`, `dramaturgy.ts`도 책임이 비교적 응집되어 있다.

3. **콘텐츠를 코드와 분리하려는 방향이 이미 있다.**
   - `datapack.ts`에 검증 → 병합 → 참조 무결성 → 로드 순서가 존재한다.
   - 오류가 `path`와 `msg`를 가지므로 저작자가 문제 위치를 찾기 쉽다.

4. **프로토타입인데도 회귀 검증이 실제 플레이 규칙을 다룬다.**
   - 단순 함수 단위가 아니라 완주, 실패 경로, 소프트락, 언어 누출까지 확인한다.

## 우선순위별 개선 사항

### P0 — 정식 승격 전에 반드시

#### 1. 도메인 계약을 `engine.ts`에서 분리

근거:

- `engine.ts:17-432`에 카드·사건·콘텐츠·상태·액션 타입이 모여 있다.
- `engine.ts:437-669`에 판정과 상태 보조 로직이 있다.
- `engine.ts:673-1090` 부근에 초기화와 모든 액션 handler/reducer가 있다.
- `datapack.ts`, `facets.ts`, UI 모두 이 파일의 타입을 import한다.

문제:

- 상태 전이 구현을 수정하지 않아도 콘텐츠 계약 변경이 같은 파일을 건드린다.
- 사람과 AI 모두 "타입을 읽기 위해" 거대한 reducer 파일을 열어야 한다.
- import 방향상 `facets.ts`가 `engine.ts`의 타입에 의존하고 `engine.ts`가 다시 `facets.ts` 구현을
  의존한다. 런타임 순환은 type-only import 덕분에 피하지만 개념적 결합은 남는다.

권장 구조:

```text
src/lib/domain/
  model.ts          # Suit, Tag, Facet, ClueCard, CaseDef, RunContent
  state.ts          # GameState, Action, 결과 타입
  rules/
    facets.ts
    submission.ts
    progression.ts
  engine.ts         # 외부 interface: initGame(), reduce()
```

`engine.ts`의 외부 interface는 지금처럼 작게 유지한다. 내부 파일을 잘게 나누는 목적은 공개 surface를
늘리는 것이 아니라 locality를 높이는 것이다.

#### 2. 스모크 테스트를 테스트 러너의 자동 검증으로 승격

현재 `smoke.ts`는 훌륭한 자산이지만 출력 기반 스크립트다. CI가 종료 코드만 신뢰할 수 있도록 모든
실패가 명시적으로 non-zero 종료 또는 assertion 실패를 발생시키는지 확인해야 한다.

권장:

- Vitest를 도입해 `smoke.test.ts`로 이전한다.
- 잠금 모드, 콘텐츠 solvability, BAD 경로, 조사 린트를 각각 독립 테스트로 만든다.
- `npm run test`, `npm run check`, `npm run build`를 CI의 최소 게이트로 둔다.
- 이번에 추가한 `npm run smoke`는 이전이 끝날 때까지 유지한다.

### P1 — 다음 구조 작업

#### 3. 데이터 팩의 단일 정본을 정한다

근거:

- JSON Schema: `schema/game-data-pack.json`
- 수동 런타임 검증: `datapack.ts:103-329`
- TypeScript 계약: `engine.ts`와 `datapack.ts`
- 조사 규칙 일부는 `smoke.ts`에도 중복되어 있다.

세 정본이 독립적으로 바뀌면 스키마는 통과하지만 런타임은 거부하거나, TypeScript 타입과 실제 허용
데이터가 달라질 수 있다.

권장:

- 스키마 우선이면 JSON Schema에서 TS 타입과 validator를 생성한다.
- 코드 우선이면 Zod/Valibot 같은 schema module에서 타입과 JSON Schema를 생성한다.
- 참조 무결성처럼 단일 객체 형태만으로 표현할 수 없는 규칙은 별도 `checkIntegrity` 단계에 남긴다.
- `as unknown as GameDataPack`은 정본 통합 후 제거한다.

#### 4. `datapack.ts`를 세 개의 깊은 module로 재구성

현재 파일은 검증, 병합, 무결성 검사를 모두 공개한다. 외부 호출자 대부분은 `loadPacks` 하나만 필요하다.

권장 내부 seam:

```text
data-pack/
  schema.ts         # parsePack(unknown) -> Result<GameDataPack, PackIssue[]>
  merge.ts          # mergePacks(valid packs)
  integrity.ts      # checkIntegrity(content)
  index.ts          # 외부 interface: loadPacks(...)
```

외부에는 `loadPacks`와 필요한 결과 타입만 우선 공개한다. 저수준 함수는 데이터 팩 저작 도구가 실제로
필요로 할 때만 공개한다.

#### 5. reducer의 "복제 후 내부 mutation" 계약을 명시

`engine.ts:1051-1052`는 매 액션마다 `structuredClone(prev)` 후 handler가 복제본을 mutation한다.
현재로서는 순수 interface를 유지하는 실용적인 선택이다. 다만:

- `structuredClone` 가능한 값만 `GameState`에 들어갈 수 있다는 숨은 interface 제약이 있다.
- 액션마다 전체 상태·노트를 복제하므로 데이터가 커질 때 비용이 증가한다.
- handler만 따로 호출하면 mutation 함수라는 사실을 놓치기 쉽다.

권장:

- 당장은 handler를 export하지 않고 `reduce`를 유일한 seam으로 유지한다.
- `GameState`가 직렬화 가능한 데이터만 가진다는 불변식을 테스트/문서화한다.
- 성능 문제가 실제 측정될 때 Immer 또는 slice별 복제로 바꾼다. 선제 최적화는 하지 않는다.

### P2 — 정리와 가독성

#### 6. 실험 잔재의 생명주기를 표시

`scenario.ts` 등 일부 v4~v6 실험 module은 현재 앱 진입점에서 참조되지 않는 것으로 보인다. 삭제 여부를
즉시 결정하기보다 다음 중 하나로 명시한다.

- 현재 규칙의 근거라면 `prototype/archive/`로 옮기고 README에서 연결
- 회귀 검증 대상이면 테스트에서 직접 import
- 더 이상 필요 없다면 별도 커밋으로 삭제

미사용 코드는 사람과 AI 모두에게 "숨은 현행 기능인가?"라는 탐색 비용을 준다.

#### 7. 공개 상수의 불변성 강화

`SUITS`, `FRAME_ACCEPTS`, `LOCK_MODES` 등 호출자가 수정할 이유가 없는 배열은 `readonly`/`as const`를
사용한다. 이는 의도를 명확히 하고 실수로 런타임 설정을 바꾸는 일을 막는다.

#### 8. guard로 non-null assertion을 줄인다

`engine.ts`, `datapack.ts`, `CaseScreen.svelte`에 `!`가 남아 있다. 대부분 앞선 조건으로 안전하지만
독자는 그 조건을 다시 추적해야 한다.

권장:

- 지역 변수로 한 번 좁힌 뒤 사용한다.
- 검증 완료 뒤 타입을 좁혀 주는 parse 함수로 수동 assertion을 격리한다.
- 단, 단지 `!`를 없애기 위한 장황한 guard는 추가하지 않는다.

## 제안하는 실행 순서

1. 현재 프로토타입을 태그/보관하고 승격 대상 규칙을 확정한다.
2. 테스트 러너와 CI 게이트를 먼저 만든다.
3. 공통 도메인 계약(`domain/model.ts`, `domain/state.ts`)을 추출한다.
4. 기존 `initGame`/`reduce` interface를 유지한 채 reducer 내부를 규칙별 module로 이동한다.
5. 데이터 팩 정본을 하나로 통합하고 `loadPacks`를 외부 seam으로 고정한다.
6. UI는 변경하지 않은 채 회귀 테스트와 플레이 테스트를 통과시킨다.
7. 마지막으로 미사용 실험 module과 문서를 정리한다.

각 단계는 독립 커밋으로 유지한다. 구조 이동과 동작 변경을 같은 커밋에 섞지 않아야 사람이 diff를
분석하기 쉽다.

## 사람과 AI가 함께 읽기 쉬운 클린 코드 기준

- 파일 첫 부분에 "이 module이 숨기는 복잡성"과 외부 interface를 3~5줄로 적는다.
- 이름은 게임 도메인 용어를 유지한다. `manager`, `helper`, `util`, `data` 같은 포괄명은 피한다.
- 공개 export는 호출자에게 필요한 최소 surface만 둔다.
- 불변식은 주석보다 executable test로 남기고, 이유·트레이드오프만 주석으로 설명한다.
- 함수는 한 수준의 추상화를 유지하되 줄 수 자체를 목표로 쪼개지 않는다.
- 중복 제거는 같은 지식이 두 곳에서 바뀔 때 우선한다. 우연히 모양만 같은 코드는 합치지 않는다.
- 오류에는 사용자가 고칠 수 있는 `path`, 기대값, 실제값을 유지한다.
- 구조 리팩터링 커밋과 게임 규칙 변경 커밋을 분리한다.
- 새 module을 추가할 때 deletion test를 한다. 삭제했을 때 복잡성이 호출자 여러 곳으로 퍼지지 않으면
  얕은 pass-through일 가능성이 높다.

## Claude에게 요청할 다음 작업 (Codex 원 제안)

대규모 구현 전에 아래 산출물부터 제안받는 것이 안전하다.

1. 위 목표 구조의 파일별 책임과 허용 import 방향
2. `engine.ts` export 중 실제 외부 interface와 내부 구현의 분류표
3. 기존 스모크 항목을 Vitest 테스트 케이스로 옮기는 계획
4. JSON Schema/TypeScript/runtime validator 단일 정본 선택안과 마이그레이션 비용 비교
5. 동작 변경 없이 수행할 수 있는 첫 번째 구조 이동 커밋의 구체 diff 범위

핵심 제약: 이 프로토타입의 게임 규칙을 "정리하면서 개선"하지 말고, 먼저 동작을 고정한 뒤 구조만
이동한다.

## Claude 검증 및 처리

**독립 재검증 (2026-07-26)** — 보고서를 신뢰하지 않고 직접 재실행:

- `npm run build`: PASS (재확인)
- `npm run smoke`: PASS — 잠금 3모드 완주, 이중 제약 검증기 PASS, 실패 방향 2종(언론 재판/수사반 붕괴)
  모두 도달, 이웃 전파·되돌리기 연쇄 해제·조사 누출 린트 전부 PASS. 보고서 주장과 일치.
- `npm run smoke:datapack`: PASS — 병합·참조 무결성·스키마 enum 동기화(tag/suit/kind/frame/josaKind)
  전부 PASS. 보고서 주장과 일치.
- 라인 인용 표본 대조: `engine.ts`는 실측 1073줄, `resolveAnswer`(판정 로직 시작)가 437행 부근,
  `reduce`/`structuredClone(prev)`가 1052행 부근 — 보고서의 `17-432`/`437-669`/`1051-1052` 인용과
  합치한다. `datapack.ts`는 실측 514줄로 `103-329` 인용 범위 안에 있다.

**작업 트리 메모**: `package.json`의 `smoke`/`smoke:datapack` 스크립트 추가는 실제로 적용되어 있고
그 자체로는 diff가 2줄뿐인 독립적이고 behavior-preserving한 변경이다. 다만 이 파일이 현재
ticket 24(play-screen-build) 작업 중인 다른 미커밋 변경(`app.css`, `CaseScreen.svelte`)과 같은
워킹트리에 나란히 존재한다 — 커밋 시 ticket 24 변경과 분리해 별도 커밋으로 남길 것.

**처리**: 이 보고서가 다루는 승격 구조 결정(도메인 계약 분리, 데이터 팩 정본 통합)은 현재 어느 열린
Wayfinder 티켓도 소유하지 않는다 — [ticket 11](../../.scratch/case-collection/issues/11-core-loop-prototype.md)은
"순수 모듈을 스펙 입력으로 승격 권장"까지만 결의했고 승격 방법은 열어뒀다. 미해결 지식이므로 게임
Wayfinder 맵이 아니라 Claude 인테이크 큐에 등록한다:
[`.scratch/codex-intake/issues/01-core-loop-promotion-follow-up.md`](../../.scratch/codex-intake/issues/01-core-loop-promotion-follow-up.md).

이 문서 자체와 그 처리 절차는 `docs/agents/codex-collab.md`의 "Document handoff" 절로 표준화됐다
(2026-07-26) — 이후 Codex의 분석/리포트형 산출물은 전부 이 형식을 따른다.
