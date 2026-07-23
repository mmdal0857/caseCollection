# case 생성 파이프라인의 형태

Status: open
Labels: wayfinder:grilling
Assignee:
Blocked-by:

## Question

빌드타임 case 생성기의 형태 확정 — 게임 필수 요구([03](03-core-loop.md))이자 빌드 체인 ②단계([07](07-module-packaging.md))의 심장. 확정할 것:

- **조합 구조**: case_pattern 골격 × story 소재풀을 어떻게 조합하는가. OUT `episode_generator.py`가 참고 원형([06](06-core-boundary.md)) — 게임측 재구현의 범위.
- **가변축 선택**: 재사용 풀 6~8종([12 §5](12-context-tag-semantics.md))에서 case별 축을 고르고, 그 축의 얼굴 게이팅 규칙까지 정합하게 출력하는 방법.
- **슬롯 출력**: 슬롯마다 `frame`/`accepts`(03 재개정 요건) + 얼굴이 붙은 정답 카드 매핑.
- **삼중 제약 검증**([17](17-context-semantics-prototype.md)에서 이중→삼중 확장):
  ① 풀 수 있음 — *플레이어가 아는 얼굴만으로*(게스트 대여 포함) 솔버빌리티
  ② 정답이 이야기로 성립 — 정답 배열의 서사 응집 full
  ③ **각 실패 방향이 스타터 어휘만으로 도달 가능**(17 발견 — 강압 얼굴이 전부 비명백이면 "죽는 방향 둘"이 초반엔 하나가 된다)
- **파이프라인 결합**: sLLM 대량 생성 → 엔진 기계 검증 → LLM 취향 필터(12 §8)에서 검증기가 끼는 지점. 검증기의 실체는 프로토 v10 순수 모듈(`facets.ts`의 `facetStatus` + `smoke.ts`의 `checkSolvable`/`checkCoherent`)이 이미 스모크로 증명([17](17-context-semantics-prototype.md) B) — 이를 승격하는 형태.

인터루드 이벤트·BAD 엔딩 콘텐츠 생성은 이 티켓의 결과에 따라 별도 구체화(지도 fog 참조).
