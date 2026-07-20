# 최신 추상전략게임 메커닉 리서치 (통합 게임 재료)

Status: closed
Labels: wayfinder:research
Assignee: MMDAL (opus session, 2026-07-20)
Blocked-by:

<!-- 2026-07-20: /research 서브에이전트 1차 시도 세션 한도로 실패 → 메인 에이전트가 직접 WebSearch로 조사·해소. -->


## Question

[코어 루프 프로토타입](11-core-loop-prototype.md)에서 사용자가 "추상전략게임 오마쥬 로직으로 새 게임 스타일 창조 + 하나의 게임으로 통합"을 방향으로 확정했다. 통합 게임(단서 카드로 사건을 추리·조립하는 정적 웹 게임)에 이식할 **최신·호평 추상전략게임의 메커닉**을 조사한다.

조사 축:
1. **인접·위치(positional/adjacency)** — Go·Azul·하이브 계열. 배치 위치가 결과를 가르는 로직.
2. **영역·다수결·영향력(area/majority/influence)** — Tigris&Euphrates·바둑 집.
3. **템포·행동경제(tempo/action economy)** — 체스 템포·워커 플레이스먼트.
4. **연결·네트워크·타일(connection/network/tile-laying)** — 카르카손·츠지·네트워크 빌딩.
5. **시나리오·서사 조립에 어울리는 메커닉** — 인과 사슬·시퀀싱·제약 만족(constraint satisfaction) 계열.

각 메커닉마다: (a) 대표 게임(가급적 최근 5~10년, BGG 고평가/Spiel·Kennerspiel·Golden Geek 등 수상작), (b) 핵심 규칙 1~2줄, (c) 이 프로젝트(정적 웹·1인개발·단서 카드 추리)에 이식 시 적합성/난이도, (d) "정답 맞히기 + 시나리오 조립" 통합에 주는 시사점.

산출: `docs/research/` 아래 마크다운. wayfinder 지도의 이 티켓에 결과 요약 링크.

## Resolution

2026-07-20, WebSearch 다각 조사(메인 에이전트 직접 — /research 서브에이전트 세션 한도 실패로 대체). 전문: [docs/research/2026-07-20-abstract-game-mechanics.md](../../docs/research/2026-07-20-abstract-game-mechanics.md).

**핵심 발견**: "정답 맞히기 + 시나리오 조립" 통합은 이미 검증된 형태가 있다 — **Golden Idol(2022)식 "빈칸 두루마리"** (단어 카드를 문장 빈칸에 채워 사건 재구성 = 정답 판정 + 서사 조립 동시). Obra Dinn(2018)의 3확정 잠금·Roottrees(2023)의 제약 전파가 같은 계보. caseCollection의 추리문(조각+슬롯)이 이미 이 형태.

**톱 추천 (v6 통합 우선순위)**: ① **빈칸 두루마리를 통합의 척추로** — v4 시나리오 보드를 별도 모드가 아니라 추리문 자체로 흡수(정답+조립 한 판). ② **인접 시너지(Azul/Calico)** 를 두루마리에 — 위치·이웃이 근접도/응집도에 기여(v5 태그 공명 승격). ③ **제약 만족 재확인(Obra Dinn/CSP)** 유지·심화. ④ **문맥 태그=영역 다수결(Tigris)** → [12](12-context-tag-semantics.md). ⑤ **템포·행동경제(Dune: Imperium)** 로 인터루드 추상화.

**결론**: 통합은 "두 모드 봉합"이 아니라 Golden Idol식 빈칸 두루마리를 하나의 추리문으로 삼고 그 위에 인접·검증·다수결·템포를 층층이 얹는 것. v4/v5가 ①②③을 부분 검증했으므로 v6은 시나리오 보드를 추리문으로 흡수하는 데서 출발.
