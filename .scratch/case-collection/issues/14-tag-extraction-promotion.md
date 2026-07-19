# 원문 기반 태그 추출 승격 스펙

Status: open
Labels: wayfinder:grilling
Assignee:
Blocked-by: 12

## Question

[카드 스키마와 카드화 대상](04-card-schema.md)에서 문맥 태그 값은 "게임 로컬 수제 시드 → 원문 기반 빌드타임 추출 승격" 2단계로 확정됐다. [문맥 태그 의미론 설계](12-context-tag-semantics.md)가 태그 어휘를 확정한 뒤 승격의 스펙을 정한다: 원문(catalog `pg_id` → 구텐베르크 / Drive `pd_novels/` / 로컬 `f:/Project/out/raw_texts/`)에서 무엇을 어떻게 추출하는가(단서 유형별 태그 매핑, LLM 추출·검증 절차), 파이프라인이 어디에 사는가([OUT 코어 경계](06-core-boundary.md)와의 관계 — 게임 레포 vs OUT vs 별도), 수제 시드와의 병합·재생성 절차, "catalog에 책 추가 → 카드 풀 자동 확장" 야망과의 접속. 산출은 스펙 ②(코어 추출·모듈화)에 들어간다.
