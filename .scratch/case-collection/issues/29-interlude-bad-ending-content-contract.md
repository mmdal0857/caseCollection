# 인터루드·BAD 엔딩 콘텐츠 생성 규약

Status: open
Labels: wayfinder:grilling
Assignee:
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
