# 최신 추상전략게임 메커닉 리서치 — 통합 게임 재료

- 티켓: [.scratch/case-collection/issues/15-abstract-games-research.md](../../.scratch/case-collection/issues/15-abstract-games-research.md)
- 목적: 단서 카드로 사건을 추리·조립하는 정적 웹 게임에 이식할 최신·호평 추상전략 메커닉 조사. 방향 확정 = "추상전략 오마쥬 + 정답 맞히기와 시나리오 조립을 하나의 게임으로 통합"([티켓 11](../../.scratch/case-collection/issues/11-core-loop-prototype.md)).
- 방법: WebSearch 다각 조사(메인 에이전트 직접 — /research 서브에이전트가 세션 한도로 실패). BGG는 SPA라 WebSearch가 반환한 메커니즘 정의를 인용.

---

## 핵심 발견 (먼저)

**"정답 맞히기 + 시나리오 조립"의 통합은 이미 검증된 형태가 있다 — Golden Idol/Obra Dinn 계열의 "빈칸 두루마리(thinking scroll)".** 이 발견이 통합 설계의 척추가 된다:

- **The Case of the Golden Idol (2022)**: 장면에서 단어 카드(이름·사물·**동사**)를 수집 → "thinking panel"의 두루마리 빈칸에 채워 **무슨 일이 벌어졌는지 문장으로 재구성**. 빈칸을 옳게 채우는 것이 곧 (a) 정답 판정이자 (b) 사건 시나리오 조립. caseCollection의 추리문(조각+슬롯)이 **이미 이 형태**다.
- **Return of the Obra Dinn (2018)**: "3개가 맞아야 잠금(lock-in)" — brute-force 방지. 이 게임의 근접도+3개 확정이 바로 이 계보(이미 채택됨).
- **The Roottrees Are Dead (2023, 확장 2025)**: 증거를 **연결**해 좁혀가는 추론 — 한 칸을 옳게 채우면 남은 카드가 갈 자리가 줄어드는 **제약 전파(constraint propagation)**.

→ 통합은 새 발명이 아니라, 이 계열의 척추(빈칸 두루마리) 위에 **추상전략의 위치·인접·다수결·템포**를 얹는 것.

---

## 축별 조사

### 1. 위치·인접 (positional / adjacency)

| 게임 | 연도 | 핵심 규칙 | 이식 적합성 |
|---|---|---|---|
| **Azul** | 2017 (SdJ 2018) | 타일을 벽에 놓되 **인접(가로·세로)** 시 가점, 행·열·색 완성 보너스 | 높음 — "어디 놓느냐"의 점수화. 추리 슬롯에 인접 시너지로 직결 |
| **Hive** | 2001~ | 판 없이 육각 타일을 **인접**시켜 여왕벌을 포위. 위치가 전부 | 중 — 포위/인접 위상. 자유 배치 보드에 적용 가능 |
| **Calico / BOOP** | 2020/2021 | 인접 색·패턴 요구(Calico) / 놓으면 인접 말을 밀어내는 **연쇄**(BOOP) | 중 — 인접 조건 충족 + 연쇄 반응. 태그 공명·오염 연출에 시사 |

**시사**: v4/v5에서 이미 프로토한 "인접 서사 링크"가 이 계보. Azul식 "인접 배치가 점수를 만든다"를 추리 슬롯에 얹으면, 카드의 **정답 여부(내용)** 와 **배치 위치·이웃(공간)** 이 둘 다 판정에 든다.

### 2. 영역 다수결·영향력 (area majority / influence)

| 게임 | 연도 | 핵심 규칙 | 이식 적합성 |
|---|---|---|---|
| **Tigris & Euphrates** | 1997 | 타일 배치 + **영역 다수결** — 같은 색 타일로 왕국의 강도 확보, 인접 충돌 시 다수가 승리 | 중 — 배경 상태(주목/신뢰)를 **경합 트랙**으로 볼 때의 원형 |
| (Area Majority 일반) | — | 한 공간의 **비례적 존재/영향력**에 따라 보상. 여럿이 점유 가능 | — 태그가 트랙을 밀고 당기는 줄다리기 |

**시사**: caseCollection의 **문맥 태그 시스템([티켓 12](../../.scratch/case-collection/issues/12-context-tag-semantics.md))** 이 곧 영향력 다수결 — 카드 태그가 주목/신뢰 트랙에 영향력을 놓고, 다수가 case의 판정 규칙을 바꾼다. 12의 기계적 뼈대 후보.

### 3. 템포·행동 경제 (tempo / action economy)

| 게임 | 연도 | 핵심 규칙 | 이식 적합성 |
|---|---|---|---|
| **Dune: Imperium / Lost Ruins of Arnak** | 2020/2021 | **워커 플레이스먼트 + 덱빌딩** 하이브리드 — 액션 칸 선점(action blocking)이 기회비용 | 중 — 단일 case의 행동을 유한 자원으로. 인터루드 배분 퍼즐 |
| (Worker Placement 일반) | — | 유한 토큰으로 액션 선점, 한 번 쓰면 비싸지거나 막힘 → **템포 압박** | — "지금 3개 확정 vs 전부 검증"의 기회비용 |

**시사**: case마다 행동점수(AP) 한정 → 배치·힌트·가설선언·재확인이 전부 AP 소비. 인터루드 = AP 배분. 사용자가 원한 "인터루드 추상 미니게임"의 한 축. 최신 추세는 **메커니즘 혼합**(WP+덱빌딩+…)이라 하이브리드가 정석.

### 4. 연결·네트워크·타일 (connection / tile-laying)

| 게임 | 연도 | 핵심 규칙 | 이식 적합성 |
|---|---|---|---|
| **Tsuro** | 2004 | 경로 타일을 이어 **끊기지 않는 길**을 만든다. 명료성 최우선 | 높음(개념) — "끊기지 않는 인과 사슬"의 직관적 은유 |
| **Carcassonne** | 2000 (SdJ 2001) | 타일로 길·도시를 **연결**해 완성, 완성 영역에 미플로 다수 확보 | 중 — 연결 완성 + 영역 점유 |

**시사**: v4/v5의 시나리오 사슬이 곧 Tsuro식 "끊기지 않는 경로" — 인과 사슬이 끊기면(비약) 이야기가 깨진다. **재확인의 '약한 고리 지목'** 이 이 은유의 UI화.

### 5. 서사 조립·제약 만족 (scenario composition / constraint satisfaction)

| 게임/개념 | 연도 | 핵심 규칙 | 이식 적합성 |
|---|---|---|---|
| **The Case of the Golden Idol** | 2022 | 단어 카드(이름·사물·**동사**)를 두루마리 빈칸에 채워 사건 문장 재구성 | **최상** — 정답+조립 통합의 직접 템플릿 |
| **Return of the Obra Dinn** | 2018 | **3개 맞으면 잠금** — 무차별 대입 방지 | 최상 — 이미 채택 |
| **The Roottrees Are Dead** | 2023 | 증거 연결로 **제약 전파** — 한 칸 확정 시 남은 후보 축소 | 높음 — 어휘 게이트·수사 노트 해금과 결합 |
| (Logic-grid CSP 일반) | — | 자연어 단서를 제약으로 → **단계적 설명(step-wise explanation)** 으로 풀이 검증 | 높음 — "재확인" 검증이 곧 CSP 설명 스텝 |

**시사**: 추리 게임은 본질적으로 제약 만족(CSP). caseCollection의 **재확인(검토)** — 조립을 진실 골격에 대조해 성립/반증 + 약한 고리 지목 — 은 CSP의 "인간이 검증 가능한 단계적 설명"에 대응. 학술적으로 견고한 방향.

---

## 요약표 (메커닉 → 대표작 → 적합 → 통합 시사)

| 메커닉 | 대표작(최신/수상) | 적합 | 통합 시사 |
|---|---|:--:|---|
| 빈칸 두루마리(정답+조립) | Golden Idol '22, Obra Dinn '18 | ★★★ | **통합의 척추** — 슬롯 채우기가 곧 시나리오 문장 |
| 인접 시너지 | Azul '17(SdJ '18), Calico '20 | ★★★ | 배치 위치·이웃이 판정에 든다(v4/v5 프로토) |
| 제약 전파·검증 | Roottrees '23, logic-grid CSP | ★★☆ | 어휘 게이트·재확인의 이론적 뼈대 |
| 영역 다수결·영향력 | Tigris&Euphrates '97 | ★★☆ | 배경 상태(주목/신뢰)=경합 트랙 → 티켓 12 |
| 연결·끊김 없는 경로 | Tsuro '04, Carcassonne '00 | ★★☆ | 인과 사슬 끊김=약한 고리(재확인 UI) |
| 템포·행동 경제 | Dune: Imperium '20 | ★★☆ | case별 AP·인터루드 배분(추상 미니게임) |

*수상 참고: SdJ 2018 Azul / Kennerspiel 2023 Challengers! · 2024 Daybreak · 2025 Endeavor: Deep Sea / SdJ 2024 Sky Team — 최신 수상작은 대체로 하이브리드·협력 계열로, 순수 추상보다 **메커니즘 혼합**이 주류임을 확인.*

---

## 통합 게임을 위한 톱 추천 (프로토 우선순위)

1. **빈칸 두루마리를 통합의 척추로 (Golden Idol 모델)** — 추리 슬롯 채우기와 시나리오 조립을 **하나의 두루마리**로 합친다. 카드를 순서 있는 서사 슬롯에 놓으면 동시에 (a) 정답 판정(근접도+3확정)과 (b) 시나리오 문장이 조립된다. caseCollection이 이미 이 형태이므로 v4 시나리오 보드를 **별도 모드가 아니라 추리문 자체**로 흡수. → **v6 통합의 1순위.**
2. **인접 시너지를 두루마리에 얹기 (Azul/Calico)** — 슬롯의 **위치·이웃**이 근접도/응집도에 기여. 정답 내용 + 배치 공간 둘 다 판정. v5의 태그 공명·강한 링크를 그대로 승격.
3. **제약 만족 재확인 루프 유지·심화 (Obra Dinn/Roottrees/CSP)** — 3확정 잠금 + 재확인(성립/반증·약한 고리)을 통합 게임의 검증 축으로. 어휘 게이트가 제약 전파를 만든다.
4. **문맥 태그 = 영역 다수결 (Tigris)** — 주목/신뢰를 태그 영향력의 줄다리기 트랙으로 설계. [티켓 12](../../.scratch/case-collection/issues/12-context-tag-semantics.md)의 기계화 방향.
5. **템포·행동 경제로 인터루드 추상화 (Dune: Imperium)** — case별 AP·인터루드 배분 퍼즐. 사용자가 원한 "인터루드 추상 미니게임". 통합 이후 레이어.

**한 줄 결론**: 통합은 "두 모드 봉합"이 아니라 — **Golden Idol식 빈칸 두루마리를 하나의 추리문으로 삼고, 그 위에 인접 시너지(Azul)·제약 검증(Obra Dinn)·태그 다수결(Tigris)·템포(Dune)를 층층이 얹는 것**. 이미 프로토(v4/v5)가 1·2·3을 부분 검증했으므로, v6은 시나리오 보드를 추리문으로 흡수하는 데서 출발.

---

## 출처

- [Best Abstract Board Games 2024 — Victory Conditions](https://victoryconditions.com/best-abstract-board-games-top-10-list/), [Everything Is A Game](https://everythingisagame.com/abstract-strategy-games/)
- [Area Majority / Influence — BoardGameGeek](https://boardgamegeek.com/boardgamemechanic/2080/area-majority-influence), [Tigris & Euphrates — Meeple Mountain](https://www.meeplemountain.com/reviews/tigris-and-euphrates/)
- [Return of the Obra Dinn — Wikipedia](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn), [Golden Idol — Game Developer](https://www.gamedeveloper.com/design/case-of-the-golden-idol), [Golden Idol 개발 — Thinky Games](https://thinkygames.com/features/how-the-case-of-the-golden-idol-developers-made-one-of-the-decades-best-detective-games-twice/)
- [The Roottrees are Dead — Steam](https://store.steampowered.com/app/2754380/The_Roottrees_are_Dead/), [Adventure Game Hotspot 리뷰](https://adventuregamehotspot.com/review/3671/the-roottrees-are-dead)
- [Worker Placement — BoardGameGeek](https://boardgamegeek.com/boardgamemechanic/2082/worker-placement), [15 Best Worker Placement Games 2024 — Joyful Games](https://joyful-games.com/blogs/card-and-board-games-101/15-best-worker-placement-games-to-play-in-2024)
- [Tsuro — Wikipedia](https://en.wikipedia.org/wiki/Tsuro), [Games Like Carcassonne — GameRant](https://gamerant.com/games-similar-carcassonne/)
- [Spiel des Jahres — Wikipedia](https://en.wikipedia.org/wiki/Spiel_des_Jahres), [Kennerspiel des Jahres — BGG Wiki](https://boardgamegeek.com/wiki/page/Kennerspiel_des_Jahres)
- [Constraint satisfaction problem — Wikipedia](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem), [Step-wise explaining CSP — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0004370221001016)
