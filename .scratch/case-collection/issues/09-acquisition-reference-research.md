# 획득 구조 레퍼런스 리서치 (최근 게임)

Status: closed
Labels: wayfinder:research
Assignee: research-subagent (opus)
Blocked-by:

## Question

코어 루프 확정(03)에서 카드 획득 경로가 "학습형(게스트 단서: 판 안에서 임시 사용 → 클리어 시 영구 획득) + 보상팩 혼용"으로 방향이 잡혔고, 사용자는 이보다 **로직적으로 복잡한 구조**를 원한다. 최근(약 2020년 이후) 게임 위주로 — 추상전략, 전략 카드(로그라이트·덱빌더), 퍼즐 — 카드/자원/어휘의 **획득·진행 경제** 레퍼런스를 조사한다:

- 결정적 해금과 랜덤 보상을 혼합한 경제의 구체 사례와 구조(선택형 팩, 드래프트, 크래프팅, 피티/천장, 듀얼 화폐 등)
- "도구/어휘가 늘며 풀 수 있는 문제 공간이 넓어지는" 진행(어휘 게이트)과 획득이 맞물린 사례
- 획득 자체가 의사결정(선택·트레이드오프·시너지 계획)이 되는 로직적으로 복잡한 구조
- 각 구조의 Koster 렌즈 평가: 학습 곡선·마스터리·권태 방지

산출: 후보 획득 구조 3~5개를 caseCollection 컨텍스트(어휘 게이트 + 소모형 힌트 카드, 정적 클라이언트 웹, 빌드타임 생성, 1인 개발)에 맞게 평가·권고. [획득 구조 세부 확정](10-acquisition-detail.md)의 재료가 된다.

Findings: `docs/research/2026-07-19-acquisition-structures.md`

## Resolution

2026-07-19 (Opus research 서브에이전트)

최근(2020+) 디지털 게임 + 추상전략/보드게임(BGG 메커니즘 분류)의 획득·진행 경제를 6개 설계 패턴으로 추상화해 조사했다: A 선택형 팩(Balatro), B 자가선택 풀 드래프트(Cobalt Core), C 결정적 트랙+랜덤 캐시+피티+표적 상점(Marvel Snap·가챠), D 고정 공급+기회비용(Dominion), E 어휘/도구 게이트(Chants of Sennaar·Golden Idol·Storyteller·Inscryption), F 크래프팅/변형(Wildfrost·Roguebook·Astrea). BGG 렌즈로 caseCollection 어휘 게이트가 **Tech Trees/Tech Tracks**(선행 능력이 상위를 연다)의 정본 대응임을 확인하고, Open Drafting·Set Collection·Legacy 대응도 매핑했다.

정적 웹·빌드타임 생성·1인 개발 제약상 **결정론 계열(D·E)**이 궁합 최상, C의 다층 피티·라이브 운영은 과설계로 판정. 후보 획득 구조 5개 권고 — MVP 조합은 **권고 1(어휘 확정 게이트, 뼈대) + 권고 3(고정 공급 기회비용) + 권고 2(선택형 단서팩+무중복 편향)**. 권고 4(자가선택 수사 렌즈)·5(힌트 카드 크래프팅)는 첫 빌드 이후 확장. 각 권고는 어휘 게이트/게스트 단서/보상팩과의 결합 방식과 리스크를 명시했다. 티켓 10(획득 구조 세부 확정)의 재료.

Findings 링크: [../../../docs/research/2026-07-19-acquisition-structures.md](../../../docs/research/2026-07-19-acquisition-structures.md)
