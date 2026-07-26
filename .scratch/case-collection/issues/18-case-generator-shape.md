# case 생성 파이프라인의 형태

Status: closed
Labels: wayfinder:grilling
Assignee: Codex (GPT-5.6, 2026-07-27)
Blocked-by: 25

## Question

빌드타임 case 생성기의 형태 확정 — 게임 필수 요구([03](03-core-loop.md))이자 빌드 체인 ②단계([07](07-module-packaging.md))의 심장. 확정할 것:

- **조합 구조**: case_pattern 골격 × story 소재풀을 어떻게 조합하는가. OUT `episode_generator.py`가 참고 원형([06](06-core-boundary.md)) — 게임측 재구현의 범위.
- **가변축 선택**: 재사용 풀 6~8종([12 §5](12-context-tag-semantics.md))에서 case별 축을 고르고, 그 축의 측면 게이팅 규칙까지 정합하게 출력하는 방법.
- **슬롯 출력**: 슬롯마다 `frame`/`accepts`(03 재개정 요건) + 측면이 붙은 정답 카드 매핑.
- **삼중 제약 검증**([17](17-context-semantics-prototype.md)에서 이중→삼중 확장):
  ① 풀 수 있음 — *플레이어가 아는 측면만으로*(게스트 대여 포함) 솔버빌리티
  ② 정답이 이야기로 성립 — 정답 배열의 서사 응집 full
  ③ **각 실패 방향이 스타터 어휘만으로 도달 가능**(17 발견 — 강압 측면이 전부 비명백이면 "죽는 방향 둘"이 초반엔 하나가 된다)
- **파이프라인 결합**: sLLM 대량 생성 → 엔진 기계 검증 → LLM 취향 필터(12 §8)에서 검증기가 끼는 지점. 검증기의 실체는 프로토 v10 순수 모듈(`facets.ts`의 `facetStatus` + `smoke.ts`의 `checkSolvable`/`checkCoherent`)이 이미 스모크로 증명([17](17-context-semantics-prototype.md) B) — 이를 승격하는 형태.

인터루드 이벤트·BAD 엔딩 콘텐츠 생성은 이 티켓의 결과에 따라 별도 구체화(지도 fog 참조).

## Comments

- 2026-07-23 **출력 규약 추가 예고 — 조사 중립화([19](19-josa-leak-neutralization.md))**: 생성기는 추리문 조각에 **리터럴 조사를 금지**하고 슬롯별 조사 마커(이가/을를/은는/으로/와과 유형)를 데이터로 방출해야 한다 — 렌더러가 배치된 카드명으로 해석(빈 슬롯은 병기형). 근거: 정적 조사는 정답 받침을 누출하고, 문맥 조건부 정답 슬롯에서는 저작 자체가 불가능(boss 조각4 실측). 콘텐츠 검증기에 **조사 린트**(슬롯 직후 조각이 조사 문자로 시작하면 FAIL) 추가 — 삼중 제약과 같은 층위의 기계 검증. 상세 플랜은 19 Resolution.
- 2026-07-27 **조합 구조 방향 승인 — 조립 코어 우선, story 구속은 별도 층으로**: `casePattern`과 story를 A(순수 플레이버)·B(story별 카드 풀) 중 하나로 고정하지 않는다. case를 `truth / presentation / obstacles`로 분리한다. `casePattern`은 슬롯·frame·측면 관계로 **진실의 골격**을 결정하고, story는 인물·배경에 더해 정보 공개 순서와 선택적 장애물 후보로 **진실이 드러나는 방식**을 결정한다. 둘은 카드 ID가 아니라 `kind / frame / facet / tag` 의미 계약으로 결합한다. 거짓 알리바이·증언 반박 등은 폐기하지 않되 조립 코어를 대체하지 않는 선택적 보조 시스템으로 보관한다. 초기에는 `obstacles: []`를 정상 case로 인정하고, 범용 미니게임 엔진은 만들지 않는다. 상세 설계: `docs/superpowers/specs/2026-07-27-case-generator-foundation-design.md`.
- 2026-07-27 **grill-with-docs 결정 1 — storySeed 제약 분리**: `storySeed`의 의미 요구를 `requires`(사건 논리·공개 순서의 하드 제약, 불충족 후보 폐기)와 `prefers`(소재 적합성·분위기·카드 다양성의 소프트 제약, 유효 후보 순위·LLM 취향 필터 입력)로 분리한다. story가 플레이버로 퇴행하지 않으면서도 하드 제약 과다로 생성 풀이 마르는 것을 피한다. `CONTEXT.md`와 기반 설계에 동시 반영.
- 2026-07-27 **grill-with-docs 결정 2 — 갱신 원문은 버전 고정**: Google Drive에서 계속 갱신되는 소설도 수집 범위에 포함하되, 생성기가 최신본을 직접 읽지 않는다. OUT 수집 단계가 `fileId + modifiedTime/revision + content hash`로 **원문 스냅샷**을 고정하고 위키·generic pack을 재생성한다. 새 버전은 기존 case를 변경하지 않고 새 후보를 만들며, emit case는 입력 스냅샷까지 출처를 역추적할 수 있어야 한다.
- 2026-07-27 **OpenWiki 판단 보류 — 리서치 선행**: 후보→승격 정책을 확정하기 전에 [OpenWiki 수집·위키 보강 적합성 리서치](25-openwiki-collection-fit-research.md)에서 실제 커넥터·증분 갱신·출처 추적·출력 형식·Drive 결합 가능성을 일차 자료로 검증한다. 본 티켓은 그 결과까지 일시적으로 블록된다.
- 2026-07-27 **OpenWiki 리서치 완료 — 좁은 파일럿만 권고**: [OpenWiki 수집·위키 보강 적합성 리서치](25-openwiki-collection-fit-research.md) 결과, 0.2.3은 기존 `rclone → 버전 고정 로컬 스냅샷` 뒤의 비정본 후보 발견 레이어로만 적합하다. Drive 직접 수집·OUT 정본 대체·전체 말뭉치 추출·자동 승격은 부적합. 도입 여부는 대표 소설 2~3권의 `초기 생성 → no-op → 단일 snapshot 변경` 격리 파일럿으로 판단한다.
- 2026-07-27 **grill-with-docs 결정 3 — OpenWiki는 선택적 파일럿**: OpenWiki를 코어 생성 파이프라인의 의존성으로 두지 않는다. [OpenWiki 후보 발견 최소 파일럿](26-openwiki-candidate-discovery-pilot.md)으로 분리해 실행 검증하며, 실패해도 기존 `rclone → 원문 스냅샷 → OUT 위키/generic pack` 경로는 변하지 않는다. 산출물은 **위키 후보**이고 정본 자동 승격은 금지한다.
- 2026-07-27 **grill-with-docs 결정 4 — 패턴 근거와 실행 조립법 분리**: OUT `case_pattern` 원문을 직접 실행하지 않는다. 승인 위키에서 재생성되는 **`patternEvidence`**(전형적 구조·단서·장소·변형+출처)와, 이를 근거로 승인된 버전 고정 **`patternRecipe`**(슬롯 순서·frame·의존 관계·가변축 후보)로 분리한다. 새 원문은 새 recipe 후보를 만들 뿐 기존 recipe와 emit data pack을 제자리 갱신하지 않는다.
- 2026-07-27 **grill-with-docs 결정 5 — 합법 후보를 기계가 먼저 찾는다**: `patternRecipe + storySeed.requires`를 탐색 조건으로 컴파일하고, 엔진이 `frame / kind / 아는·빌린 측면 / gate / needsPrev / 순차 상태`를 만족하는 **합법 후보**를 결정론적으로 열거한다. sLLM은 그 목록 안에서만 `prefers`와 서사를 다루며 목록 밖 카드·측면 ID를 만들 수 없다. 이후 엔진 삼중 검증과 LLM 취향 필터를 별도로 거친다.
- 2026-07-27 **grill-with-docs 결정 6 — 가변축의 규칙과 표현 분리**: 가변축을 재사용 기계 규칙 6~8종인 **`axisProfile`**(태그·범위·임계값·측면 gate)과 case별 **`axisPresentation`**(이름·양극 문구·힌트)으로 분리한다. `patternRecipe`가 허용 profile을 제한하고 `storySeed`가 사건에 맞는 표현을 입히되 새 규칙은 발명하지 않는다. 반복 규칙의 마스터리와 서사 변주의 신선함을 동시에 노린다.
- 2026-07-27 **grill-with-docs 결정 7 — 슬롯 해답은 명시적 solutions[]**: recipe 슬롯은 `frame / accepts / 의미·이웃·상태 요구`만 가지며, emit truth는 `solutions: [{ cardId, facetKey, when? }]`를 방출한다. 상태 조건은 진실을 바꾸는 것이 아니라 현재 증거의 채택 가능성을 표현한다. 도달 가능한 모든 상태에 해답이 있고, 확정 뒤 상태 변화가 기존 해답을 오답으로 뒤집지 않으며, 각 분기가 삼중 제약을 통과해야 한다.
- 2026-07-27 **logic prototype — 결정론적 후보와 상태 조건 검증**: 격리 브랜치 `prototype/case-generator-shape`, commit `2d4f42d`에 순수 로직 모듈과 TUI를 구현했다. 수제 c1~c3·boss를 새 규약으로 이관해 구조 오류 0건, case별 candidate fingerprint 2회 동일, 샘플 후보 삼중 제약 전부 통과, 기존 smoke·data pack smoke·build 통과를 확인했다. 상태 조건을 현재 상태로 계속 재평가하면 c2 `c2s5`, boss `b4`·`b6`에서 확정 답이 뒤집혔고, 배치 시점 채택 결과를 고정하면 뒤집힘이 0건이었다.
- 2026-07-27 **grill-with-docs 결정 8 — LLM은 선택·표현·평가 경계를 넘지 않는다**: sLLM은 엔진이 제공한 합법 candidate 목록에서 `candidateId + reason`만 반환한다. 표현 생성기는 고정 truth를 입력받아 `presentation`만 만들고, 최종 취향 필터는 `keep/reject + tasteScore + reasons`만 반환한다. 카드·측면·슬롯·상태 조건 payload를 LLM이 다시 쓰지 못하며, 허용 목록 밖 ID·truth 참조·payload 변조는 엔진이 폐기한다.
- 2026-07-27 **grill-with-docs 결정 9 — emit 출처 envelope 고정**: `GeneratedCase`는 schema·generator·validator version, source snapshot, pattern evidence, recipe version, story seed, candidate ID와 확정된 `truth / presentation / obstacles`를 함께 방출한다. 동일 고정 입력과 동일 버전에서는 candidate 순서와 emit 결과가 재현되어야 한다.

## Resolution

case 생성기의 형태를 다음 빌드타임 계약으로 확정한다.

```text
버전 고정 sourceSnapshot
→ patternEvidence
→ 승인·버전 고정 patternRecipe
→ storySeed(requires / prefers)
→ 엔진의 결정론적 legal candidate 열거
→ sLLM의 allowlist 내 선택
→ 고정 truth 기반 presentation 생성
→ truth 삼중 제약·조사·상태 안정성 기계 검증
→ LLM 취향 필터
→ provenance를 포함한 GeneratedCase emit
```

case는 `truth / presentation / obstacles`로 나눈다. `truth`는 슬롯별 `solutions[{cardId, facetKey, when?}]`와 재사용 `axisProfile`을 소유하고, `presentation`은 사건별 텍스트와 `axisPresentation`을 소유한다. `obstacles: []`가 정상 기본값이며 장애물은 조립 코어를 보강하는 별도 실험으로 둔다. 조건부 solution은 배치·확정 시점의 채택 결과를 고정해 이후 상태 변화로 정답이 뒤집히지 않게 한다.

엔진은 의미 계약과 런타임 상태를 바탕으로 합법 후보를 결정론적으로 열거한다. LLM은 `candidateId` 선택, 고정 truth의 표현, 취향 평가만 담당하고 truth payload를 수정하지 못한다. 최종 `GeneratedCase`는 원문 snapshot, pattern evidence, recipe version, story seed, candidate, generator·validator version을 보존한다.

격리 logic prototype(`prototype/case-generator-shape`, `2d4f42d`)으로 수제 c1~c3·boss 이관, 명시적 solution 검증, case별 합법 후보, 삼중 제약, candidate fingerprint 재현, LLM allowlist, 조건부 답의 배치시점 고정을 검증했다. TypeScript 검사, 기존 smoke, data pack smoke, build도 통과했다. 세부 결과와 스키마는 `docs/superpowers/specs/2026-07-27-case-generator-foundation-design.md`가 정본이다.

실제 원문 snapshot에서 pattern evidence·recipe를 만들고 실제 sLLM과 최종 emit까지 잇는 경계는 [case 생성 E2E 데이터팩 프로토타입](28-case-generator-e2e-datapack-prototype.md)으로 넘긴다. [OpenWiki 후보 발견 최소 파일럿](26-openwiki-candidate-discovery-pilot.md)은 코어와 격리하고, 인터루드·BAD 엔딩은 [인터루드·BAD 엔딩 콘텐츠 생성 규약](27-interlude-bad-ending-content-contract.md)에서 별도 구체화한다.

검토 후 배제한 방식은 mutable Drive 최신본 직접 소비, OpenWiki 정본·필수 의존화, OUT `case_pattern` 직접 실행, story별 카드 ID 매핑, LLM의 truth 작성, 조건부 답의 live 재평가, case마다 새 축 규칙 생성이다.

초기 `axisProfile` 카탈로그의 정확한 구성과 `prefers` 가중치는 유효성 계약이 아닌 튜닝값이다. logic prototype은 현재 관찰된 3개 profile로 시작해 콘텐츠가 요구할 때 6~8개까지 승인 확장하는 안과 전체 tag 기반 5개 bootstrap 안을 모두 전환 가능하게 제공한다.
