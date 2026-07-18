# 문맥 태그 의미론 설계

Status: open
Labels: wayfinder:grilling
Assignee:
Blocked-by: 11

## Question

[코어 루프 확정](03-core-loop.md)의 독창 메커닉 — 문맥 태그 시스템 — 의 세부 설계. 배경 상태의 변수 집합(무엇이 상태인가), 태그×상태 조합식의 형태(평가 규칙을 빌드타임 생성이 만들 수 있는 표현으로), 오답이 일으키는 상태 오염의 종류, 인터루드 이벤트의 트리거 테이블과 BAD 엔딩 비중을 확정한다. 위키의 정성 데이터(trope_tags, clue 카테고리, 인물 문자열)가 태그의 원천이 될 수 있는지 매핑 포함. [코어 루프 프로토타입](11-core-loop-prototype.md)의 체감 피드백을 재료로 한다. /grilling + /domain-modeling — 확정 용어는 `CONTEXT.md`에 반영.
