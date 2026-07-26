# MCP 기반 맞춤형 case 저작 설계

날짜: 2026-07-27
상태: 사용자 방향 승인, 명세 검토 대기
관련 티켓: `.scratch/case-collection/issues/27-mcp-personalized-case-authoring.md`
선행 설계: `2026-07-27-case-generator-foundation-design.md`

## 1. 목표

사용자가 자신의 LLM 환경에서 취향에 맞는 사건을 주문하고, 검증된 게임 data pack으로 가져올 수 있게 한다.

- 개발·회귀 테스트에는 LM Studio 등 로컬 LLM을 사용한다.
- 실제 고품질 저작에는 사용자가 연결한 Claude 또는 Codex를 사용한다.
- 게임이나 MCP 서버가 공급자 API 키·과금 계정을 소유하지 않는다.
- LLM은 문제와 인터랙션을 다양화하지만, 엔진의 규칙과 유효성 판정을 우회하지 않는다.
- 정적 클라이언트·런타임 LLM 0·버전된 data pack 원칙을 유지한다.

첫 버전의 성공 경험은 “어두운 저택, 증언 중심, 높은 난이도” 같은 주문을 Claude·Codex 대화창에 입력하고, MCP가 검증 가능한 case 초안 작성부터 설치 가능한 pack 산출까지 안내하는 것이다.

## 2. 접근 비교와 선택

### A. Host-driven compiler MCP — 선택

Claude·Codex·로컬 에이전트가 MCP host가 된다. MCP 서버는 catalog와 스키마를 요약해 제공하고, LLM이 제출한 초안을 결정론적으로 검증·정규화·저장한다.

- 장점: 공급자 중립, 게임측 API 키 없음, 사용자가 비용과 권한을 직접 통제, 로컬·원격 모델이 같은 계약을 사용한다.
- 단점: 외부 host의 실제 토큰 상한을 MCP가 직접 강제할 수 없고, 모델별 tool-call 품질 차이를 다뤄야 한다.

### B. Provider adapter를 내장한 생성 서비스 — 보류

MCP 서버가 로컬 OpenAI 호환 endpoint나 Claude·OpenAI API를 직접 호출하고 전체 생성 루프를 지휘한다.

- 장점: 호출량·재시도·모델 라우팅을 서비스가 통제하기 쉽다.
- 단점: 자격증명과 과금 책임, 공급자별 SDK, 서버 운영이 게임측으로 들어온다.

### C. 게임 런타임 실시간 생성 — 제외

플레이 중 LLM이 증언·규칙·정답을 바꾼다.

- 장점: 가장 즉각적인 가변성.
- 단점: 정적 배포 원칙, 재현성, 지연시간, 비용, 안전한 검증과 충돌한다.

따라서 A로 시작한다. B와 C를 지원하기 위한 추상화는 미리 만들지 않는다.

## 3. 시스템 경계

```text
사용자
  ↓ 자연어 요청
Claude / Codex / 로컬 MCP host
  ↓ 구조화된 MCP 호출
case authoring MCP
  ├─ catalog 요약·검색
  ├─ schema와 budget envelope
  ├─ case 초안 검증·정규화
  ├─ 미리보기·receipt
  └─ 명시적 설치
        ↓
버전된 game data pack
        ↓
정적 게임 클라이언트
```

MCP 서버는 LLM이 아니다. 기존 생성기·검증기·pack writer를 에이전트가 안전하게 사용할 수 있도록 감싼 저작 인터페이스다.

게임 런타임은 MCP에 연결하지 않는다. 설치된 동일 data pack은 어떤 LLM이 작성했는지와 무관하게 동일한 규칙 결과를 내야 한다.

## 4. 저작 흐름

### 4.1 요청 고정

사용자의 자연어 취향을 LLM이 다음 `AuthoringRequest`로 정규화한다.

- 분위기, 시대, 소재
- 선호하는 정보 공개 방식과 장애물 종류
- 목표 난이도와 예상 플레이 길이
- 허용할 catalog·patternRecipe 버전
- `maxCases`, `maxCandidates`, `maxResponseBytes` 같은 작업 상한

MCP는 정규화된 요청을 echo하고 `requestHash`를 발급한다. 이후 단계는 이 hash를 참조해 취향이나 입력 버전이 조용히 변하지 않게 한다.

### 4.2 truth 초안

LLM은 요약된 `patternRecipe`, 의미 어휘와 후보 catalog를 사용해 `truth` 초안을 제출한다. MCP는 다음을 기계 검증한다.

- 알려진 측면만으로 풀 수 있음
- 정답 배열의 서사 응집도가 `full`
- 각 실패 방향이 스타터 어휘로 도달 가능
- storySeed의 `requires` 충족
- 참조하는 card·facet·frame·recipe 버전의 존재

실패 시 전체 catalog나 원문을 다시 보내지 않고, 오류 코드·JSON pointer·수정 가능한 제약만 반환한다.

### 4.3 presentation과 obstacle 초안

유효한 `truthHash`가 발급된 뒤에만 LLM이 증언, 추리문 조각, 공개 순서와 선택적 장애물을 작성한다.

MCP는 truth 참조 유효성, 조사 마커, 공개 시점의 도달성, obstacle 해제 전후 소프트락을 검사한다. 첫 버전에서 지원하지 않는 obstacle 종류는 자유형 스크립트로 받아들이지 않고 거부한다.

### 4.4 미리보기와 설치

검증 성공은 곧바로 설치를 의미하지 않는다.

1. `preview`가 사건 요약, 사용 카드, 난이도 지표, 경고와 receipt를 반환한다.
2. 사용자가 대화창에서 설치 의사를 명시한다.
3. `install_case`가 새 ID와 새 버전으로 pack을 기록한다.

기존 base/mod pack의 같은 ID를 덮어쓰는 기능은 첫 버전에서 제공하지 않는다.

## 5. MCP 도구 계약

첫 버전은 다음의 작은 도구 집합을 제공한다.

| 도구 | 상태 변경 | 책임 |
|---|---:|---|
| `get_authoring_capabilities` | 없음 | 지원 스키마·obstacle·상한·버전 반환 |
| `inspect_catalog` | 없음 | token-bounded 의미 어휘·recipe·카드 후보 조회 |
| `estimate_request` | 없음 | 예상 단계·후보 수·응답량과 cache 가능성 계산 |
| `begin_case_draft` | draft 생성 | `AuthoringRequest` 고정, `requestHash` 발급 |
| `validate_truth` | draft 갱신 | truth 검증·정규화, `truthHash` 발급 |
| `validate_presentation` | draft 갱신 | presentation·obstacle 검증 |
| `preview_case` | 없음 | compact preview와 receipt 반환 |
| `install_case` | pack 추가 | 승인된 draft를 새 pack entry로 기록 |

대형 원문·catalog 전체를 한 번에 반환하는 도구와 자유형 코드 실행 도구는 제공하지 않는다. 조회는 pagination, 필드 선택과 응답 byte 상한을 필수로 둔다.

draft 변경은 pack 설치와 분리한다. draft는 폐기 가능한 작업 산출물이며, `install_case`만 게임이 소비할 data pack을 변경한다.

## 6. 토큰과 비용 안전성

### 6.1 강제할 수 있는 것

MCP 서버는 자신이 반환하거나 처리하는 데이터에 다음 상한을 강제한다.

- 페이지당 항목 수와 응답 byte 수
- 한 request의 후보 수·case 수·검증 반복 수
- preview의 문장 수와 진단 수
- 지원하지 않는 무제한 원문 조회 차단
- 동일 hash 입력의 content-addressed cache

`estimate_request`와 모든 검증 도구는 `dryRun`을 지원한다. 고비용 presentation 작성은 truth 검증 이후에만 진행한다.

### 6.2 강제할 수 없는 것

Host-driven MCP는 Claude·Codex 내부 추론 토큰, 시스템 프롬프트, 사용자의 다른 대화량을 관찰하거나 상한 처리할 수 없다. 따라서 MCP의 `estimatedTokens`를 공급자 청구량이나 절대 상한으로 표현하지 않는다.

실제 토큰 수는 host가 제공하는 usage 정보가 있을 때만 receipt에 `reportedUsage`로 기록한다. 없으면 다음 측정값만 기록한다.

- MCP 요청·응답 byte 수
- 반환된 항목·진단 수
- cache hit 여부
- 단계별 호출 수와 경과 시간
- 생성·설치된 artifact hash

### 6.3 기본 안전 정책

- 기본 동작은 조회·dry-run·검증이다.
- 설치는 별도 도구이며 새 entry만 추가한다.
- 큰 요청은 자동 실행하지 않고 축소안을 반환한다.
- validation repair는 전체 재생성보다 국소 수정 진단을 우선한다.
- 동일 입력은 cache를 재사용하고 사용자가 명시하지 않으면 강제 재생성하지 않는다.

## 7. 로컬 LLM과 Claude·Codex의 역할

로컬 LLM 테스트의 주 목적은 고품질 사건 생산량을 증명하는 것이 아니다.

- MCP tool 선택과 인수 채우기
- schema 오류 뒤 국소 repair
- validation loop 종료
- pagination과 byte budget 준수
- 승인 전 `install_case` 미호출
- 실패를 신비화하지 않고 구조화 진단으로 처리

Claude·Codex 평가는 같은 contract fixture를 통과한 뒤 별도 품질 표본으로 수행한다.

- storySeed 취향 충족
- 증언과 추리문 자연스러움
- 반복 표현과 카드 편향
- 생성 완료까지의 host-reported usage
- 로컬 LLM 대비 repair 횟수와 최종 승인율

로컬과 원격 모델은 동일 MCP 도구와 schema를 사용하며, 모델별 전용 data pack 포맷은 만들지 않는다.

## 8. 오류 처리와 복구

모든 오류는 안정적인 코드와 수정 범위를 제공한다.

- `schema_invalid`: JSON pointer와 기대 타입
- `reference_missing`: 누락 ID와 허용된 조회 도구
- `truth_unsolvable`: 실패한 gate와 최소 반례
- `coherence_incomplete`: 끊긴 슬롯 관계
- `story_requirement_unmet`: 불충족 `requires`
- `josa_literal_leak`: 문제 조각과 필요한 조사 마커
- `obstacle_softlock`: 막힌 상태와 공개 시점
- `budget_exceeded`: 요청 상한과 축소 가능한 값
- `stale_draft`: 기대 hash와 현재 hash

오류 응답은 원문 전체를 반복하지 않는다. 같은 오류가 정해진 repair 횟수를 넘으면 MCP는 자동 반복을 멈추고 사용자 판단이 필요한 요약을 반환한다.

## 9. 보안과 권한

- MCP 서버는 LLM 공급자 자격증명을 받거나 저장하지 않는다.
- catalog와 source snapshot은 허용된 프로젝트 경로만 읽는다.
- draft는 전용 작업 디렉터리에 쓰고 path 인수를 직접 파일 경로로 해석하지 않는다.
- `install_case`는 스키마 검증을 다시 실행하고 새 pack entry만 원자적으로 추가한다.
- 자유형 shell, Ren'Py, JavaScript, 프롬프트가 삽입한 경로를 실행하지 않는다.
- receipt에는 프롬프트 원문이나 비밀 값을 남기지 않고 hash와 계측값만 기록한다.

## 10. 검증 전략

### 결정론적 contract test

- 각 도구의 정상·오류 schema
- pagination과 byte 상한
- hash 고정과 stale draft 거부
- truth 삼중 제약과 조사 린트
- obstacle 소프트락
- dry-run 무변경
- install의 append-only와 재검증
- cache hit의 결과 동일성

### 로컬 LLM 시나리오

고정된 3개 요청을 사용한다.

1. 단순 분위기 변형, obstacle 없음
2. 증언 중심 사건, 지원되는 `falseClaim` 하나
3. 일부러 존재하지 않는 facet을 요구해 repair 유도

각 시나리오는 최대 호출 수 안에 preview까지 도달해야 하며, 설치는 명시적 승인 fixture가 있을 때만 성공해야 한다.

### Claude·Codex 실측

동일 요청·동일 catalog snapshot·동일 응답 상한으로 각각 최소 3회 실행한다. host가 usage를 제공하면 기록하고, 없으면 MCP byte/call receipt만 비교한다. 품질 평가는 엔진 통과 여부와 사람의 취향 적합성 평가를 분리한다.

## 11. 초기 구현 범위와 비범위

### 범위

- MCP stdio 서버
- 기존 case schema·validator를 감싼 도구 계약
- token-bounded catalog 조회
- draft hash·cache·receipt
- dry-run, preview, append-only install
- 로컬 LLM contract fixture
- Claude·Codex 수동 실측 절차

### 비범위

- 게임 UI 내부의 LLM 버튼
- MCP 서버 내장 공급자 SDK와 API 키 관리
- 플레이 중 실시간 생성
- 자유형 게임 규칙·스크립트 생성
- 여러 사람이 공유하는 원격 MCP 서비스
- 자동 게시·배포
- 실제 provider token을 관찰하지 못하는 환경에서의 비용 보장

## 12. 성공 기준

- 동일 MCP 서버에 로컬 LLM, Claude, Codex가 별도 포맷 없이 연결된다.
- 로컬 fixture가 schema repair, validation loop, budget gate와 설치 승인 경계를 재현한다.
- 유효하지 않은 truth·presentation·obstacle은 설치할 수 없다.
- 조회와 preview가 선언된 byte·항목 상한을 넘지 않는다.
- 승인 전에는 game data pack이 바뀌지 않는다.
- 설치 결과는 버전·입력 snapshot·request·truth·artifact hash로 역추적할 수 있다.
- Claude·Codex 실측에서 실제 usage를 받을 수 없는 경우 이를 추정치로 위장하지 않는다.
- 생성된 pack을 로드한 정적 게임은 MCP나 LLM 없이 동일하게 동작한다.
