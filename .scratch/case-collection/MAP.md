# caseCollection Wayfinder Map

Labels: wayfinder:map

## Destination

두 스펙이 `/to-spec`으로 넘길 준비가 된 상태:
① **caseCollection 게임 스펙** — OUT LLM 위키 기반 웹 카드 콜렉션 게임 (수집 + 플레이 하이브리드)
② **OUT 코어 추출·모듈화 스펙** — 추출된 모듈의 경계·형태 + 일반화된 추출 플로우(스킬) 정의

## Notes

- **도메인**: 퍼블릭 도메인 추리소설 기반. 데이터 소스는 OUT(`f:/Project/out`)의 LLM 위키 — source_page 27, case_pattern 4, clue_type 49, story 77, work 110(catalog) 등 + `pd_wiki` 조회 레이어(α만 동작). 위키 엣지 14종은 frontmatter가 단일 원천(loader.py 메모리 계산). 주의: `graphify-out/graph.json`은 코드 의존성 그래프라 위키와 무관.
- **재미 원칙**: Raph Koster *A Theory of Fun* — 재미 = 학습 가능한 시스템의 마스터리, 내러티브는 드레싱. 진짜 메커닉을 위한 추가 시스템 코스트 감수 OK. (OUT 메모리 `feedback_koster_fun_theory` 참조)
- **확정 제약** (차팅 세션, 2026-07-19):
  - 정적 클라이언트 온리 웹 게임 — 서버 없음, itch.io/자체 호스팅, localStorage 저장 → 런타임 LLM 배제, 콘텐츠는 빌드타임 생성
  - Dead Letters와 독립 — 원작(PD 소설) 데이터 직결, 세계관·캐릭터 미공유
  - 코어 루프 방향: B+C 하이브리드(플레이로 카드 획득 + 수집물의 게임적 사용) — 확정은 코어 루프 티켓에서
  - 한국어 우선, 영어는 파이프라인 슬롯만
  - 재사용 = 모듈(추출된 코어) + 플로우(추출 절차의 일반화 스킬) 둘 다 — 이번 추출이 플로우의 첫 검증 사례
  - 코어 경계 시작 가설: 생성된 위키 데이터 + 조회 레이어(최소). 생성 파이프라인 포함 여부는 게임 요구 확정 후
- **협업**: 코딩·이미지 구현 위임은 Codex 우선(codex-collab). Codex 쿼터 ~2026-07-25까지 소진 → 그 전엔 gemini-collab 폴백. 서브에이전트 모델은 **Opus** 사용(Fable 세션 한도 절약, 2026-07-19 지시).
- **마일스톤**: 2026-08 첫 공개 빌드 목표 — 느슨한 제약, MVP 스코프 티켓에서 참고.
- **스킬**: 티켓 해소는 /grilling + /domain-modeling 기본, prototype 티켓은 /prototype. 용어는 OUT `CONTEXT.md` 준수. 주의: OUT 용어집에서 "case"는 기피어(에피소드 인스턴스와 혼동) — 이 프로젝트에서 "case"를 핵심 명사로 재정의하려면 /domain-modeling으로 명시적 결정하고 이 레포의 `CONTEXT.md`에 기록.
- **트래커**: 로컬 마크다운 — 운영 규약은 `docs/agents/issue-tracker.md`의 "Wayfinding operations".

## Decisions so far

<!-- one line per closed ticket: name(link) — gist -->

- [위키 데이터 인벤토리](issues/02-wiki-data-inventory.md) — 카드화 1순위는 clue_type(49)·story(77), case_pattern(4)은 희귀 소재, work(110)는 얇음; 최대 공백은 이미지 전무·수치/희귀도 근거 부재·캐릭터 1급 노드 부재. graph.json은 코드 그래프라 무관.

## Not yet specified

- 카드 아트 파이프라인 — 기존 로컬 파이프라인(ComfyUI, EP01 무과금 체계, nano-banana) 재사용 추정. 카드 스키마 확정 후 구체화.
- 사운드/BGM — Amuse 파이프라인 재사용 여부. MVP 스코프 이후.
- 수익화·배포 채널 세부 — itch.io 무료/유료, Patreon 연계 여부.
- 영어 지원 시점 — 파이프라인 슬롯 설계는 스펙에 포함, 실제 지원은 재미 검증 후.
- 일반화 추출 플로우 스킬의 형태 세부 — 코어 경계·패키징 결정 후 스펙 작성 시 구체화.
- "catalog에 책 추가 → 카드 풀 자동 확장" 야망 — 희망사항 수준. 코어 경계가 생성 파이프라인을 포함하게 되면 그때 티켓화.

## Out of scope

- Dead Letters 세계관·캐릭터 재사용 — 독립 게임 결정(차팅, 2026-07-19)으로 배제.
- 서버 기반 기능(계정·서버측 컬렉션·라이브 운영) — 정적 클라이언트 결정으로 배제.
- 런타임 LLM 콘텐츠 생성 — 정적 클라이언트 결정의 귀결.

---

open 티켓은 `issues/`에서 조회: `Status: open` + `Assignee:` 빈 값 + Blocked-by 전부 closed = 프론티어.
