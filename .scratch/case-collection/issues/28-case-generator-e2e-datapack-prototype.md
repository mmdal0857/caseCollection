# case 생성 E2E 데이터팩 프로토타입

Status: open
Labels: wayfinder:prototype
Assignee:
Blocked-by: 18

## Question

고정된 실제 원문 스냅샷 하나를 최종 data pack까지 통과시켜 case 생성 계약의 아직 종이로만 검증된 경계를 실행으로 검증한다.

- `sourceSnapshot → patternEvidence → 승인 후보 patternRecipe` 변환을 최소 한 경로로 구현한다.
- `patternRecipe + storySeed.requires`로 합법 candidate를 결정론적으로 열거한다.
- 실제 sLLM에는 candidate 요약만 전달하고 `candidateId + reason`만 수용한다.
- 별도 표현 생성기에는 확정 truth와 `storySeed`만 전달하고 `presentation` 필드만 수용한다.
- 생성 뒤 삼중 제약·조사 린트·상태 조건 안정성·LLM allowlist·presentation 참조 무결성을 검사한다.
- 최종 취향 필터는 `keep/reject + tasteScore + reasons`만 반환하게 한다.
- 같은 입력과 버전으로 두 번 emit해 candidate 순서, 출력 hash, provenance envelope가 동일한지 확인한다.
- 기존 수제 case data pack과 나란히 smoke를 통과시킨다.

완료 조건은 재현 가능한 실행 명령, 입력 fixture, 최종 `GeneratedCase`, validator 보고서, 두 번의 동일성 비교 결과다.
