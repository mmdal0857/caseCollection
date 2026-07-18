# OUT 프로젝트 위키·조회 레이어 데이터 전수 인벤토리

- 작성일: 2026-07-19
- 대상: `f:/Project/out` (읽기 전용 조사) — PD 추리소설 기반 Ren'Py 비주얼노벨 프로젝트의 LLM 위키(`pd_wiki` α layer)
- 목적: 웹 카드 콜렉션 게임 **caseCollection**이 카드화할 수 있는 위키 엔티티 판단
- 용어 근거: `f:/Project/out/CONTEXT.md` (source_page, case_pattern, clue_type, location, work, author, protagonist, episode)
- 스키마 근거: `f:/Project/out/docs/wiki/SCHEMA.md`, 조회 코드: `f:/Project/out/pd_wiki/`

---

## 0. 핵심 요약 (먼저 읽을 것)

- 위키는 **관계형 노드 그래프**지만 그래프가 파일로 materialize돼 있지 **않다**. 엔티티 관계는 각 마크다운의 **YAML frontmatter가 단일 진실 원천**이고, 역방향 엣지는 `pd_wiki/loader.py`가 **메모리에서 계산**한다 (ADR 0001, `SCHEMA.md §2`).
- `graphify-out/graph.json`은 **위키 엔티티 그래프가 아니라 파이썬 코드 구조 그래프**다 (파일→함수→호출). 카드화 소재로는 무관 (§8 참조).
- 카드화 관점 최대 자산: **clue_type 49개 + story 77개 + work 110권** (모두 균일·구조화·다수). 최대 공백: **이미지 자산 없음, 수치 속성 없음, 희귀도 근거 필드 없음, 캐릭터가 1급 노드 아님**.

---

## 1. 노드 타입별 규모·구조·풍부도

`SCHEMA.md §1`이 정의하는 노드 카테고리 + 실제 파일 대조. `pd_wiki/loader.py`의 `WikiIndex` dataclass가 이들을 인덱싱한다.

### 1.1 work (원작) — 110권
- 출처: `f:/Project/out/catalog.json` (`.books[]`, 110개). `last_updated` + `books` 두 키만.
- 필드(13개): `pg_id`, `title`, `author`, `author_death_year`, `author_slug`, `filename`, `shelves[]`, `characters[]`, `renpy_usable`(bool), `renpy_notes`, `summary`, `added_date`, `wiki_source_id`.
- 풍부도: **summary는 한국어 1~2문장(약 110~120자)** — 얇지만 전권 존재(110/110). `characters[]`는 95권이 정확히 5명, 총 528개 언급 / **distinct 426명**. `renpy_usable=true` **55권**. `wiki_source_id` 보유 **90권**.
- 언어: 한국어(summary, renpy_notes) + 영어(title, 인물명).
- 품질 편차: `WIKI_INDEX.md`의 "총 20권" 표는 **stale(2026-05-19)** — 실제 catalog은 110권. renpy_usable/미사용, 전문/프리뷰 혼재.

### 1.2 author (작가) — distinct 26
- 파생 노드(catalog에서 `author_slug`로 유도, `loader.py` §1). distinct `author_slug` **26개**, distinct `wiki_source_id` **17개**.
- 필드: `slug`, `name`, `works[]`, `wiki_source_id`. **자체 콘텐츠 본문 없음** — works 목록 + source_page 링크뿐.

### 1.3 source_page (원작 분석 페이지) — 27개
- 출처: `f:/Project/out/docs/wiki/sources/*.md` 27개 (총 103KB, 파일당 **2.2~5.0KB**). `.adk-*` draft는 인덱스 제외.
- frontmatter: `title, category, status(Draft), last_updated, slug, type(author_canon|single_work), works[], features_detective, uses_patterns[], yields_clue_types[]`.
- 본문(한국어 산문, 노드당 가장 서술적): `핵심 설정 요소 / 탐정 스타일 / 전형적 사건 구조(5단계) / 문체·톤 / 재창조 힌트 / 참조 소스`. 예: `sources/holmes-canon.md`, `sources/chesterton-brown.md`(추가 탐정 Basil Grant·Horne Fisher까지 서술).
- **품질 편차 큼**: 27개 중 **15개가 `uses_patterns: []` + `yields_clue_types: []`** (관계 미연결) — bramah, collins, freeman, futrelle, green, hodgson, hornung, hume, leblanc, leroux, morrison, orczy, poe, post, zangwill. 즉 관계 배선은 Doyle/Chesterton 코어 등 ~12개에만 존재. 또 파일은 27개인데 catalog canonical `wiki_source_id`는 17개 — 나머지 10개(bangs, buchan, gaboriau, jepson, meade, oppenheim, patten, wallace×2, hawthorne)는 catalog 미등재 신규 draft. `single_work` 예: `sources/zangwill-big-bow.md`(2.3KB, 최소).

### 1.4 case_pattern (사건 구조 trope) — 4개
- 출처: `f:/Project/out/docs/wiki/case-patterns/*.md`: `locked-room`, `false-alibi`, `invisible-man`, `staged-disappearance`. status **Stable**.
- frontmatter: `title, category, id, status, last_updated, common_clues[], typical_locations[]`.
- 풍부도: **노드당 콘텐츠 밀도 최고**. `case-patterns/locked-room.md`(3.2KB)는 사건 기본 구조 ASCII 다이어그램 + 전제 조건 + 단서 목록(clue_A/B/C 상세) + `renpy menu` 분기 코드 + 정답 메커니즘 + 오답 처리 + 재사용 힌트 + 참조 원형. 다만 **4개뿐**.
- 언어: 한국어 본문 + 영문 renpy 코드.

### 1.5 clue_type (단서 카테고리) — 49개
- 출처: `f:/Project/out/docs/wiki/clues/*.md` 4파일: `physical.md`(18), `behavioral.md`(15), `documentary.md`(8), `forensic.md`(8). status Stable.
- 구조: frontmatter의 `clues:` 리스트, 항목당 `id`, `label`, `inference`, `renpy_var` + (physical) `location_hint` / (behavioral) `observation`. `loader.py`가 파일 `type`을 `category`로 주입.
- 풍부도: **가장 균일·원자적·다수**. 항목당 1~2줄이지만 label+inference+renpy_var가 항상 채워짐. 카테고리 4종 = 자연적 "suit". 예: `thread_fiber`(실·섬유 잔재 / "실 트릭으로 외부 잠금 가능성"), `omitted_witness`(증언 누락 인물 / Invisible Man 원리).
- 언어: 한국어 label·inference + 영문 id·renpy_var.

### 1.6 story (단편집 내 개별 단편) — 77개
- 출처: `f:/Project/out/docs/wiki/stories/*.md` 7파일. status **Stable**. 항목 수: doyle-return 13, hawthorne-lock-and-key 15, doyle-adventures 12, chesterton-innocence 12, doyle-memoirs 11, chesterton-man-who-knew-too-much 8, chesterton-club-queer-trades 6 = **77편**.
- frontmatter: 파일 레벨 `parent_work(pg_*), source_page(slug)` + `stories:` 리스트, 항목당 `id`, `title`(영), `characters[]`(영), `crime_type`, `trope_tags[]`.
- 풍부도: **균일·구조화·다수**. 본문 산문은 없고 태그 메타뿐이지만 카드 flavor로 즉시 사용 가능. `crime_type` 값 예: murder/theft/attempted_theft/attempted_murder/false_imprisonment/**none**(범죄 없는 반전). `trope_tags` 예: `venomous_snake_murder_weapon`, `socially_invisible_culprit`, `stolen_gem_hidden_in_goose`.
- 언어: 영어(title·인물·태그) 중심 + 파일 말미 한국어 주석.

### 1.7 location (장소 유형) — 4개
- 출처: `f:/Project/out/docs/wiki/settings/locations.md` 하나에 4개(`office_high_rise`, `private_manor`, `academic_library`, `port_warehouse`).
- 항목당: `id`, `label`, `atmosphere`, `sensory_hints{smell,sound,light}`(영문 감각 묘사), `locked_room_fit`(bool). 감각 디테일은 풍부하나 **4개뿐**.

### 1.8 protagonist (고정 주인공 레이든) — 1개
- 출처: `f:/Project/out/docs/wiki/characters/core/raiden.md`. status Stable.
- `character{name, age(38), occupation, speech_style, personality_tags[], appearance_hints, speech_samples[], detection_style, renpy_define}` + 한국어 산문(성격/화법 패턴/오리지널 요소). 단일 노드지만 캐릭터 시트로 완비.

### 1.9 episode (플레이 사건) — 16 계획, 4 populated
- 출처: `f:/Project/out/game/episodes/manifest.yaml`. seasons 4개(s1~s4), episodes ep01~ep16.
- **ep01~ep04만 내용 있음**, ep05~16은 빈 stub(`title:"", uses_clues:[]`). 필드: `id, season, title, based_on_source, based_on_sources[], uses_pattern, uses_clues[], based_on_story?`.
- pd_wiki 전용(Ren'Py 미사용). `uses_clues`가 단서 사용 이력의 단일 원천 → `clue_pool_for` 역산 근거.

### 1.10 노드 아님(풀 데이터로만 주입) — 아키타입/분위기
- **archetype pools** `characters/templates/{suspect,victim,witness}.md`: suspect 4개(`trusted_employee`, `business_rival`, `intimate_partner`, `service_person`) 등. 항목당 `id, label, motive_seeds[], appearance_hints[], speech_style, backstory_hook`. traversal 대상 아님(`SCHEMA.md §1` 명시).
- **atmosphere palette** `settings/atmosphere.md`: time_of_day 3 / weather 2 / tone_palette 2, 영문 `narrator_hooks`. 노드 아님.
- **archetypes/detective-A.md**: 레이든 초안 1개(Draft) — `raiden.md`로 대체된 레거시(내용 거의 중복).
- **clippings/**: `TEMPLATE.md`만 존재 — **실제 발췌 0건**(빈 디렉토리).
- **art/**: `ep02-backgrounds.md`(아트 디렉션 산문) + `prompts/{ep02,ep03}-design-prompts.md`. **이미지 프롬프트·지시문일 뿐 바인딩된 이미지 자산 아님**.

---

## 2. 엣지 타입 목록

### 2.1 위키 도메인 엣지 (`SCHEMA.md §2` — frontmatter 단일 원천, 역방향은 계산)
`wrote`(author→work), `analyzes`(source_page→work[]), `features`(source_page→detective), `uses`(source_page→case_pattern[]), `yields`(source_page→clue_type[]), `common`(case_pattern→clue_type[]), `fits`(case_pattern→location[]), `inspired_by`(protagonist→source_page), `instantiates`(episode→case_pattern), `uses`(episode→clue_type[]), `based_on`(episode→source_page), `from`(story→work), `analyzed_in`(story→source_page), `based_on_story`(episode→story).
- `loader.py`가 계산하는 역방향 인덱스: `clue_to_episodes`, `pattern_to_sources`, `pattern_to_episodes`, `stories_by_work`.
- **이 엣지들은 어떤 그래프 파일에도 저장돼 있지 않다** — frontmatter에 흩어져 있고 로드 시점에만 조립된다.

### 2.2 graph.json 엣지 (코드 그래프 — 위키와 무관, §8)
`contains`(45), `imports`(28), `calls`(26), `imports_from`(16), `rationale_for`(11), `method`(2). 노드 68개 전부 파이썬 파일/함수/클래스.

---

## 3. pd_wiki 조회 능력 요약

- 코드: `f:/Project/out/pd_wiki/{loader.py, views.py, render.py}` + `semantic/`(β, 비활성).
- **α layer(관계 조립, 유일 구현)** view function (`views.py`):
  - `author_context(author_id)` — 작가 + works + source_pages 요약
  - `source_page_context(slug)` — source + works + patterns
  - `case_pattern_context(pattern_id)` — pattern + common_clues + typical_locations + used_by_sources + used_by_episodes
  - `clue_pool_for(pattern_id)` — 아직 안 쓴 신선 단서 역산(`fresh_common`, `unused_any`)
  - `stories_for_work(pg_id)` — 해당 work의 개별 단편들
  - `episode_seed(episode_id)` — 에피소드 생성용 컨텍스트 전량 조립(source+story+pattern+clues+locations+protagonist+아키타입 풀)
  - `season_context(season_id)`, `similar_by_tropes(source_slug)`(같은 패턴 공유 source 검색)
  - `render_for_llm(ctx, max_tokens)` — dict→LLM 주입용 markdown 직렬화(`render.py`)
- **β layer(의미검색, 미활성)**: `semantic/`에 chunking/embed/search 코드는 있으나 BigQuery+Vertex 또는 로컬 bge-m3 벡터스토어 필요, 설계상 "측정 후 도입" 보류(`CONTEXT.md` β layer 항목). 현재는 **결정적 관계 조회만** 가능, 자유텍스트 유사도 검색 불가.
- 요약: pd_wiki는 **ID→관계 조립**에 특화. 카드 게임이 쓰려면 노드 ID로 컨텍스트를 뽑아 쓸 수 있으나, "비슷한 카드 추천" 같은 의미 검색은 아직 없음.

---

## 4. 카드화 후보 엔티티 순위 (데이터 풍부도 기준)

1. **clue_type (49)** — 최우선. 원자적·균일·다수, 항목당 label+inference+renpy_var 완비. 4카테고리(physical/behavioral/documentary/forensic) = 천연 suit. "증거 카드"로 즉시 사용. 파일: `docs/wiki/clues/*.md`.
2. **story (77)** — 최다 개수 + 균일 구조(title/characters/crime_type/trope_tags). 개별 단편 = "사건 카드", trope_tags = flavor/시너지 태그. 파일: `docs/wiki/stories/*.md`.
3. **work (110)** — 최다 원작, summary(한)+characters(5)+author+renpy_usable. "원작/사건파일 카드". 55권 renpy_usable로 우선 풀 구성 가능. 출처: `catalog.json`.
4. **case_pattern (4)** — 노드당 밀도 최고(다이어그램·분기·메커니즘)지만 4개뿐 → 희귀 "트릭/메커니즘 카드"에 적합. 파일: `docs/wiki/case-patterns/*.md`.
5. **source_page (27)** — 작가·탐정별 분석 산문 풍부 → "탐정/작가 프로필 카드". 단 15/27이 관계 미배선(시너지 링크 빈약).
6. **character (distinct 426, 잠재)** — 노드는 아니나 `catalog.json .characters[]`와 `stories[].characters[]`에 홈즈/왓슨/Father Brown/Flambeau 등 유명 인물이 다수 문자열로 존재. 카드 게임의 자연스러운 주역이나 **인물별 데이터(설명·초상·관계) 전무** — 별도 enrichment 필요.
7. **location(4)/protagonist(1)/archetype pool(suspect 4 등)/atmosphere palette** — 소수 보조 세트. 컬렉션보다는 배경·메커니즘 카드용.

---

## 5. 데이터 공백 평가 (카드 게임에 필요한데 없는 것)

- **이미지 자산 없음 (최대 공백)**: 어떤 위키 노드에도 바인딩된 그림이 없다. `docs/wiki/art/`는 배경 아트 *디렉션·프롬프트 텍스트*뿐, 실제 PNG는 `game/images/`(위키 밖). 캐릭터/단서/사건 카드용 일러스트는 **전량 신규 생성 필요**. `clippings/`는 템플릿만 있고 비어 있음.
- **수치 속성 없음**: power/cost/HP/rarity score 같은 숫자 필드가 어디에도 없음. 모든 데이터가 정성적 산문·태그. 카드 스탯은 **파생·설계로 만들어야 함**(예: crime_type/pattern 빈도, renpy_usable 여부).
- **희귀도 근거 필드 없음**: 카드 rarity로 쓸 명시 필드 부재. 파생 후보: `type=author_canon vs single_work`, `renpy_usable`, `status(Stable/Draft/Skeleton)`, 패턴 사용 빈도, canon 정경성. 그러나 직접 필드는 없음.
- **캐릭터가 1급 노드 아님**: 426명이 문자열로만 존재 — 설명·동기·관계·초상 없음. 유명 탐정/악당 중심 카드 게임엔 치명적 공백(별도 캐릭터 위키 레이어 구축 필요).
- **관계 배선 불균등**: source_page 27개 중 15개가 패턴/단서 미연결 → 카드 시너지 그래프가 Doyle/Chesterton 코어에 편중.
- **그래프 파일이 도메인 그래프가 아님**: `graphify-out/graph.json`은 코드 의존성 그래프 → 카드 관계망으로 재사용 불가. 엔티티 엣지는 frontmatter에서 재계산해야(pd_wiki 이식 또는 재구현).
- **episode 대부분 미완**: 16개 중 4개만 populated → 에피소드 기반 카드는 소수.
- **언어 혼재**: label/inference/summary는 한국어, id/title/trope_tags/인물명은 영어. 웹 카드 게임 다국어 정책 사전 결정 필요.

---

## 6. 참고 파일 경로 (모두 f:/Project/out, 읽기 전용)

- 스키마/인덱스: `docs/wiki/SCHEMA.md`, `docs/wiki/WIKI_INDEX.md`(20권 표는 stale), `docs/wiki/RETRIEVAL-METRICS.md`, `CONTEXT.md`
- 노드 소스: `catalog.json`(110 work), `docs/wiki/sources/`(27), `docs/wiki/case-patterns/`(4), `docs/wiki/clues/`(4파일·49 clue_type), `docs/wiki/stories/`(7파일·77 story), `docs/wiki/settings/{locations,atmosphere}.md`, `docs/wiki/characters/core/raiden.md`, `docs/wiki/characters/templates/{suspect,victim,witness}.md`, `game/episodes/manifest.yaml`
- 조회 레이어: `pd_wiki/loader.py`, `pd_wiki/views.py`, `pd_wiki/render.py`, `pd_wiki/semantic/`(β 비활성)
- 코드 그래프(위키 무관): `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`
- 아트(프롬프트만): `docs/wiki/art/ep02-backgrounds.md`, `docs/wiki/art/prompts/`
