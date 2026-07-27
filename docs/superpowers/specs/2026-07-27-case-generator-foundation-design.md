# Case 생성기 기반 설계

날짜: 2026-07-27  
상태: logic prototype 검증 완료, E2E 원문·LLM 연결 검증 대기
관련 티켓: `.scratch/case-collection/issues/18-case-generator-shape.md`

## 1. 목표

게임의 중심 재미는 플레이어가 다면적인 카드를 배치해 **사건의 설명을 조립하는 것**이다. 거짓 알리바이 파괴, 증언 반박, 정보 은폐 같은 장치는 이 코어를 대체하지 않고 리듬과 반전을 더하는 선택적 보조 시스템으로 둔다.

초기 개발에서는 특정 보조 시스템 하나를 정답으로 고정하지 않는다. 대신 다음을 만족하는 case 생성 기반을 만든다.

- 현재 프로토타입이 검증한 조립 코어를 정본으로 유지한다.
- story가 단순 플레이버에 그치지 않고 정보 공개와 시나리오 구성에 관여할 수 있다.
- 신규 카드와 story를 추가할 때 카드 ID별 수동 매핑을 요구하지 않는다.
- 향후 여러 장애물 형식을 실험할 수 있지만, 아직 존재하지 않는 미니게임을 위한 범용 엔진은 만들지 않는다.

## 2. 선택한 접근

case를 `truth`, `presentation`, `obstacles` 세 층으로 분리한다.

```text
Case
├─ truth: 실제 사건의 논리 구조
├─ presentation: 플레이어에게 보이는 서사와 정보
└─ obstacles: 진실 접근을 방해하는 선택적 장치
```

이는 다음 두 극단을 피한다.

- **순수 플레이버 story**: 카드 재사용성은 높지만 알리바이 조작이나 정보 은폐 같은 시나리오 구성을 표현하지 못한다.
- **story별 카드 ID 배정**: 서사 통제력은 높지만 카드 풀이 story별로 분절되고 자동 확장이 어려워진다.

선택안은 카드 선택에는 의미 계약을 사용하고, story의 구속력은 정보 공개·표현·장애물 구성에 둔다.

## 3. 데이터 경계

### 3.1 `sourceSnapshot`

Google Drive처럼 계속 갱신되는 원문은 생성기가 직접 최신본을 읽지 않는다. OUT 수집 단계가 원문을 다음 메타데이터와 함께 불변 스냅샷으로 고정한 뒤 위키와 generic pack을 재생성한다.

- 원천 파일 식별자
- 원천의 수정 시각 또는 리비전
- 내용 해시
- 스냅샷 식별자

새 원문 버전은 기존 case의 입력을 몰래 바꾸지 않고 새로운 생성 후보를 만든다. emit case는 사용한 원문 스냅샷까지 출처를 역추적할 수 있어야 한다. case 생성기는 Google Drive나 웹 원문을 직접 읽지 않고, 고정된 generic pack만 소비한다.

OpenWiki는 이 경로의 필수 구성요소가 아니다. 별도 격리 파일럿에서 원문 스냅샷으로부터 **위키 후보**를 발견하는 선택적 상류 도구로만 평가한다. OpenWiki 산출물은 OUT 정본·generic pack·case 생성기로 자동 승격하지 않으며, 도입 실패가 코어 파이프라인을 변경하거나 막아서는 안 된다.

### 3.2 `truth`

플레이어가 최종적으로 조립할 실제 사건이다. 현재 프로토타입 v10에서 기계 검증된 구조를 승격한다.

- 승인된 `patternRecipe`의 id와 version
- 슬롯별 `frame`과 `accepts`
- 슬롯별 명시적 `solutions[]` (`cardId + facetKey + 선택적 상태 조건`)
- 이웃 전파와 측면 게이팅
- 고정 상태축과 선택된 `axisProfile`
- GOOD/BAD 판정에 필요한 의미 정보

`truth`는 렌더링 문장이나 특정 미니게임의 UI 상태를 소유하지 않는다.

### 3.3 `presentation`

`truth`를 플레이어에게 어떤 사건으로 보여줄지 정의한다.

- 인물, 장소, 시대·분위기, 범죄 소재
- 최초 공개 정보와 단서 발견 순서
- 증언과 추리문 조각
- 슬롯별 조사 마커
- 선택된 가변축의 `axisPresentation`
- `truth`의 의미 관계를 표현하는 자연어

`presentation`은 카드 ID를 후보군 제한 수단으로 사용하지 않는다. 필요 조건은 `frame`, `facet`, `kind`, tag 같은 의미 어휘로 표현한다.

### 3.4 `obstacles`

조립 과정의 일부 정보나 선택지를 가리거나 왜곡하는 선택적 배열이다. 장애물은 다음 세 요소로 정의한다.

```text
Obstacle
├─ effect: 무엇을 가리거나 왜곡하는가
├─ breakCondition: 어떤 조립 상태로 해제되는가
└─ outcome: 해제 뒤 무엇이 변하는가
```

예상 가능한 종류는 거짓 알리바이, 위조 기록, 신뢰할 수 없는 증언, 숨겨진 카드, 잠긴 슬롯, 상대의 반론 등이다. 이 목록은 아이디어 보관소이지 초기 구현 범위가 아니다.

초기 스키마는 장애물이 없는 `obstacles: []`를 정상 case로 인정해야 한다. 첫 실험 후보는 `falseClaim` 한 종류이며, 별도 대화 게임이 아니라 기존 조립 결과를 제시해 해제하는 형태를 우선 검토한다.

## 4. Case pattern과 story의 관계

OUT `case_pattern` 원문을 실행 규칙으로 직접 사용하지 않는다. 수집 기반 재생성과 검증된 게임 규칙의 안정성을 함께 지키기 위해 두 층으로 나눈다.

- `patternEvidence`: 승인된 위키에서 재생성되는 문학적 근거. 전형적 구조·단서·장소·변형과 원문 스냅샷 출처를 보존한다.
- `patternRecipe`: `patternEvidence`를 근거로 승인된 버전 고정 조립법. 필요한 frame의 순서, 슬롯 간 의존, 가능한 정답 관계, 가변축 후보를 정의한다.

새 원문 스냅샷이나 위키 갱신은 `patternEvidence`를 재생성하고 새로운 `patternRecipe` 후보를 만들 수 있다. 이미 emit된 data pack과 검증된 case가 참조하는 조립법을 제자리에서 덮어쓰지 않는다.

story는 **진실이 드러나는 방식**을 결정한다. 인물·배경뿐 아니라 정보 공개 순서와 선택적 장애물 후보를 제공한다.

둘은 카드 ID가 아니라 의미 계약으로 결합한다.

```text
patternRecipe 요구
  route → means → trace → action

story 요구
  초기에 route 은폐
  record + identity 관계로 은폐 해제 가능

후보 선택
  두 요구를 만족하는 카드·측면 조합을 catalog에서 탐색
```

story가 요구한 의미 계약을 만족하는 후보가 없으면 조합을 억지로 생성하지 않고 해당 후보 case를 폐기한다.

여기서 story는 두 단계로 취급한다.

- `storySeed`: truth 생성 전에 선택한다. 인물·배경·범죄 소재와 함께 의미 제약을 두 층으로 제공한다.
  - `requires`: 사건 논리와 공개 순서가 성립하기 위한 하드 제약. 하나라도 불충족하면 후보를 폐기한다.
  - `prefers`: 소재 적합성·분위기·카드 다양성을 평가하는 소프트 제약. 후보 점수와 LLM 취향 필터의 입력으로 사용한다.
- `presentation`: truth 검증 뒤 생성한다. 확정된 카드·측면 관계를 증언과 추리문으로 구체화한다.

따라서 story는 truth에 영향을 줄 수 있지만, 아직 정해지지 않은 카드 이름을 먼저 박아 넣지는 않는다.

### 4.1 가변축의 규칙과 표현

현재 프로토타입의 `AxisDef`는 기계 규칙과 사건별 표현을 한 객체에 섞어 네 축을 모두 일회성으로 만들었다. 재사용 풀을 실제 학습 대상으로 만들기 위해 다음처럼 분리한다.

- `axisProfile`: 6~8종으로 고정된 재사용 기계 규칙. 축을 미는 태그, 범위·초깃값 규칙, 임계값, 측면 gate를 정의한다.
- `axisPresentation`: case별 이름, 양극 문구, 힌트. 같은 profile을 밀실의 `봉인`, 알리바이의 `증언 일관성`처럼 다르게 표현할 수 있다.

`patternRecipe`는 사용할 수 있는 profile 후보를 제한한다. `storySeed`는 그 안에서 사건과 맞는 profile을 고르고 presentation을 제공하지만, 새로운 기계 규칙을 즉석 생성하거나 profile의 임계값을 바꾸지 않는다. 플레이어는 반복되는 profile을 알아보며 숙달하고, presentation의 변주로 새 사건의 감각을 얻는다.

### 4.2 슬롯 규약과 해답

`patternRecipe`의 슬롯은 의미 계약만 가진다.

```text
SlotRecipe
├─ id / order
├─ frame
├─ accepts
└─ 의미·이웃·상태 요구
```

emit된 `truth`는 실제 해답을 명시한다.

```text
SlotTruth
├─ recipeSlotId
└─ solutions[]
   ├─ cardId
   ├─ facetKey
   └─ when?        # 상태 조건
```

카드 ID만 저장한 뒤 같은 `frame`의 첫 측면을 정답으로 추론하지 않는다. 상태 조건은 사건의 진실을 교체하는 규칙이 아니라 현재 증거가 채택 가능한지를 나타낸다.

검증기는 다음을 보장한다.

- 각 solution의 `cardId`와 `facetKey`가 실제로 존재하고 서로 같은 카드에 속한다.
- facet의 frame과 슬롯 frame이 일치하고 카드 kind가 `accepts`에 포함된다.
- 도달 가능한 모든 상태에서 채택 가능한 solution이 최소 하나 존재한다.
- 배치·확정 뒤 상태가 바뀌어 이미 확정한 solution이 오답으로 뒤집히지 않는다.
- 각 상태 분기별 완성 배열이 삼중 제약을 통과한다.

## 5. 생성 파이프라인

```text
원문 스냅샷 확정
→ OUT 위키·generic pack 재생성
→ catalog 적재
→ patternEvidence 재생성
→ 승인된 patternRecipe 선택
→ storySeed 선택 및 의미 요구 추출
→ patternRecipe 허용 범위에서 axisProfile 선택
→ patternRecipe + storySeed.requires를 탐색 조건으로 컴파일
→ 엔진이 카드·측면 합법 후보를 결정론적으로 열거
→ prefers 점수와 sLLM으로 합법 후보를 선택
→ truth 삼중 제약 기계 검증
→ presentation 생성
→ 선택적 obstacle 생성
→ 전체 기계 검증
→ LLM 취향 필터
→ data pack emit
```

순서상 `truth`를 먼저 만든다. story가 거짓 명제를 자유롭게 쓴 뒤 맞는 카드를 찾는 방식은 생성 실패율이 높고 지정 카드 맞히기로 퇴행하기 쉽다. 검증된 조립 결과로 실제 해제 가능한 표현과 장애물을 역산한다.

엔진은 `frame`, `kind`, 아는·빌린 측면, `gate`, `needsPrev`, 순차 배치 상태와 구조화된 `requires`를 이용해 기존 catalog 안에서 합법 후보를 찾는다. sLLM은 이 후보 목록 안에서만 story 적합성을 비교하고 서사를 구체화하며, 목록에 없는 카드·측면 ID를 생성할 수 없다.

정합성·도달성·조사 누출과 `requires` 충족처럼 결정적으로 판정 가능한 조건은 엔진이 담당한다. `prefers`는 유효성 판정과 분리해 합법 후보 사이의 순위와 LLM 취향 평가에만 영향을 준다. 엔진 탐색을 통과한 합법 후보도 아직 emit case가 아니며, 삼중 제약과 후속 전체 검증을 다시 통과해야 한다.

### 5.1 LLM 입출력 경계

sLLM에는 엔진이 만든 candidate 요약과 `storySeed`만 전달한다. sLLM의 선택 출력은 `candidateId`와 선택 이유뿐이며, 카드·측면·슬롯·상태 조건을 다시 쓰지 못한다. 선택 뒤의 표현 생성기에는 고정된 truth와 `storySeed`를 전달하고 `presentation` 필드만 받는다. 표현 생성기는 슬롯·frame·facet 참조를 새로 만들거나 truth를 바꾸지 못한다. 최종 취향 필터 역시 `keep/reject`, 취향 점수, 이유만 반환한다.

엔진은 모든 LLM 응답의 `candidateId`를 허용 목록과 대조한다. 존재하지 않는 ID, candidate payload 변조, 자유형 카드·측면 ID가 발견되면 결과를 폐기한다. LLM은 합법 후보 사이의 선택과 표현을 돕지만 사건의 진실이나 유효성을 결정하지 않는다.

### 5.2 Emit envelope

최종 출력은 다음 출처와 버전을 포함하는 `GeneratedCase` envelope로 고정한다.

- `schemaVersion`, case `id`
- 사용한 `sourceSnapshotIds`
- 사용한 `patternEvidenceIds`
- `patternRecipeId`와 version
- `storySeedId`, `candidateId`
- `generatorVersion`, `validatorVersion`
- 확정된 `truth`, `presentation`, `obstacles[]`

동일 입력 스냅샷과 동일 generator·validator version에서는 candidate 열거 순서와 emit 결과가 재현되어야 한다.

## 6. 검증 규약

기존 삼중 제약을 `truth`의 필수 게이트로 유지한다.

1. 플레이어가 해당 진행 시점에 아는 측면만으로 풀 수 있다. 게스트 대여 측면을 포함한다.
2. 정답 배열의 서사 응집도가 `full`이다.
3. 각 실패 방향은 스타터 어휘만으로 도달 가능하다.

다음 검증을 함께 적용한다.

- 슬롯 직후 추리문 조각에 리터럴 조사를 금지하고 조사 마커를 요구한다.
- sLLM이 고른 candidate ID가 엔진이 제공한 허용 목록 안에 있어야 한다.
- `presentation`이 참조하는 슬롯·frame·측면이 `truth`에 실제로 존재해야 한다.
- 장애물이 있을 경우 `breakCondition`은 장애물이 등장한 시점에 도달 가능해야 한다.
- 장애물 해제 전후 모두 소프트락이 없어야 한다.
- 장애물은 전체 정답을 대신하지 않고 조립 상태의 일부만 변화시켜야 한다.

장애물 관련 검증은 해당 종류를 실제로 구현할 때 추가한다. 초기부터 모든 예상 종류의 검증기를 추상화하지 않는다.

## 7. 런타임 책임

런타임은 생성된 case를 해석하고 상태를 전이한다.

- `truth`를 이용해 카드 적합성, 측면 상태, 응집도와 결말을 계산한다.
- 상태 조건이 있는 해답은 배치·확정 시점의 채택 가능성을 기록하며, 이후 상태 변화로 이미 확정한 답을 재평가하지 않는다.
- `presentation`을 이용해 현재 공개 가능한 텍스트와 정보를 렌더링한다.
- 존재하는 `obstacles`만 평가해 효과·해제·결과를 적용한다.

런타임은 LLM을 호출해 정답이나 규칙을 즉석 생성하지 않는다. 동일 data pack은 동일 규칙 결과를 내야 한다.

## 8. 초기 구현 범위와 비범위

### 범위

- `truth / presentation / obstacles` 경계가 드러나는 case 출력 규약
- 사용한 원문 스냅샷까지 역추적 가능한 출처 규약
- 장애물이 없는 기존 수제 case를 새 규약으로 표현
- 기존 `facetStatus`, `checkSolvable`, `checkCoherent` 검증 로직 승격
- 의미 계약 기반 결정론적 합법 후보 탐색
- 재사용 `axisProfile`과 case별 `axisPresentation` 분리
- 조사 마커와 조사 린트
- 명시적 슬롯 `solutions[]`와 상태 조건 안정성 검증

### 비범위

- 범용 미니게임 프레임워크
- 능동형 대화 상대 AI
- 모든 장애물 종류의 런타임 구현
- story별 카드 ID 허용 목록
- 생성 시점의 자유형 Ren'Py 또는 UI 스크립트 출력
- 장애물 자체가 사건 해결의 주 루프가 되는 구조
- OpenWiki 자체와 그 파일럿 구현(별도 prototype 티켓)
- OpenWiki 산출물의 OUT 정본 자동 승격

## 9. 성공 기준

- 기존 수제 c1~c3와 boss case를 의미 손실 없이 새 규약으로 표현할 수 있다.
- Drive 원문이 갱신돼도 기존 emit case의 입력 스냅샷과 결과가 재현된다.
- 같은 `patternRecipe`와 story 요구에 대해 서로 다른 유효 카드 조합을 생성할 수 있다.
- 새 `patternEvidence`가 기존 승인 `patternRecipe`를 제자리에서 변경하지 않고 새 version 후보를 만든다.
- sLLM 출력에는 탐색기가 제시하지 않은 카드·측면 ID가 존재할 수 없다.
- 서로 다른 case가 같은 `axisProfile`을 다른 `axisPresentation`으로 재사용해도 기계 판정은 동일하다.
- 런타임은 `frame`에서 정답 측면을 추론하지 않고 emit된 `cardId + facetKey`를 그대로 사용한다.
- 같은 고정 입력과 버전에서 candidate 순서가 결정론적이며 emit case가 원문 스냅샷까지 역추적된다.
- 신규 카드가 의미 계약을 만족하면 story별 매핑 수정 없이 후보가 된다.
- `obstacles: []` case가 현재 코어와 동일하게 작동한다.
- 향후 `falseClaim` 실험을 추가할 때 `truth` 스키마를 변경하지 않아도 된다.
- 모든 emit case가 삼중 제약과 조사 린트를 통과한다.

## 10. 남겨 둔 아이디어

다음은 폐기하지 않지만 별도 프로토타입으로 검증할 항목이다.

- 조립 결과를 거짓 명제에 제시하는 모순 파괴
- 슬롯 잠금이 올바른 조립으로 자동 해제되는 방식
- 잘못된 반박의 비용과 장애물 강화
- 보스 case의 연쇄 반박
- 능동적으로 새 증언을 내놓는 상대

각 아이디어는 “조립의 재미를 강화하는가, 별도 열쇠-자물쇠 게임이 되는가”를 기준으로 평가한다.

## 11. Logic prototype 검증

격리 브랜치 `prototype/case-generator-shape`의 commit `2d4f42d`에서 순수 로직 모듈과 TUI를 만들었다. `prototype/core-loop`에서 `npm run prototype:case-generator`로 두 가지 `axisProfile` 카탈로그와 상태 조건 처리 방식을 전환해 볼 수 있고, `npm run prototype:case-generator:demo`로 고정 검증을 재현한다.

검증 결과는 다음과 같다.

- 수제 c1~c3와 boss case를 `truth / presentation / obstacles: []`로 옮겼으며 구조 오류는 0건이다.
- case별 합법 후보를 결정론적으로 열거했고, 샘플 후보가 모두 삼중 제약을 통과했다.
- 두 번의 독립 실행에서 각 case의 candidate fingerprint가 동일했다.
- sLLM 선택 모의 응답은 candidate allowlist 검증을 통과했다.
- 상태 조건을 현재 상태로 계속 재평가하면 c2의 `c2s5`, boss의 `b4`·`b6`에서 확정 답이 뒤집혔다. 배치 시점 채택 결과를 고정하면 뒤집힘은 0건이었다.
- TypeScript 검사, 기존 smoke, data pack smoke, Vite build가 모두 통과했다.

아직 검증하지 않은 경계는 실제 `sourceSnapshot → patternEvidence → patternRecipe` 변환, 실제 sLLM·취향 필터 연결, 최종 `GeneratedCase` E2E emit이다. 이는 별도 E2E prototype 티켓에서 검증한다.
