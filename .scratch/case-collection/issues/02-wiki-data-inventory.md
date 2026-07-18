# 위키 데이터 인벤토리

Status: open
Labels: wayfinder:research
Assignee: research-subagent
Blocked-by:

## Question

OUT(`f:/Project/out`)의 LLM 위키·조회 레이어가 실제로 제공하는 데이터는 무엇인가? 노드 타입별 개수·필드 구조·콘텐츠 풍부도(노드당 사용 가능한 텍스트/데이터 양)·언어·품질 편차, `graph.json`의 엣지 종류, `pd_wiki` 모듈의 조회 능력을 목록화하고, 카드화 가능한 엔티티 후보와 데이터 공백을 평가한다.

조사 대상: `docs/wiki/**`(SCHEMA.md, WIKI_INDEX.md, sources/ 27개, case-patterns/, clues/, characters/, settings/, stories/, archetypes/), `graphify-out/graph.json` + GRAPH_REPORT.md, `pd_wiki/`(loader.py, views.py, render.py, semantic/), `catalog.json`.

Findings: `research/wiki-data-inventory` 브랜치의 `docs/research/2026-07-19-wiki-data-inventory.md`
