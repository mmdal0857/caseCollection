# 위키 데이터 인벤토리

Status: closed
Labels: wayfinder:research
Assignee: research-subagent (opus)
Blocked-by:

## Question

OUT(`f:/Project/out`)의 LLM 위키·조회 레이어가 실제로 제공하는 데이터는 무엇인가? 노드 타입별 개수·필드 구조·콘텐츠 풍부도(노드당 사용 가능한 텍스트/데이터 양)·언어·품질 편차, `graph.json`의 엣지 종류, `pd_wiki` 모듈의 조회 능력을 목록화하고, 카드화 가능한 엔티티 후보와 데이터 공백을 평가한다.

조사 대상: `docs/wiki/**`(SCHEMA.md, WIKI_INDEX.md, sources/ 27개, case-patterns/, clues/, characters/, settings/, stories/, archetypes/), `graphify-out/graph.json` + GRAPH_REPORT.md, `pd_wiki/`(loader.py, views.py, render.py, semantic/), `catalog.json`.

Findings: `docs/research/2026-07-19-wiki-data-inventory.md` (main — 로컬 트래커라 research 브랜치 규약 생략)

## Resolution

(2026-07-19, Opus research 서브에이전트) 상세는 [docs/research/2026-07-19-wiki-data-inventory.md](../../../docs/research/2026-07-19-wiki-data-inventory.md).

- **노드 인벤토리**: clue_type **49**(4카테고리, 원자적·균일, label+inference+renpy_var 완비) / story **77**(title·characters·crime_type·trope_tags 균일) / work **110**(catalog, 얇음 — 요약 ~110자+인물 5명) / source_page **27**(한국어 분석 산문 2~5KB로 풍부하나 **15/27이 패턴·단서 미배선**) / case_pattern **4**(노드당 밀도 최고, 개수 최소) / 보조: location 4, protagonist 1(raiden), archetype pool, atmosphere palette. episode는 ep01~04만 populated.
- **조회 레이어**: `pd_wiki`는 α(결정적 관계 조립) view + render_for_llm만 동작, β 의미검색 비활성. 위키 도메인 엣지 **14종은 frontmatter가 단일 원천**(loader.py가 메모리 계산) — 별도 그래프 파일 없음. **`graphify-out/graph.json`은 위키 그래프가 아니라 코드 의존성 그래프**(카드 소재 무관).
- **카드화 후보 순위**: ① clue_type(수량·균일성, 카테고리=슈트 구조) ② story(최다, 태그 flavor) ③ work ④ case_pattern(희귀 카드 소재) ⑤ source_page(프로필 카드). 잠재: distinct 캐릭터 426명 — 단 문자열뿐, 1급 노드 아님.
- **최대 데이터 공백**: ① 이미지 자산 전무(art/는 프롬프트 텍스트만) ② 수치 속성·희귀도 근거 없음(전부 정성 산문) ③ 캐릭터 1급 노드 부재 ④ source_page 절반 관계 미배선(시너지 편중) ⑤ 한/영 혼재.
