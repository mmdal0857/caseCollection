# 획득·진행 경제 레퍼런스 리서치 (최근 게임, 2020+)

- 작성: 2026-07-19, Opus 리서치 서브에이전트
- 티켓: [09-acquisition-reference-research](../../.scratch/case-collection/issues/09-acquisition-reference-research.md)
- 목적: caseCollection 코어 루프(어휘 게이트 — 보유한 "단서 어휘" 카드만 슬롯에 배치 가능 + 소모형 힌트 카드)의 카드 **획득·진행 구조**를, 결정된 하이브리드(게스트 단서 학습 + 보상팩)보다 **로직적으로 더 복잡한** 형태로 확장하기 위한 레퍼런스 조사.

---

## 1. 조사 범위 / 방법

- **대상 장르**: (a) 로그라이트 덱빌더 (Balatro, Cobalt Core, Roguebook, Wildfrost, Astrea, Inscryption), (b) 수집형 카드 게임 (Marvel Snap, 가챠 피티 시스템), (c) 추상전략/보드게임 덱빌더 (Dominion, 7 Wonders/Duel, Terraforming Mars, Gaia Project, Res Arcana, Gloomhaven), (d) 어휘·연역 퍼즐 (Case of the Golden Idol, Chants of Sennaar, Storyteller).
- **방법**: 각 게임의 위키(메커니즘 상세)·개발자 설계 인터뷰·공식 페이지를 1차 근거로 조회. 보드게임/추상전략은 **BGG(BoardGameGeek)의 게임 페이지·메커니즘 분류 태그(deck building, open drafting, tech trees, set collection, legacy)**를 1차 소스로 사용. 각 사례를 (구조 상세 → Raph Koster *A Theory of Fun* 렌즈: 학습 곡선·마스터리 천장·권태 방지)로 분석.
- **Koster 렌즈 기준** ([Theory of Fun 요약](https://www.bookey.app/book/theory-of-fun-for-game-design)): 재미 = 학습 가능한 패턴의 마스터리(grokking). 권태는 (1) 너무 쉬워 패턴을 이미 마스터했거나, (2) 너무 어려워 패턴을 식별조차 못할 때 발생. "노이즈(이해 못 한 패턴)만큼 지루한 것은 없다." → **획득 구조는 새 패턴을 꾸준히 공급하되, 플레이어가 소화 가능한 속도로 문제 공간을 넓혀야 한다.**

핵심을 게임별이 아니라 **6개 설계 패턴**으로 추상화해 정리한다.

---

## 2. 패턴별 사례 분석

### 패턴 A — 선택형 팩 오프닝 (결정적 슬롯 + 랜덤 후보 중 선택)

**사례: Balatro (2024)** — 상점은 매번 결정적 슬롯 구조(카드 2 + 부스터팩 2 + 바우처 1)를 갖고, 그 안의 내용물만 랜덤이다 ([Balatro Wiki: The Shop](https://balatrowiki.org/w/The_Shop)). 부스터팩은 구매 즉시 열려 **N개 후보 중 k개를 고른다**: Normal($4, 3장 중 1), Jumbo($6, 5장 중 1), Mega($8, 5장 중 2). 스킵도 무패널티 ([Balatro Wiki: Booster Packs](https://balatrowiki.org/w/Booster_Packs)). 바우처는 $10 결정적 구매이며 상위 바우처는 하위 버전 선구매를 요구하는 **의존 트리** 구조다 ([Balatro Wiki: Vouchers](https://balatrowiki.org/w/Vouchers)).

- **획득이 결정층인 지점**: 랜덤은 "무엇이 제시되는가"에만 있고, "무엇을 취하는가"는 온전히 플레이어 선택. 팩 사이즈(가격) 선택 자체가 리스크/기회비용 결정.
- **Koster**: 매 상점이 작은 최적화 퍼즐 → 꾸준한 새 패턴 공급(권태 방지 강). 바우처 의존 트리는 장기 마스터리 목표. 학습 곡선은 카드 풀 규모에 비례해 완만.

### 패턴 B — 자가선택 풀 드래프트 (사전 커밋이 획득을 결정으로 만든다)

**사례: Cobalt Core (2023)** — 런 시작 시 **승무원 3명을 먼저 선택**하고, 이후 전투 보상 카드는 오직 그 3명의 풀에서만 뽑힌다. 아티팩트도 데려간 승무원과 연동된 것만 등장 ([Steam Guide: Cobalt Core Starting Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3076644839)). 카드 보상은 스킵 가능(덱 정제), 카드마다 **2개 업그레이드 분기**로 선택을 강제 ([Card Gamer: Cobalt Core](https://cardgamer.com/games/digital-card-games/cobalt-core-is-a-cozy-space-deckbuilder-with-a-lot-of-charm/)). 런 완료로 신규 승무원·함선·기억을 결정적으로 해금.

- **획득이 결정층인 지점**: 사전 커밋(승무원 3인)이 이후 획득 랜덤성의 범위를 플레이어가 미리 좁힌 것 → "무엇을 뽑을지"가 아니라 "무엇을 뽑을 수 있게 만들지"를 설계. 시너지 계획이 런 시작 시점으로 앞당겨진다.
- **Koster**: 자가선택 풀 = 플레이어가 학습 대상 패턴을 스스로 고르는 구조 → 자기주도 학습 곡선. 신규 승무원 결정적 해금 = 새 패턴의 예측 가능한 공급(장기 권태 방지).

### 패턴 C — 결정적 트랙 + 랜덤 캐시 + 피티/천장 + 표적 상점 백스톱 + 듀얼 화폐

**사례: Marvel Snap (2022~, 2025 경제 개편)** — 다층 구조:
- **결정적 진행 트랙**: Collection Level이 오를수록 마일스톤 보상(캐시)이 열림. 시리즈 게이팅 — S1 전량 획득 전 S2 불가, S2 전 S3 불가(테크트리형 게이트) ([Marvel Snap Zone: Card Acquisition Improvements](https://marvelsnapzone.com/card-acquisition-improvements/)).
- **랜덤 캐시 + 무중복 피티**: 캐시는 해당 시리즈 내 **미보유 카드 중** 지급(중복 방지 = 사실상 피티) ([Marvel Snap Zone: Spotlight Caches](https://marvelsnapzone.com/spotlight-caches-details-drop-rates-and-card-acquisition-changes/)).
- **표적 상점 백스톱(듀얼 화폐)**: 게임플레이로 Collector's Tokens(소프트 화폐)를 모아 **원하는 특정 카드**를 Token Shop에서 정조준 구매 — S3 1000 / S4 3000 / S5 6000 토큰 ([Marvel Snap Zone: Collector's Tokens](https://marvelsnapzone.com/collector-tokens/)). 랜덤이 안 주면 결정적으로 사는 안전판.
- **시리즈 드롭**: 오래된 S5 카드가 S4→S3로 내려가 가격·접근성이 완화(시간이 인플레이션 완충).

**순수형: 가챠 피티/천장** — Genshin Impact: 하드 피티 90뽑에서 ★5 확정(절대 천장), 소프트 피티 ~74뽑부터 확률 급상승, 50/50 실패 시 다음은 확정 ([Game8: Genshin Pity System](https://game8.co/games/Genshin-Impact/archives/305937)). 소프트 화폐를 프리미엄 화폐로 환전하는 듀얼 화폐 구조. 설계 철학: "순수 확률에서 벗어나 참여에 대한 리턴을 보장하는 통제된 시스템" — 공정성 인식 관리 ([COGconnected: Pity Systems](https://cogconnected.com/2025/10/the-genshin-impact-standard-how-pity-systems-and-soft-currency-caps-redefine-gacha-game-economics/)).

- **획득이 결정층인 지점**: "지금 랜덤 캐시를 열까 vs 토큰을 아껴 표적 구매할까" + 시리즈 게이트 진행 순서 = 자원 배분 결정. 단, 랜덤 캐시 자체는 수동적.
- **Koster**: 무중복 피티·하드 천장 = 노이즈(순수 랜덤의 좌절)를 억제해 "학습 진행이 보장된다"는 신뢰 제공. 다만 캐시 개봉은 스킬 학습이 아니라 도파민 루프라 마스터리 기여는 낮음 — 결정층은 주로 **토큰 배분**에 있음.

### 패턴 D — 고정 공급 진열 + 매턴 획득 = 기회비용 (획득 자체가 게임의 전부)

**사례: Dominion (2008, 디지털판·확장 지속)** — 상점(Supply)에 놓인 **10종 킹덤 카드는 고정·공개**(뽑기 랜덤 없음). 게임마다 25종 중 10종을 세팅해 "변하는 것은 킹덤 세트 하나"로 제한. 매 턴 카드를 자기 덱으로 **획득(gain)**하며, 획득이 곧 엔진 빌딩 그 자체다 ([Wikipedia: Dominion](https://en.wikipedia.org/wiki/Dominion_(card_game))).

디자이너 Donald X. Vaccarino의 설계 철학 ([Cardboard Edison: Meaningful Decisions](https://cardboardedison.com/blog/meaningful-decisions-donald-x-vaccarino-dominion), 403으로 원문 일부만 확보): 제약을 "한계가 아니라 설계 기능"으로 사용. 매 턴 액션 1장 제한을 두어 그 규칙을 깨는 카드에 가치를 부여(기회비용). 고정 진열은 카드 밸런스를 더 중요하게 만들되 모두에게 동등한 접근을 보장 — "회전 진열은 랜덤성을 크게 늘린다"며 의도적으로 고정 진열 채택.

- **획득이 결정층인 지점**: 랜덤이 거의 없음에도 로직 복잡성 최고 — 모든 획득이 되돌릴 수 없는 기회비용이고, 덱 밀도·시너지·타이밍을 계산해야 함. "무엇을 사는가"가 게임의 100%.
- **Koster**: 순수 결정론이라 노이즈 0. 학습 곡선은 킹덤 세트 조합(사실상 무한 변주)에서 나옴 → "하나만 변주" 원칙이 소화 가능한 새 패턴을 지속 공급. 마스터리 천장 매우 높음.

### 패턴 E — 어휘/도구 게이트 진행 (도구가 늘며 풀 수 있는 문제 공간이 넓어짐)

이 패턴이 caseCollection의 뼈대와 직결된다.

**사례: Case of the Golden Idol (2022, DLC 지속)** — 탐색 모드에서 하이라이트된 단어를 클릭해 **워드 뱅크**에 수집 → "Thinking" 페이지의 빈칸에 배치 → 맞으면 섹션이 잠기며 정답 확정. 수천 순열 중 단일 해 ([Steam Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3100279123); [The Escape Effect 리뷰](https://theescapeeffect.com/blog/the-case-of-the-golden-idol-review-a-brilliant-web-of-deduction)). 단서를 덜 숨겨 "찾기"가 아니라 "추론"에 집중하게 한 것이 설계 의도.

**사례: Chants of Sennaar (2023)** — 5개 언어, 150+ 글리프. 문맥·대화로 의미를 **가설**로 기입(글리프당 20자 메모, 복수 가설 가능) → 노트북의 3~5개 그림과 성공적으로 매칭하면 **의미가 확정**되어 이후 자동 번역 ([Steam Guide: Full Journal](https://steamcommunity.com/sharedfiles/filedetails/?id=3032566296)). **가설 상태는 다른 폰트로 표시**돼 "아직 추측 vs 확정 번역"을 시각화 → 마스터리 진척이 눈에 보인다. 로제타석형 이중언어 텍스트가 새 글리프 해독의 지렛대 ([The Language Closet](https://thelanguagecloset.com/2024/12/07/playing-chants-of-sennaar/)).

**사례: Storyteller (2023)** — 캐릭터·배경·사건을 드래그해 지정된 제목(예: "비극", "불륜")을 성립시키는 퍼즐. 챕터 진행으로 새 요소(예: 소원을 이뤄주는 Genie, 우리에서 풀려나는 Devil)가 해금되며 **기존 퍼즐의 해법 공간까지 확장** ([Nintendo Life](https://www.nintendolife.com/news/2023/09/imaginative-puzzler-storyteller-gets-free-update-adds-voice-acting-and-new-chapter); [The Gamer 가이드](https://www.thegamer.com/storyteller-puzzle-walkthrough-guide/)). 새 요소 = 새 동사/도구.

**사례: Inscryption (2021) 토템** — 도구를 2조각(머리+몸통)으로 조립하고, 한 번 해금한 조각(예: 다람쥐 머리)은 이후 런에서 항상 시작 보유 ([Inscryption Wiki: Totem](https://inscryption.fandom.com/wiki/Totem)).

- **획득이 결정층인 지점**: 획득 = 영구적 **능력 확장**. 게이트("보유 어휘로 풀 수 있는 것만 풀림")가 곧 진행. Golden Idol은 획득(단어 수집)이 쉽고 배치가 어려운 반면, Chants는 획득(의미 확정) 자체가 퍼즐.
- **Koster**: 어휘 게이트는 Koster 이론의 교과서적 구현 — 새 도구 = 새 패턴, 소화 후 다음 도구. Chants의 "가설/확정 폰트 구분"은 마스터리 가시화의 모범. 권태 방지는 **도구 공급 속도 튜닝**에 달림(너무 빠르면 노이즈, 너무 느리면 권태).

### 패턴 F — 소재 변형/크래프팅 (보유 카드를 조합적으로 개조)

**사례: Wildfrost (2023) 참(charm)** — 참은 카드 1장의 동작을 런 내내 바꾸는 장착형 트링킷, **카드당 최대 3개** 장착. 획득: 참 디스펜서(무료 랜덤 1), Woolly Snail(랜덤 3구매), 참 상인(3종 지정 구매), 보스 보상 ([Wildfrost Wiki: Charms](https://wildfrostwiki.com/Charms)). 홈타운 메타 업그레이드가 신규 유닛·부족·참을 풀에 해금 ([Wildfrost Wiki: Tribes](https://wildfrostwiki.com/Tribes)).

**사례: Roguebook (2021, Richard Garfield 참여)** — 카드의 소켓에 **젬**을 끼워 영구 개조(예: +14 데미지, 카드 1장 추가 드로우). 카드 획득은 전투·상점·변형(transform)으로, 듀얼 화폐(맵 탐색용 잉크/브러시 vs 카드용 골드) + 메타 화폐(페이지) ([Roguebook Review, PC Gamer](https://www.pcgamer.com/roguebook-review/); [Grokipedia](https://grokipedia.com/page/roguebook)).

**사례: Astrea (2023)** — 350+ 주사위 중 선택, **주사위 면을 직접 편집(forge)**해 확률을 개조. 정화/오염 듀얼 자원, 안전/균형/고위험 3종 주사위 티어 ([Astrea Steam 페이지](https://store.steampowered.com/app/1755830/Astrea_SixSided_Oracles/)).

- **획득이 결정층인 지점**: 모디파이어 획득 = "어느 보유 카드에 붙일까"라는 조합 계획 → 획득이 조합 폭발을 낳는 결정.
- **Koster**: 조합 깊이가 높은 마스터리 천장 제공. 리스크 — 조합 폭발은 밸런싱 부담(노이즈/불투명성으로 전락하기 쉬움).

### 패턴 G — 추상전략/보드게임 렌즈 (BGG 메커니즘 분류)

BoardGameGeek(BGG)의 메커니즘 분류는 위 디지털 패턴을 보드게임 언어로 형식화해 준다 — 획득 구조를 "메커니즘 조합"으로 사고하는 데 유용하다.

- **Deck, Bag, and Pool Building** ([BGG mechanic 2664](https://boardgamegeek.com/boardgamemechanic/2664/deck-bag-and-pool-building)) — BGG 정의: "플레이어는 개별 덱에서 카드를 내며, **새 카드를 획득**하고 덱을 반복적으로 돌려 카드 획득·제거로 점진 개선한다. Dominion이 이 메커니즘을 개척." → 패턴 D의 원류. 획득 = 엔진 개선 그 자체.
- **Open Drafting** ([BGG mechanic 2041](https://boardgamegeek.com/boardgamemechanic/2041/open-drafting)) — BGG 정의: "공용 풀에서 카드/타일/자원/주사위를 **골라(또는 구매해)** 이점을 얻거나 컬렉션을 조립. 드래프팅은 플레이어에게 선택권이 있고, 상대가 원할 카드를 **먼저 채가 차단(denial)**할 수 있음을 함의." → 패턴 A/B의 형식화. 단, denial은 멀티플레이어 상호작용이라 싱글플레이 caseCollection엔 "공용 풀 선택" 부분만 이식 가능(denial은 시간·자원 기회비용으로 치환).
  - 대표 사례: **7 Wonders / 7 Wonders Duel**(카드 드래프트로 문명 건설), **Terraforming Mars**(거대한 덱에서 드래프트해 엔진 구성) ([BGG: Card drafting thread](https://boardgamegeek.com/thread/2815581/card-drafting)).
- **Tech Trees / Tech Tracks** ([BGG mechanic 2849](https://boardgamegeek.com/boardgamemechanic/2849/tech-trees-tech-tracks)) — BGG 정의: "**선행 능력(prerequisite)을 획득해야 상위 능력이 열리는** 구조." 상위 티어는 같은 열의 이전 단계를 먼저 연구해야 자격 발생. → **어휘 게이트(패턴 E)의 보드게임 정본**. "보유한 것만 다음을 연다"는 caseCollection 코어와 1:1 대응. 대표: **7 Wonders Duel**(과학 심볼 진행), **Gaia Project**(선행 조건부 상위 테크 해금) ([BGG: Games with Tech Trees geeklist](https://boardgamegeek.com/geeklist/14774/games-tech-trees)).
- **Set Collection** ([BGG mechanic 2004](https://boardgamegeek.com/boardgamemechanic/2004/set-collection)) — BGG 정의: "아이템 가치가 **세트 소속 여부**에 의존(수량·다양성 그룹으로 점수)." 예: Bohnanza(콩 세트), Ra(기념물 세트). → caseCollection에서 "특정 단서 계열을 모으면 배치/판독 보너스"로 리텐션·수집 목표를 줄 수 있는 후크(티켓 01의 도감 리텐션 레이어와 연결).
- **Legacy** ([BGG family 25404](https://boardgamegeek.com/boardgamefamily/25404/mechanism-legacy)) — BGG 정의: "플레이 결과·선택에 따라 **규칙·구성물이 영구히 변하는** 게임(카드에 표시, 봉인 개봉 등)." 대표: **Gloomhaven**(비밀 상자·봉투 해금, 레벨업, 마을에서 장비 구매) ([BGG: Gloomhaven](https://boardgamegeek.com/boardgame/174430/gloomhaven)), **Res Arcana**(아티팩트·기념물·권능의 장소 등 복수 획득 경로) ([BGG: Res Arcana strategies](https://boardgamegeek.com/thread/2663484/all-strategies)). → 게스트 단서의 "클리어 시 영구화"가 곧 legacy형 영구 변경. 캠페인 진행 = 어휘 영구 확장.

- **Koster/보드게임 종합**: Tech Tree(prerequisite 게이트)는 Koster의 "소화 가능한 새 패턴을 순차 공급"을 물리적으로 구현한 것 — 어휘 게이트가 왜 학습 곡선 설계에 유리한지의 근거. Open Drafting은 "획득이 곧 선택(기회비용)"을 보장해 권태를 늦춘다. Set Collection은 장기 수집 목표로 마스터리 천장을 연장.

### 요약 표

| 패턴 | 랜덤/결정 혼합 | 획득이 결정층인가 | 어휘게이트 친화 | 1인 개발 부담 | BGG 대응 메커니즘 |
|---|---|---|---|---|---|
| A 선택형 팩 | 랜덤 후보 + 결정 선택 | 강 | 중 | 중(랜덤 밸런싱) | Open Drafting |
| B 자가선택 풀 드래프트 | 사전커밋으로 랜덤 축소 | 강 | 중~강 | 중 | Open/Closed Drafting |
| C 트랙+캐시+피티+표적상점 | 다층 혼합 | 중(토큰 배분) | 강 | 높음(다층 로직) | (F2P 특화, BGG 밖) |
| D 고정공급+기회비용 | 거의 결정론 | 최강 | 강 | 낮음 | Deck/Bag/Pool Building |
| E 어휘/도구 게이트 | 결정적 해금 | 강(확정이 퍼즐이면) | 최강 | 낮~중 | Tech Trees / Tech Tracks |
| F 크래프팅/변형 | 랜덤 모디파이어 | 강(조합계획) | 중 | 높음(조합 폭발) | (카드 업그레이드 계열) |
| — 수집 목표 레이어 | — | — | (리텐션) | 낮음 | Set Collection / Legacy |

---

## 3. caseCollection 컨텍스트 적합성 평가

제약 요약(MAP.md): **정적 클라이언트 웹, 서버 없음, 빌드타임 콘텐츠 생성, localStorage, 1인 개발, 한국어 우선, 2026-08 첫 빌드**. 코어 = 어휘 게이트(보유 단서 카드만 배치) + 소모형 힌트 카드. 획득 하이브리드는 (a) 게스트 단서(판 내 임시 사용 → 클리어 시 영구화) + (b) 보상팩 확정.

- **가장 궁합 좋은 축은 D·E** — 결정론적이라 서버·라이브 밸런싱·피티 확률 튜닝이 불필요하고, 어휘 게이트의 "문제 공간 확장" 서사와 직결. 1인 개발·정적 웹에 부담 최소.
- **A·B는 "선택으로서의 획득" 로직 복잡성**을 결정론을 유지한 채 주입 — 게스트 단서를 "후보 중 선택"으로 승격하면 랜덤 밸런싱 부담 없이 결정층을 강화 가능.
- **C의 다층·피티·라이브 운영은 과설계** — 수집형 F2P 리텐션용 구조라 정적 단일 제품엔 부적합. 단, "듀얼 화폐 + 표적 상점 백스톱"의 **결정적 안전판 아이디어**만 차용할 가치 있음(랜덤이 원하는 단서를 안 줄 때의 좌절 방지).
- **F(크래프팅)는 소모형 힌트 카드를 확장할 자연 후크**지만 조합 폭발 밸런싱이 1인 개발엔 위험 — MVP 이후.
- **주의(위키 데이터 제약, 티켓 02)**: 이미지 전무·수치/희귀도 근거 부재. 따라서 **희귀도·확률 기반(C/가챠)보다, 데이터에 이미 존재하는 clue_type(49)·story(77)의 구조적 관계에 기반한 결정적 게이트(D/E)가 데이터 현실에도 부합**.
- **보드게임(BGG) 관점 보강**: 어휘 게이트는 BGG의 **Tech Trees/Tech Tracks**(선행 능력 획득이 상위를 연다)와 정확히 대응하며, 이는 caseCollection 코어를 "검증된 보드게임 메커니즘의 디지털 구현"으로 정당화한다. 획득의 결정층은 BGG **Open Drafting**(선택+기회비용), 수집 리텐션은 **Set Collection**, 게스트 단서의 영구화는 **Legacy** 계열에 대응 → 권고 구조들이 디지털·아날로그 양쪽에서 선례를 가진다.

---

## 4. 후보 획득 구조 권고 (3~5)

### 권고 1 — 어휘 확정 게이트 (Chants/Golden Idol형) [뼈대, 필수]
- **구조**: 게스트 단서를 판 안에서 "가설(assumed)" 상태로 임시 사용 → 사건 클리어로 "확정(confirmed)"되어 영구 어휘화. 미확정 단서는 다른 표기(폰트/색/테두리)로 렌더해 마스터리를 시각화(Chants의 폰트 구분 차용). 확정 어휘가 늘수록 더 복잡한 사건이 게이트 해제.
- **결합**: 게스트 단서 = 임시 어휘, 보상팩 = 확정 어휘의 배치 경로. 소모형 힌트 카드 = 가설→확정 전환을 촉진하는 아이템.
- **리스크**: 도구 공급 속도 튜닝 실패 시 노이즈(너무 빠름)/권태(너무 느림). 확정을 "그냥 클리어 보상"으로 두면 획득이 수동적 — 확정 조건에 작은 검증 퍼즐을 넣어야 결정층이 살아남.

### 권고 2 — 선택형 단서팩 + 무중복 편향 (Balatro팩 × Snap 피티)
- **구조**: 클리어 보상으로 "단서팩" 지급 — N개 후보를 보여주고 k개만 선택(팩 사이즈로 리스크/보상 조절). 후보 풀은 **미보유·연관 단서 편향**(무중복 피티)으로 좌절 방지. 스킵 무패널티(덱 정제).
- **결합**: 게스트 단서가 "이번 판 한정 미리보기" 역할을 하고, 클리어 시 그 계열 단서가 팩 후보에 우선 등장 → 게스트 경험이 선택을 정보화.
- **리스크**: 랜덤 후보 밸런싱 필요(빌드타임에 계열/가중치 사전 계산으로 완화 가능). 정적 웹이라 시드 고정·재현성 설계 권장.

### 권고 3 — 고정 공급 어휘 진열 + 기회비용 (Dominion형) [최저부담·최고 로직밀도]
- **구조**: 각 챕터/사건 세트마다 **획득 가능한 단서 목록을 고정·공개**(랜덤 없음). 사건 통화(예: 수사 포인트)를 모아 매 사건 1~2개만 영구 획득 → "무엇을 먼저 배울지"가 되돌릴 수 없는 기회비용 결정. 로직 복잡성은 랜덤이 아니라 **시너지·순서 계획**에서 발생.
- **결합**: 게스트 단서 = 진열대에서 "체험 후 구매" 미리보기. 보상팩 대신 "통화로 정조준 구매"가 결정적 획득 경로(Snap 토큰샵의 결정론적 정신만 차용). "하나만 변주"(Vaccarino) 원칙 — 챕터마다 진열 세트만 교체.
- **리스크**: 순수 결정론이라 "설렘(랜덤 보상)"이 약함 → 권고 2와 하이브리드로 보완(고정 진열 + 가끔 선택형 팩). 진열 세트 큐레이션이 콘텐츠 제작 부담(빌드타임 생성으로 상쇄).

### 권고 4 — 자가선택 수사 렌즈 풀 (Cobalt Core형)
- **구조**: 사건 진입 전 플레이어가 "수사 렌즈"(예: 동기 중심 / 물증 중심 / 인물관계 중심)를 선택 → 그 렌즈의 단서 계열에서만 게스트 단서·보상이 뽑힘. 획득이 **사전 커밋 의사결정**이 됨.
- **결합**: 어휘 게이트 위에 얹는 "획득 라우팅" 레이어. 확정 어휘가 렌즈 해금 조건이 되어 권고 1과 순환 강화.
- **리스크**: 렌즈 수 × 단서 계열 = 콘텐츠 곱셈 → 초기 스코프 팽창. MVP엔 렌즈 2종으로 축소 시작 권장.

### 권고 5 (선택) — 힌트 카드 크래프팅/변형 (Wildfrost charm형) [MVP 이후]
- **구조**: 소모형 힌트 카드를 "차치(charm)"로 확장 — 단서 카드에 장착(카드당 상한, 예 1~2개)해 판독/배치 능력을 영구·조합적으로 개조. 획득이 "어느 단서에 붙일까"라는 조합 계획이 됨.
- **결합**: 소모형 힌트의 자연스러운 심화. 확정 어휘에만 장착 허용 → 게이트와 결합.
- **리스크**: 조합 폭발 → 밸런싱·불투명성. 1인 개발엔 MVP 이후로 미룰 것.

### 종합 방향
- **MVP 조합 권고**: 권고 1(어휘 확정 게이트, 뼈대) + 권고 3(고정 공급 기회비용, 결정론 저부담) + 권고 2(선택형 단서팩, 설렘·랜덤을 결정론과 하이브리드). 이 셋은 정적 웹·1인 개발·빌드타임 생성에 부담이 낮으면서, "획득 자체가 기회비용·선택·게이트 진행 결정"이 되어 사용자가 원한 로직 복잡성을 충족한다.
- **확장 여지**: 권고 4(수사 렌즈)와 권고 5(크래프팅)는 리텐션·마스터리 천장을 높이지만 콘텐츠·밸런싱 곱셈 리스크가 있어 첫 빌드 이후.

---

## 출처

- Balatro Wiki — The Shop / Booster Packs / Vouchers: https://balatrowiki.org/w/The_Shop , https://balatrowiki.org/w/Booster_Packs , https://balatrowiki.org/w/Vouchers
- Marvel Snap Zone — Card Acquisition Improvements / Spotlight Caches / Collector's Tokens: https://marvelsnapzone.com/card-acquisition-improvements/ , https://marvelsnapzone.com/spotlight-caches-details-drop-rates-and-card-acquisition-changes/ , https://marvelsnapzone.com/collector-tokens/
- Genshin/HSR 피티 — Game8: https://game8.co/games/Genshin-Impact/archives/305937 ; COGconnected: https://cogconnected.com/2025/10/the-genshin-impact-standard-how-pity-systems-and-soft-currency-caps-redefine-gacha-game-economics/
- Cobalt Core — Steam Starting Guide: https://steamcommunity.com/sharedfiles/filedetails/?id=3076644839 ; Card Gamer: https://cardgamer.com/games/digital-card-games/cobalt-core-is-a-cozy-space-deckbuilder-with-a-lot-of-charm/
- Dominion — Wikipedia: https://en.wikipedia.org/wiki/Dominion_(card_game) ; Cardboard Edison (Vaccarino 인터뷰): https://cardboardedison.com/blog/meaningful-decisions-donald-x-vaccarino-dominion
- Case of the Golden Idol — Steam Guide: https://steamcommunity.com/sharedfiles/filedetails/?id=3100279123 ; The Escape Effect: https://theescapeeffect.com/blog/the-case-of-the-golden-idol-review-a-brilliant-web-of-deduction
- Chants of Sennaar — Steam Full Journal Guide: https://steamcommunity.com/sharedfiles/filedetails/?id=3032566296 ; The Language Closet: https://thelanguagecloset.com/2024/12/07/playing-chants-of-sennaar/
- Storyteller — Nintendo Life: https://www.nintendolife.com/news/2023/09/imaginative-puzzler-storyteller-gets-free-update-adds-voice-acting-and-new-chapter ; The Gamer: https://www.thegamer.com/storyteller-puzzle-walkthrough-guide/
- Inscryption Totem — Fandom Wiki: https://inscryption.fandom.com/wiki/Totem
- Wildfrost — Charms / Tribes Wiki: https://wildfrostwiki.com/Charms , https://wildfrostwiki.com/Tribes
- Roguebook — PC Gamer: https://www.pcgamer.com/roguebook-review/ ; Grokipedia: https://grokipedia.com/page/roguebook
- Astrea — Steam: https://store.steampowered.com/app/1755830/Astrea_SixSided_Oracles/
- Raph Koster, A Theory of Fun — Bookey 요약: https://www.bookey.app/book/theory-of-fun-for-game-design
- BoardGameGeek 메커니즘 분류 — Deck/Bag/Pool Building: https://boardgamegeek.com/boardgamemechanic/2664/deck-bag-and-pool-building ; Open Drafting: https://boardgamegeek.com/boardgamemechanic/2041/open-drafting ; Tech Trees/Tech Tracks: https://boardgamegeek.com/boardgamemechanic/2849/tech-trees-tech-tracks ; Set Collection: https://boardgamegeek.com/boardgamemechanic/2004/set-collection ; Legacy (family): https://boardgamegeek.com/boardgamefamily/25404/mechanism-legacy
- BGG 게임/스레드 — Gloomhaven: https://boardgamegeek.com/boardgame/174430/gloomhaven ; Res Arcana strategies: https://boardgamegeek.com/thread/2663484/all-strategies ; Games with Tech Trees geeklist: https://boardgamegeek.com/geeklist/14774/games-tech-trees ; Card drafting thread: https://boardgamegeek.com/thread/2815581/card-drafting
