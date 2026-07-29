# 작업 진행 전 티켓 종결 프로그램 설계

날짜: 2026-07-28  
상태: 사용자 권고 설계 승인, 구현 계획 작성 전  
관련 티켓: 14, 16, 21, 22, 23, 28, 29, 30  
승인: 사용자, 2026-07-28

## 1. 목표와 범위

로컬 Wayfinder 트래커에서 `Status: open`이고 `Assignee:`가 비어 있으며 모든
블로커가 닫힌 티켓 8건을 종결한다.

- 데이터·생성: 14, 16, 28, 29
- 화면·런: 21, 22, 23
- 오디오: 30

다음 항목은 이 프로그램에 포함하지 않는다.

- 27번은 이미 다른 Codex 세션에 배정돼 있으므로 소유권을 침범하지 않는다.
- 10001번은 의도적으로 `Status: deferred`인 후순위 대기 티켓이다.
- 08이 MVP 밖으로 정한 14·16·18 계열을 MVP 런타임 의존성으로 되돌리지 않는다.
- 10에서 기각된 수사 포인트 화폐, 인터루드 진열 구매, 완주팩, 힌트
  크래프팅을 되살리지 않는다.
- 런타임 LLM, 서버 저장, 신규 카드 분량 확장은 도입하지 않는다.
- 격리된 case 생성기 워크트리를 자동으로 main에 병합하지 않는다.

종결의 뜻은 티켓마다 다르다.

- `wayfinder:grilling`: 실행 가능한 계약과 수용 조건을 `## Resolution`로 확정한다.
- `wayfinder:prototype`: 계약을 실제 코드 또는 화면으로 검증하고 결과를
  `## Resolution`에 남긴다.
- 모든 티켓은 트래커의 close-time housekeeping과 검증을 통과해야 한다.

## 2. 선택한 접근과 순서

의존성 우선으로 다음 네 파동을 순차 실행한다.

1. 데이터 계약: 16 → 14
2. 플레이 흐름과 표현: 22 → 21 → 23
3. 생성 검증: 28 → 29
4. 오디오: 30

16이 팩 경계를 먼저 고정해야 14의 추출 결과와 28의 `GeneratedCase`, 29의
인터루드·엔딩을 같은 산출물로 검증할 수 있다. 22가 화면 그래프와 인터루드
행동을 먼저 정해야 21의 플레이 중 노트 진입점과 29의 인터루드 계약이
흔들리지 않는다. 23은 정보 위계와 화면 구성이 정해진 뒤 이를 섬기는
시각 언어를 만든다.

각 파동은 독립 검증 후 닫는다. 뒤 티켓의 구현이 앞 티켓의 결정을
반증하면 앞 티켓을 조용히 우회하지 않고 같은 세션에서 ripple note를 남기고
계약을 개정한다.

이 범위는 하나의 구현 계획으로 실행하기에는 크므로 승인 뒤 `writing-plans`
산출물도 네 파동별 문서로 나눈다. 각 계획은 앞 파동의 실제 검증 결과를
입력으로 받고, 네 계획을 동시에 작성해 오래된 가정을 고정하지 않는다.

## 3. 공통 경계

### 3.1 빌드타임과 런타임

빌드타임 도구가 원문·sLLM을 사용해 정적 게임 데이터 팩과 오디오 자산을
만든다. 브라우저 런타임은 완성된 팩과 자산만 읽는다.

```text
원문 스냅샷
  → 측면·태그·패턴 근거 추출
  → 기계 검증
  → case 후보 선택·표현 생성·취향 필터
  → game-data-pack JSON
  → 정적 Svelte 게임
```

브라우저에는 API 키, 모델 호출, 원문 파일 경로가 들어가지 않는다.

### 3.2 데이터 정본

- 팩 외형의 정본: `schema/game-data-pack-v2.json`
- 교차 필드·게임 규칙 정본: TypeScript의 명명된 불변식 검사
- 게임 용어 정본: `CONTEXT.md`
- 결정 정본: 각 티켓의 `## Resolution`
- `MAP.md`: 결정의 한 줄 색인

JSON Schema와 런타임 형태 검증의 이중 구현 드리프트를 막기 위해 JSON
Schema를 실제로 실행한다. Ajv standalone validator를 빌드타임에 생성해
브라우저에는 생성된 순수 검증기만 포함한다. TypeScript는 JSON Schema가
표현하기 어려운 참조·솔버빌리티·조사 린트만 담당한다.

현재 `game-data-pack@1`은 `additionalProperties: false`이므로 새 envelope
필드를 같은 버전에 추가하지 않는다. 이 프로그램의 계약은
`game-data-pack@2`다. v1 base는 migration command로 v2를 생성해 해시를
검증한 뒤 교체한다. 외부 v1 팩은 추측으로 병합하지 않고
`LEGACY_PACK_REQUIRES_MIGRATION`으로 거부한다.

### 3.3 출처와 재현성

모든 생성 산출물은 다음 provenance를 가진다.

- 입력 스냅샷 ID와 SHA-256
- pattern recipe ID와 버전
- 모델 ID, 프롬프트 버전, seed, 생성 파라미터
- 원시 모델 응답 SHA-256
- 검증기 버전
- 정규화된 출력 SHA-256

JSON은 키 정렬·UTF-8·LF·고정 숫자 표현으로 canonicalize한 뒤 해시한다.
동일 fingerprint의 단계는 캐시를 재사용하며, 입력이나 버전이 바뀌면 새
산출물을 만든다. 기존 산출물을 제자리에서 바꾸지 않는다.

## 4. 티켓 16 — 외부 데이터 팩 로드

### 4.1 팩 계약

base와 외부 팩은 `game-data-pack@2` envelope를 공유한다. 외부 팩은
다음 병합 모드 중 하나를 반드시 선언한다.

- `alongside`: 기본값. 새 콘텐츠를 병기한다. 모든 콘텐츠 ID는
  `<packId>.` 접두사를 사용해야 하며 어떤 충돌도 오류다.
- `promotion`: 수제 또는 이전 콘텐츠를 명시적으로 승격한다.
  `promotionTargets[]`에 `kind + id + expectedSourcePack`을 열거한 항목만
  상쇄할 수 있다. 목록에 없는 충돌은 오류다.

팩 순서는 base 다음 사용자가 정한 외부 팩 순서다. promotion target은 바로
앞 결과에 존재해야 하고 예상 source pack과 일치해야 한다. 이 규칙으로
우연한 동명 ID가 조용히 정답 카드를 덮어쓰는 일을 막는다.

### 4.2 검증 단계

로드는 다음 단계를 건너뛰지 않는다.

1. 파일 크기 상한과 UTF-8 JSON parse
2. format·version·JSON Schema 형태 검증
3. 팩 내부 ID·facet·조사·source link 검증
4. 병합 모드와 충돌 정책 검증
5. 병합 후 참조 무결성·case 솔버빌리티 검증

오류는 `code`, `path`, `message`, `packId`, `severity`를 가진다. 하나라도
`error`가 있으면 그 팩 전체를 적용하지 않는다. 경고만 있는 팩은 사용자가
리포트를 확인한 뒤 적용할 수 있다.

### 4.3 정적 브라우저 UX

설정의 “데이터 팩” 화면에서 `<input type="file" multiple>`로 JSON을 고른다.

1. 파일을 메모리에서 preflight한다.
2. 추가·상쇄·경고·오류 수와 상쇄 대상 목록을 보여준다.
3. 사용자가 확인하면 원문 JSON은 IndexedDB에, 활성 여부와 순서는
   localStorage에 저장한다.
4. 다음 시작부터 base → 활성 팩 순서로 재검증한다.

깨진 외부 팩은 격리하고 base로 계속 시작한다. 오류 리포트에는 해당 팩을
비활성화하거나 다시 선택하는 동작을 제공한다. 누락 아트는 슈트별 기본
실루엣과 텍스트 카드로 폴백하며 게임 데이터 자체를 거부하지 않는다.

MVP 기본 흐름은 외부 팩 UI를 노출하지 않아도 된다. 그러나 loader와 계약은
동일하고, 개발자 플래그 또는 post-MVP 설정 화면이 같은 경로를 사용한다.

### 4.4 수용 조건

- 기존 base 왕복·33건 이상의 datapack smoke가 계속 통과한다.
- alongside의 정상 추가와 충돌 거부가 검증된다.
- promotion의 명시적 상쇄와 미신고 상쇄 거부가 검증된다.
- 미래 format version, 손상 JSON, 끊어진 참조, 누락 아트가 각각 계약대로
  처리된다.
- JSON Schema와 런타임 enum 드리프트가 기계적으로 실패한다.

## 5. 티켓 14 — 원문 기반 측면·태그 추출

### 5.1 입력과 출력

입력은 mutable Drive나 최신 웹 문서가 아니라 고정된 `sourceSnapshot`이다.
스냅샷은 책·이야기·문단 span, 원문 SHA-256, 출처 ID를 가진다.

추출 결과는 다음 세 층으로 나눈다.

- `FacetDraft`: 카드 이름·kind·suit·2~3개 facet 후보와 원문 근거 span
- `PatternEvidenceDraft`: 반복 구조·전형적 단서·장소·변형과 근거 span
- `AxisProfileCandidate`: 기존 축 catalog로 표현되지 않는 경우에만 제안

sLLM은 허용된 `kind`, `suit`, `frame`, `tag` 어휘 안에서만 JSON을
반환한다. 원문 근거가 없는 측면과 태그는 채택하지 않는다.

### 5.2 단서 유형별 매핑 규칙

슈트는 `docs/wiki/clues/<suit>.md`의 파일 분류를 그대로 사용한다. 슈트에서
kind·frame·tag를 자동 추론하지 않는다. 기존 `DRAFT_KIND`·`DRAFT_FRAME`은
초안 표시용일 뿐 승격 규칙이 아니며 제거한다.

- kind: 측면 문구가 가리키는 실체를 `사람 | 사물 | 행위 | 기록 | 현상`
  중 하나로 분류
- frame: 그 측면이 추리문에서 수행하는 역할을
  `route | means | trace | action | motive | record | omission | scene |
  identity` 중 하나로 분류
- tag: 단어의 분위기가 아니라 그 측면을 채택했을 때 생기는 공개된 역학
  결과로 분류

tag 판정 rubric은 다음으로 닫는다.

- `공개`: 정보·행동을 공적 기록이나 다수의 시야에 올린다.
- `은밀`: 노출을 늘리지 않고 접근·관찰·회수를 가능하게 한다.
- `강압`: 위협·힘·압박을 사용해 진술이나 행동을 얻는다.
- `신중`: 증거 보존·절차·검증을 우선해 성급한 결론을 늦춘다.
- `논리`: 모순·시간·인과·배제 관계를 사용해 가능한 해석을 줄인다.

각 facet은 1~2개 tag를 가져야 하며 각 tag마다 원문 근거 span과 rubric
한 줄 설명을 남긴다. 하나의 clue_type이 서로 다른 원문 문맥에서 다른
kind·frame·tag를 가질 수 있으므로 clue_type 전역 정답표는 만들지 않는다.

### 5.3 파이프라인

1. 스냅샷 적재와 fingerprint 계산
2. 결정론적 이야기 span·단서 후보 선정
3. sLLM 구조 추출
4. 근거 span·enum·중복·한국어 조사 린트
5. 기존 engine·facets·scenario로 기계 검증
6. LLM 취향 필터
7. 승인된 팩 emit

취향 필터는 `keep | reject`, `tasteScore`, `reasons[]`만 반환한다. 카드,
facet, truth를 수정할 수 없다. 기계 검증을 통과하지 못한 후보는 취향
필터에 보내지 않는다.

현재 `assemble_cases` STUB는 별도의 생성 규칙을 발명하지 않는다.
티켓 18의 `patternRecipe + storySeed.requires` 후보 열거기를 adapter로
호출하고, 티켓 28이 검증한 선택기·표현기·취향 필터를 거쳐 case를 만든다.
14는 원문에서 facet과 pattern evidence를 만드는 상류 계약, 28은 case
조립의 실행 검증이다.

axis profile은 versioned catalog로 관리한다. 검증된 초기 catalog는 기존
case가 실제로 사용한 `공개 | 논리 | 신중` 3종이다. 추출기는 원문이 기존
세 규칙으로 표현되지 않을 때만 새 후보와 근거를 제안하며 자동 승격하지
않는다. 새 profile은 상태 전이·게이트·도달 가능한 양방향 위험을 검증한
뒤 catalog에 추가한다. 이 방식으로 근거가 생길 때 6~8종까지 자라되 숫자를
맞추기 위한 빈 규칙은 만들지 않는다.

### 5.4 수제 시드와 재생성

수제 base와 추출 결과는 티켓 16의 병합 모드를 사용한다.

- 탐색 중 산출은 `alongside`와 `<packId>.` 접두사
- 검증을 마치고 수제 항목을 대체할 때만 `promotionTargets`

catalog에 책이 추가되면 해당 새 fingerprint의 후보만 생성한다. 그러나 08이
확정한 MVP 24장·4 case 팩은 자동으로 늘지 않는다. 새 후보는 별도 팩에서
검증·승인된 뒤에만 후속 릴리스로 승격한다.

### 5.5 수용 조건

- `scripts/extract_game_data_pack.py`의 STUB 두 단계가 명명된 adapter
  경계로 교체된다.
- 고정 fixture에서 모델 응답 replay가 동일한 canonical output을 만든다.
- 잘못된 enum, 가짜 근거 span, 중복 facet, 조사 누출이 각각 거부된다.
- 수제 base와 alongside/promotion 두 경로가 datapack smoke를 통과한다.
- 모델 실패·timeout·형식 오류는 마지막 유효 팩을 손상시키지 않는다.

## 6. 티켓 22 — run 비트와 화면 그래프

### 6.1 화면 그래프

```text
Boot
  → Home ───────────────→ Collection
     ├─ Continue
     └─ New Run → Briefing
                   → Case: Compose
                   → Case: Review
                   → Clear Feedback
                   → Interlude ──→ 다음 Briefing
                                      └─ Boss Case
                                           → Ending
                                           → Run Summary
                                           → Home
```

`Case: Review`는 별도 라우트가 아니라 `CaseScreen`의 명시적 상태다. 플레이어가
검토를 요청하면 성립·미흡·반증과 약한 고리를 보여주며, 수정하거나 최종
제출할 수 있다. 최종 제출만 case 결과를 확정한다.

case 클리어 직후 그 case에서 사용한 게스트 카드를 보유 상태로 영구화한다.
이는 10과 08이 모두 유지한 학습 축이다. 팩·화폐·상점은 없다.

### 6.2 인터루드 AP

AP는 구매 화폐가 아니라 인터루드 한 장면 안에서만 쓰는 행동 예산이다.
각 인터루드는 고정된 3개 행동을 제시하고 2개를 선택한다. 남은 AP는 다음
인터루드로 이월되지 않는다.

- `recon`: 다음 case의 공개 가능한 배경·frame·위험 방향 하나를 예고
- `interview`: 다음 case에서 사용할 수 있는 게스트 facet 하나를 빌림
- `stabilize`: 현재 공개/강압 실패축 중 하나를 scenario가 정한 한 단계 완화

행동 결과는 다음 truth를 공개하지 않는다. `recon`은 next presentation과
slot 계약의 공개 허용 필드만 읽고, `interview`는 case가 선언한 guest
allowlist만 사용한다. `stabilize`의 값은 자유 숫자가 아니라 game data pack의
단일 tuning 값이다.

### 6.3 실패 예고

실패 예고는 두 층으로 나른다.

- 플레이 중: 20이 정한 배경 상태와 임계 접근 시 커지는 정밀 미터
- 인터루드: 실패 임계 한 단계 전부터 전용 경고 문장과 `stabilize` 선택지

BAD 엔딩은 경고 없이 발생할 수 없다. 미터와 경고는 색뿐 아니라 레이블,
형태, 문장으로도 구분한다.

### 6.4 저장과 재개

`RunSnapshot@1`을 localStorage에 저장한다. 다음 동작 직후 원자적으로
저장한다.

- 카드 배치 확정·연쇄 해제
- 검토 진입·최종 제출
- 인터루드 AP 선택
- 화면 전이
- 컬렉션 영구화

Boot는 snapshot을 schema 검증하고 마지막 완료 동작 다음 상태로 복구한다.
손상되거나 미래 버전인 저장은 격리하고 새 run 선택지를 제공한다. UI에는
이전 checkpoint로 되감는 기능을 제공하지 않는다. 새 run은 기존 run을
덮어쓴다는 확인을 받는다.

### 6.5 첫 진입

저장 데이터가 없으면 Home에서 “새 수사”를 1급 행동으로, “컬렉션”을 2급
행동으로 보여준다. 첫 Briefing은 세계관 설명보다 세 동작만 가르친다:
카드 집기, 측면 고르기, 배치해 확정하기.

### 6.6 수용 조건

- 새 run과 저장 run이 그래프의 모든 비트를 통과한다.
- 검토에서 수정과 최종 제출이 구분된다.
- AP 2회 선택, 비이월, truth 비누출이 검증된다.
- case 클리어 보유 영구화와 BAD 엔딩의 보유 보존이 검증된다.
- 새로고침 후 irreversible action이 중복 적용되지 않는다.

## 7. 티켓 21 — 컬렉션과 수사 노트

### 7.1 데이터 모델

```text
CollectionState
├─ ownedCardIds
├─ knownFacetKeys
└─ rejectedInterpretations
   └─ caseId + slotId + cardId + facetKey + reaction + firstSeenAt
```

진행도 3축은 다음과 같다.

1. 보유 카드 / 현재 팩의 전체 카드
2. 아는 측면 / 보유 카드의 전체 측면
3. 아는 측면 / 현재 팩의 전체 측면

패턴 카드는 같은 화면의 별도 단일 스택으로 둔다. 숫자는 팩에서 계산하며
49장을 하드코딩하지 않는다. MVP base는 20 단서 + 4 패턴이다.

### 7.2 전체 컬렉션

20의 플레이 핸드와 같은 1급 어휘를 사용한다.

- 슈트 4스택
- 가용/보유 상태

보유했지만 모르는 측면은 빈 슬롯으로 보여주며 개수도 숨기지 않는다.
미보유 카드는 실루엣과 슈트만 보이고 측면 문구는 보이지 않는다.
카드를 열면 알려진 측면, 빈 측면 자리, 수사 노트, 줄 그어진 오답 기록을
한 세로 흐름에서 읽는다.

줄 그어진 오답은 실패 목록이 아니라 당시 반응 문장을 보존하는 수집물이다.
같은 case·slot·card·facet 조합은 한 번만 기록해 반복 제출로 노트를
부풀릴 수 없게 한다.

### 7.3 플레이 중 노트

전체 컬렉션과 데이터는 같지만 목적이 다르므로 화면은 분리한다.

- run 밖: 감상·진행도·전체 필터가 있는 전체 화면
- case 중: 현재 보유·대여·가용 카드만 보여주는 읽기 전용 drawer

case 중 drawer는 배치를 변경하지 않으며 닫으면 기존 포커스와 스크롤로
돌아간다.

### 7.4 수용 조건

- 보유, 측면 발견, 게스트 대여, 오답 기록이 즉시 두 화면에 반영된다.
- 진행도 3축이 base와 외부 팩에서 동적으로 계산된다.
- 미해금 측면 수는 보이되 내용은 누출되지 않는다.
- 키보드와 터치로 필터·상세·drawer를 사용할 수 있다.
- 저장·재개 뒤 컬렉션 영구 상태와 run 한정 대여 상태가 섞이지 않는다.

## 8. 티켓 23 — 인터페이스 비주얼 시스템

### 8.1 역할 분리

색의 1급 의미는 역학 태그 5종에 준다. 슈트 4종은 색이 아니라 아이콘,
보더 패턴, 텍스트 레이블로 구분한다. 흑백 또는 색각 이상에서도 슈트와
태그를 식별할 수 있어야 한다.

- 배경: `#14120f` 계열 근흑색
- 본문 ink: `#e8e0d0`
- 금색: 포커스·확정·중요 행동에만 사용
- 태그색: 공개·은밀·강압·신중·논리의 상태 변화에만 사용

플랫 셀 누아르에 맞춰 그라데이션, 유리 효과, 광택 버튼을 쓰지 않는다.
패널은 평면 검정 덩어리, 단일 잉크 보더, 명확한 z-order로 만든다.

### 8.2 타이포와 간격

- 디스플레이: 번들 가능한 한국어 세리프 또는 시스템 세리프 폴백
- 본문·버튼·수치: Pretendard 계열과 시스템 산세리프 폴백
- 추리문: 본문보다 한 단계 크고 행간을 넓힌 독립 스케일
- 빗금 조사 `이/가` 등: 주변 문장보다 작게 하되 baseline과 클릭 영역 유지

4px 기반 간격 토큰을 사용하고 카드 148×206을 핵심 고정 단위로 둔다.
이름과 조사는 하나의 인라인 덩어리로 렌더해 flex gap이 끼지 않게 한다.
인라인 선행 공백에 의존하지 않는다.

### 8.3 모션 어휘

움직이는 것은 의미가 바뀌는 요소뿐이다.

- 카드 집기·놓기
- 측면 확정
- 앞→뒤 전파
- 되돌림에 따른 연쇄 해제
- 실패 임계 접근에 따른 미터 승격

hover, 패널 등장, 장식 배경은 계속 움직이지 않는다. 기본 전이는
120~220ms이며 연쇄만 60ms 간격으로 순서를 보인다. `prefers-reduced-motion`
에서는 위치 이동을 제거하고 즉시 상태·opacity 변화로 대체한다.

### 8.4 화면 기준

데스크톱 기준 1280×720에서 추리문이 첫 화면의 주인공이어야 한다.
1024px 폭까지 기능을 유지하고 더 좁은 터치 화면에서는 핸드와 노트를
drawer로 접는다. 포커스 링, 44px 터치 목표, 텍스트 대비를 보존한다.

### 8.5 수용 조건

- 슈트와 태그가 색 없이도 구분된다.
- 카드 확정·전파·해제가 모션 순서만으로도 읽힌다.
- reduced motion에서 게임 상태와 타이밍 결과가 동일하다.
- 1280×720, 1024×768, 좁은 터치 폭에서 주요 행동이 가려지지 않는다.
- 한국어 조사 병기와 카드명이 끊기거나 잘못 띄어쓰이지 않는다.

## 9. 티켓 28 — 실제 원문·sLLM E2E 프로토타입

### 9.1 작업 위치와 입력 fixture

구현과 검증은 `.worktrees/case-generator-shape`에서 계속한다. main 병합은
프로토타입 수용 조건을 모두 통과한 뒤 별도 통합 판단으로 남긴다.

고정 입력은 OUT의 `raw_texts/204.txt`, Project Gutenberg 204
*The Innocence of Father Brown* 중 “The Invisible Man” 이야기 span이다.
fixture에는 전체 mutable 파일 경로가 아니라 다음을 커밋한다.

- `pg_id: 204`
- 이야기 시작·끝 anchor
- 사용한 문단과 문단별 SHA-256
- 원문 전체 SHA-256
- 추출 날짜와 source revision

### 9.2 세 모델 경계

OpenAI-compatible localhost adapter 하나를 사용하되 호출 역할을 분리한다.

1. 선택기: candidate 요약 → `candidateId + reason`
2. 표현기: 확정 truth + storySeed → `presentation`
3. 취향 필터: 완성 요약 → `keep/reject + tasteScore + reasons`

각 응답은 JSON Schema와 allowlist를 통과해야 한다. 모델은 candidate payload,
truth, ID, provenance를 수정할 수 없다.

### 9.3 live와 replay

`--live`는 LM Studio에 seed·temperature 0·고정 prompt version으로 요청하고
원시 응답 transcript를 저장한다. `--replay`는 transcript만 읽어 이후 단계를
재현한다.

결정론의 정본 검증은 같은 transcript로 두 번 emit한 canonical output의
동일성이다. live 모델이 같은 seed에서도 문장 공백을 달리할 수 있으므로
모델 네트워크 호출 자체를 빌드 재현성의 경계로 삼지 않는다. 새 live
응답은 새 provenance를 가진 검토 후보이고, 승인된 transcript가 정적 팩의
입력이다.

### 9.4 검증 보고서

최종 보고서는 다음을 각각 PASS/FAIL과 근거 path로 기록한다.

- pattern evidence → recipe 승인 경로
- 결정론적 candidate 순서와 fingerprint
- 삼중 제약
- 조사 린트
- 조건부 solution 배치 시점 동결
- 모델 allowlist
- presentation 참조 무결성
- taste filter 권한 제한
- 기존 수제 case와 병기한 datapack smoke
- 두 replay emit의 output hash와 provenance hash

### 9.5 수용 조건

티켓 본문의 다섯 산출물인 실행 명령, 입력 fixture, 최종 `GeneratedCase`,
validator 보고서, 동일성 비교 결과가 모두 저장된다. live 실행을 한 번
성공시키고 replay emit 두 번이 byte-identical해야 한다. 기존 core smoke,
datapack smoke, TypeScript, Vite build도 통과해야 한다.

## 10. 티켓 29 — 인터루드·BAD 엔딩 콘텐츠 계약

### 10.1 팩 위치

`game-data-pack@2`에 다음 선택 필드를 둔다.

- `interludes: InterludeDefinition[]`
- `endings: EndingDefinition[]`

둘 다 팩의 공통 provenance를 상속하고 항목별 생성 provenance를 추가한다.
외부 팩 병합은 ID 단위로 티켓 16의 alongside/promotion 규칙을 따른다.

### 10.2 인터루드

`InterludeDefinition`은 `afterCaseId`, `beforeCaseId`, AP budget,
세 행동, 조건, presentation을 가진다. 행동 종류는 티켓 22의
`recon | interview | stabilize`로 닫는다.

생성기는 아직 공개되지 않은 `truth`를 입력으로 받지 않는다. 이전 case의
공개된 tag·축 이동, 알려진 facet, storySeed의 공개 허용 필드,
`presentation`, provenance만 받는다. 다음 case에서는 presentation의
`foreshadowAllowlist`만 받는다.

### 10.3 BAD 엔딩

`EndingDefinition`은 임의의 서사 조건이 아니라 엔진의 도달 가능한 실패
규칙 ID를 참조한다.

- 공개 과다 → 언론 재판 계열
- 강압 과다 → 수사반 붕괴 계열

각 ending은 trigger, 한 단계 전 warning beat, presentation, provenance를
가진다. 실제 도달 가능한 상태가 없는 ending은 팩에 들어갈 수 없다.

### 10.4 누출 방지와 기계 검증

자연어에서 비밀을 추측해 잡는 휴리스틱 대신 데이터 흐름을 제한한다.

- 표현기의 입력에서 미공개 truth를 제거한다.
- 템플릿 변수는 공개 allowlist path만 사용할 수 있다.
- validator는 모든 참조 path의 공개 등급과 출처를 검사한다.
- 고정 문장도 생성 transcript의 입력 필드 목록을 provenance에 남긴다.

추가 검사는 도달성, warning 선행, 조사 린트, case·facet·action 참조,
동일 입력 replay hash다.

### 10.5 최소 예시

팩에는 다음 두 fixture를 포함한다.

- 정상 interlude: 이전 선택 회수 + `recon/interview/stabilize` 3선 2택
- 도달 가능한 공개 과다 BAD ending: warning beat 후 trigger

강압 과다 ending은 같은 스키마와 reachability test로 검증하되 별도
표현 fixture를 하나 더 둔다.

### 10.6 수용 조건

- 입력/출력 스키마와 두 fixture가 datapack 검증을 통과한다.
- 미공개 truth path를 참조한 interlude가 실패한다.
- 도달 불가 ending과 warning 없는 ending이 실패한다.
- 같은 transcript의 두 emit이 byte-identical하다.
- 런 화면에서 22의 그래프와 AP 행동으로 재생 가능하다.

## 11. 티켓 30 — MVP 오디오

### 11.1 포함 범위

MVP에 보이스는 넣지 않는다. 오디오는 다음으로 제한한다.

- title/home용 instrumental loop 1곡
- case/run용 instrumental loop 1곡
- 의미 전달 SFX 7종:
  card pick, card place, facet lock, chain release, review pass,
  review fail, interlude action

일반 hover마다 소리를 내지 않는다. UI click은 위 7종으로 의미가 전달되지
않는 1급 navigation에만 기존 click 계열을 선택적으로 재사용한다.

### 11.2 재사용 경계와 라이선스

Dead Letters의 완성 음원·프롬프트·세계관 자산은 재사용하지 않는다.
초기 로컬 ACE-Step/Stable Audio 후보 18개는 기계 QA를 통과했으나 사람
청감에서 실제 사용이 어려운 품질로 반려해 승격하지 않는다.

- BGM: Higgsfield `sonilo_music` (Sonilo Music)
- SFX: Higgsfield `seed_audio` (Seed Audio 1.0, 48 kHz WAV)

Higgsfield Terms of Use §4.4는 output의 상업 사용을 제한하지 않지만 입력과
출력의 권리 확인 책임은 사용자에게 둔다. 매 릴리스 전에 최신 조건을 다시
확인한다.
`https://higgsfield.ai/terms-of-use-agreement`

### 11.3 자산 manifest와 품질 게이트

`audio-manifest`는 id, 역할, prompt, provider, model, model version,
license, nullable seed, Higgsfield generation ID/URL, duration, target
formats, SHA-256, loudness, human pick을 기록한다. 선택한 모델이 seed를
노출하지 않으므로 값을 발명하지 않고 `seed: null`로 기록한다.

생성 WAV를 보관용 원본으로 두고 웹에는 OGG와 MP3 두 형식을 제공한다.
기계 게이트는 길이, 무음, clipping, peak, integrated loudness, loop
경계 click을 검사한다. 곡·음색·세계관 적합성은 사람이 실제로 듣고
`humanPick`을 기록해야 통과한다.

### 11.4 런타임

브라우저 autoplay 제한을 지켜 첫 사용자 gesture 뒤 AudioContext를 연다.
설정에 master/music/sfx volume과 mute를 두고 localStorage에 저장한다.
오디오 decode 실패는 무음으로 폴백하며 게임 진행을 막지 않는다.
탭이 background로 가면 BGM을 pause 또는 감쇠하고 복귀 시 중복 재생하지
않는다.

### 11.5 수용 조건

- 2개 loop와 7개 SFX가 manifest·라이선스·human pick을 가진다.
- OGG/MP3 decode와 loop 경계, mute·volume 저장이 브라우저에서 검증된다.
- 오디오를 끄거나 decode가 실패해도 모든 게임 상태가 동일하다.
- 보이스 파일·Dead Letters 완성 음원·런타임 생성 의존성이 없다.

## 12. 오류 처리 원칙

- 외부 팩 오류: 해당 팩만 격리하고 base로 계속 시작
- 저장 오류: 손상 snapshot을 보존해 진단 가능하게 하고 새 run 제공
- sLLM 오류: transcript 후보를 만들지 않고 마지막 승인 팩 유지
- 생성 validator 오류: 부분 emit 금지
- 오디오 오류: 무음 폴백, 게임 상태 불변
- 격리 워크트리 충돌: main 또는 다른 작업자의 변경을 덮지 않고 중단

사용자에게 보이는 오류는 해결 행동을 함께 제공한다. 개발자 상세에는
비밀값이나 로컬 인증 정보를 넣지 않는다.

## 13. 검증 전략

### 13.1 변경 전 기준선

main과 case 생성기 워크트리에서 각각 다음 기준선을 기록한다.

- core smoke
- datapack smoke
- `tsc --noEmit`
- Vite build
- 현재 git status와 소유권

### 13.2 자동 검증

- 팩 schema·병합·무결성·promotion tests
- 추출 fixture replay·근거 span·lint tests
- run reducer·저장 migration·AP tests
- collection progression·오답 dedupe tests
- generator live 1회 + replay 동일성 2회
- interlude/endings reachability·truth taint tests
- audio manifest·loudness·decode checks

### 13.3 브라우저 검증

- 1280×720, 1024×768, 좁은 터치 폭
- 새 run, continue, case review, clear, interlude, boss, ending
- 전체 컬렉션과 case 중 노트
- 키보드 포커스, 터치 목표, reduced motion
- 새로고침·손상 저장·오디오 차단

텍스트 상태는 DOM·접근성 트리로 확인하고, 위계·겹침·모션은 실제 렌더와
스크린샷으로 확인한다.

## 14. 티켓별 완료 증거

| 티켓 | 결정·구현 증거 | 검증 증거 |
|---|---|---|
| 16 | 팩 계약, loader, static import UX | schema/merge/integrity smoke |
| 14 | 추출 adapter와 replay fixture | 근거·lint·promotion tests |
| 22 | 화면 그래프, AP, snapshot reducer | run 전 구간·재개 tests |
| 21 | collection state와 두 화면 | 진행도·누출·접근성 검증 |
| 23 | token·component·motion 적용 | viewport·reduced-motion QA |
| 28 | live transcript, GeneratedCase, report | 두 replay hash + 전체 build |
| 29 | interlude/endings schema와 fixture | taint·reachability tests |
| 30 | manifest, 2 BGM, 7 SFX | license·audio QA·browser playback |

각 행의 두 증거가 모두 있어야 티켓을 닫는다. 문서만 있는 prototype 티켓,
코드만 있고 Resolution이 없는 grilling 티켓은 완료로 보지 않는다.

## 15. 통합과 트래커 정리

각 티켓을 닫을 때 다음을 순서대로 수행한다.

1. 티켓에 `Reviewed-by:`를 추가하고 Codex 잠정 결정이면 비워 둔다.
2. `## Resolution`에 결정과 실제 검증 결과를 기록한다.
3. `Status: closed`로 바꾼다.
4. `CONTEXT.md` 용어 변경 여부를 확인한다.
5. 다른 티켓과 지도 fog에 ripple을 반영한다.
6. 최신 `MAP.md`를 다시 읽고 한 줄 색인을 갱신한다.
7. 이 작업과 무관한 dirty file을 stage하지 않는다.

프로젝트 규칙상 Codex가 작성한 설계 결정은 Claude의 4점 검토 전까지
잠정이다. closed 티켓의 빈 `Reviewed-by:`는 검토 대기 상태를 명시하며,
그 위에 새 스펙을 쌓기 전에 기존 결정 정합·용어·dead pointer·수용 조건을
Claude가 재검토해야 한다.

커밋, 브랜치 병합, push는 각각 별도 사용자 승인 없이는 수행하지 않는다.
