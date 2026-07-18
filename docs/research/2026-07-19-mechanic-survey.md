# 수집+플레이 결합 카드 게임 메커닉 설계 공간 서베이

- **작성일**: 2026-07-19
- **대상 프로젝트**: caseCollection — 퍼블릭 도메인 추리소설(셜록 홈즈, 아르센 뤼팽 등) 기반 정적 클라이언트 웹 카드 콜렉션 게임
- **목적**: "B+C 하이브리드"(B = 짧은 추리 플레이로 카드 획득, C = 수집 카드를 게임적으로 사용) 코어 루프 결정을 위한 후보 패턴 도출
- **제약**: 서버 없는 정적 웹 게임 / 솔로 개발 / 한국어 우선
- **평가 렌즈**: Raph Koster, *A Theory of Fun* — 재미 = 학습 가능한 패턴의 마스터리("aha"), 내러티브는 드레싱이지 재미의 원천이 아니다

---

## 0. 평가 렌즈: Koster의 "재미 = 패턴 학습"

Koster의 핵심 주장은 **게임은 패턴 학습 기계(pattern grokking machine)**이며, 재미는 학습·이해·마스터리에서 나온다는 것이다. 플레이어는 활동을 만나면 그것을 완전히 "grok"(체득)하여 근육 기억처럼 자동화된 rote 패턴으로 만들려 한다. 뇌가 정보를 청킹(chunking)해 자동화하는 순간이 마스터리다. ([game-studies wiki](https://game-studies.fandom.com/wiki/A_Theory_of_Fun_for_Game_Design), [bumblingthroughdungeons 요약](https://bumblingthroughdungeons.com/theory-fun-game-design-raph-koster/))

여기서 파생되는 **설계 진단 기준(본 서베이의 공통 렌즈)**:

1. **동사(Verb)**: 플레이어가 반복 수행하며 마스터하는 핵심 행동은 무엇인가? (예: "덱을 큐레이션한다", "단서를 문장 빈칸에 배치한다")
2. **학습 곡선**: 첫 패턴을 얼마나 빨리 grok하는가? 온보딩이 쉬운가?
3. **마스터리 천장 / 변주(Variation)**: Koster의 "권태 문제" — 모든 패턴을 청킹하면 게임은 지루해진다. 좋은 게임은 뇌가 계속 학습하도록 **변수를 충분히 흘려보낸다**. 즉 verb를 가르친 뒤 리믹스해야 한다. ([bumblingthroughdungeons](https://bumblingthroughdungeons.com/theory-fun-game-design-raph-koster/))
4. **내러티브는 드레싱**: Golden Idol 개발자가 명시했듯, 플레이어가 탐정처럼 느끼는 이유는 "디어스토커 모자를 써서가 아니라 똑똑해서 미스터리를 풀었기 때문"이어야 한다 — 소재(홈즈/뤼팽)는 껍질이고, 재미는 추론이라는 동사의 마스터리에서 나온다. ([Game Developer](https://www.gamedeveloper.com/design/case-of-the-golden-idol))

**caseCollection 함의**: PD 추리소설이라는 소재는 강력한 드레싱이지만, 코어 루프는 반드시 학습·마스터 가능한 "동사"를 가져야 한다. 수집(C) 그 자체는 완성 편향(completion bias)이라는 강한 **동기**이지만 Koster 기준으로는 마스터할 패턴이 얕다 — 그래서 B(추리 플레이)가 마스터리의 진짜 원천이 되어야 한다.

---

## 1. 덱빌더 (Deckbuilder)

### 1a. Slay the Spire

- **코어 루프**: 탑 등반 → 전투 → 승리 시 카드 3장 중 1장 선택 획득(또는 스킵) → 렐릭/이벤트로 덱 변형 → 다음 층. 획득·제거·업그레이드가 곧 덱 큐레이션.
- **학습·마스터되는 것**:
  - **덱 큐레이션**: 초보의 가장 흔한 실수는 "덱 비대(deck bloat)". 30장 덱은 15장 덱의 절반 빈도로만 핵심 카드를 뽑는다 → "작고 시너지 있는 덱이 이긴다"를 학습.
  - **제약 하 의사결정**: "나쁜 운" 때문이 아니라 "두 층 전의 선택" 때문에 진다 — 인과적 마스터리.
  - **시너지·콤보**: 카드를 연결해 눈사태 같은 데미지/방어를 만드는 느낌이 핵심. ([videogamer](https://www.videogamer.com/features/why-slay-the-spire-still-rules-the-roguelike-deckbuilder-genre/), [eneba 가이드](https://www.eneba.com/hub/games/game-guides/slay-the-spire-tips/))
- **수집→플레이 통합**: 수집(획득)과 사용이 **한 몸**이다. 획득 = 즉시 덱에 편입 = 즉시 전투 재료. 별도의 "수집 단계"가 없다.
- **솔로 웹 축소 가능성**: **높음**. 완전 싱글플레이, 결정론적 상태(시드), 서버 불필요. 웹에서 수십 개 카드/렐릭 풀로도 성립. 어려움은 밸런싱(적 AI/의도 시스템)에 있다.
- **PD 추리소설 적용**: 카드 = 단서/인물/기법(예: "관찰", "알리바이 붕괴", "왓슨의 오독"). 적 = 사건/용의자. "전투" = 진실에 도달하기 위한 논증 라운드. 렐릭 = 탐정의 상징 아이템(파이프, 확대경).

### 1b. Dominion (원조 덱빌더)

- **코어 루프**: 공용 공급처(supply)에서 카드 구매 → 개인 덱에 추가 → 매 턴 자기 덱을 드로우·플레이하며 엔진 강화 → 승점 카드 확보.
- **학습·마스터되는 것**: **엔진 빌딩**. 덱을 한 턴에 대부분 돌릴 수 있게 만들면 후반 "메가 턴"이 나온다. "Big Money(느리고 꾸준)" 대 "Engine(느린 시동 후 폭발)"의 트레이드오프를 grok하는 것이 마스터리. ([Dominion Strategy](https://dominionstrategy.com/2012/07/30/building-the-first-game-engine/), [Wikipedia](https://en.wikipedia.org/wiki/Dominion_(card_game)))
- **핵심 설계 우아함**: 매 게임 **같은 10종 카드만** 공급처에 등장 — 조합을 바꿔 리플레이성을 만든다. 랜덤성을 늘리지 않고도 결정이 흥미롭다(카드 기능이 다양, 소수만 승점). ([meeplelikeus](https://www.meeplelikeus.co.uk/dominion-2008/))
- **수집→플레이 통합**: 구매 = 수집 = 엔진 부품 편입. STS와 동일하게 수집·사용 일체형.
- **솔로 웹 축소 가능성**: **중간**. 원래 대결형이라 솔로화하려면 "목표 점수 도달" 또는 봇 상대 필요. "10종 세트 교체로 리플레이" 아이디어는 웹에 매우 적합.
- **PD 적용**: 공급처 = 이번 사건에 사용 가능한 "수사 기법 세트". 승점 = 확보한 진실. "매 케이스마다 다른 10종 기법" = Dominion의 킹덤 교체 = 변주 엔진.

> **덱빌더 가족 요약 (Koster 렌즈)**: 동사 = "덱 큐레이션/엔진 빌딩". 마스터리 천장 높음(시너지 공간이 깊음), 변주는 카드/렐릭/킹덤 교체로 확보. **수집과 플레이가 이미 한 몸**이라 B+C 분리 구조와는 결이 다르다 — caseCollection이 "수집 단계"와 "사용 단계"를 명확히 분리하려면 이 통합성을 일부러 끊어야 한다.

---

## 2. 로그라이트 카드 (Roguelite Card)

### 2a. Balatro

- **코어 루프**: 포커 핸드 플레이 → 점수(칩 × 배수) 획득 → 블라인드(목표 점수) 돌파 → 상점에서 조커/카드 구매 → 반복. "블라인드 3개 = 1 안테" 구조로 게임을 한 입 크기로 쪼개 "한 판만 더"를 유도. ([goombastomp](https://goombastomp.com/how-balatro-became-one-of-the-most-addictive-roguelikes/))
- **학습·마스터되는 것**: **조커 시너지 = 곱셈 수학(Synergy Math)**. 조커 3개의 상호작용이 조합 폭발을 낳고, 첫 50시간에 다 매핑 못 한다. raw power보다 시너지 발견이 중독의 핵심. ([thegamer](https://www.thegamer.com/permadeath-define-roguelike-balatro-shows-its-synergy/), [oreateai 분석](https://www.oreateai.com/blog/indepth-analysis-of-the-game-design-philosophy-and-roguelike-mechanisms-in-balatro/4fdfc5f5314b10a83aa161f2aa243254))
- **주스(juice)**: 점수 산정 시 각 요소가 순차적으로 시각·청각 콜아웃과 함께 발동 — "왜 이 점수가 났는지"를 보여주는 것이 최대 혁신. 산수를 불꽃놀이로 만든다. ([blakecrosley](https://blakecrosley.com/guides/design/balatro), [errorandexp](https://errorandexp.substack.com/p/unpacking-balatros-addicting-game))
- **수집→플레이 통합**: 조커 = 수집물 = 즉시 점수 엔진 부품. 언락(메타 수집)은 별도로 존재(새 조커/덱 해금)해 장기 동기 제공.
- **솔로 웹 축소 가능성**: **매우 높음**. 순수 싱글, 저사양, 규칙 단순(포커 기반이라 온보딩 쉬움). 웹 배포에 이상적. 실제로 규칙 코어가 작고 조합 깊이만 크다.
- **PD 적용**: "핸드" = 제출하는 단서 조합. 조커 = 탐정의 추론 편향/특기(예: "귀납 +Mult", "물리 증거 +Chips"). 블라인드 = 사건의 난이도. 점수 = 사건 해결 설득력. 단서 카드 조합의 **곱셈 시너지**를 발견하는 것이 마스터리.

### 2b. Inscryption

- **코어 루프**: 3막 구조. 각 막에서 규칙(덱빌딩의 성질)이 바뀌지만 카드 플레이의 **근본 규칙은 유지**. 랜덤 맵을 돌며 전투·카드 추가/제거, 사이사이 메타·탈출방·퍼즐. ([Wikipedia](https://en.wikipedia.org/wiki/Inscryption))
- **학습·마스터되는 것**: "**주어진 규칙만 따르면 절대 못 이긴다**." 규칙을 진짜로 집어 들고(문자 그대로 룰북을 넘겨 숨은 단서를 찾고) 위에 쌓아 익스플로잇해야 한다. 메타픽션적 규칙 파괴 자체가 학습 대상. ([slantmagazine](https://www.slantmagazine.com/games/inscryption-review-daniel-mullins/))
- **수집→플레이 통합**: 카드 획득이 전투 재료이자 **퍼즐 재료**(특정 카드가 탈출방/ARG 해법의 열쇠). 수집물이 단순 전투 부품을 넘어 **내러티브·퍼즐의 키**가 되는 하이브리드.
- **솔로 웹 축소 가능성**: **중간**. 코어 카드 배틀은 축소 가능하나, Inscryption의 매력 대부분은 고비용 연출·메타 반전·ARG. 웹 솔로 개발로 "규칙이 막마다 리믹스되는" 구조 아이디어는 차용 가능하되 연출 규모는 감당 어려움.
- **PD 적용**: 막마다 사건 유형이 바뀌며(밀실→도난→실종) 같은 "추론 동사"를 새 규칙으로 리믹스 = Koster의 변주 구조와 정확히 일치. "룰북에 숨은 단서" = 추리소설 원문 텍스트에 숨은 단서.

> **로그라이트 가족 요약 (Koster 렌즈)**: 동사 = "런 안에서 점수/생존 엔진을 조립". Balatro는 **온보딩 쉬움 + 마스터리 천장 극대(시너지 곱셈)** + 강한 주스 피드백으로 Koster 이상에 가장 근접. 정적 웹 솔로에 최적. Inscryption은 "막마다 규칙 리믹스"라는 변주 구조가 참고 가치 크나 연출 규모가 걸림돌.

---

## 3. 컬렉션 중심 (Collection-Centric)

### 3a. Marvel Snap (모던 TCG의 압축)

- **코어 루프**: **12장 덱** 구성 → 6턴, 3개 로케이션에 카드 배치 → 로케이션이 턴마다 하나씩 공개되어 적응 강제 → "스냅"(판돈 베팅)으로 스테이크 조절.
- **학습·마스터되는 것**:
  - **덱 제약 하 시너지**: 12장 하드캡이 매 카드 선택을 고밀도로 만든다.
  - **불완전 정보 적응**: 로케이션이 순차 공개되므로, 특화 덱조차 적응해야 한다. 상대의 마지막 배치를 예측하는 마인드 게임. ([toucharcade 가이드](https://toucharcade.com/2022/12/29/marvel-snap-deck-building-guide-best-decks-play-and-win/), [charlieintel 로케이션](https://www.charlieintel.com/news/every-marvel-snap-location-and-effect-221968/))
  - **스냅/리트리트 판단**: 언제 물러설지 = 기댓값 계산. ([tiltingatpixels](https://tiltingatpixels.com/post/Marvel-Snap/))
- **수집→플레이 통합**: 카드 풀 수집(컬렉션 레벨)이 **덱 구성 재료를 넓힌다**. 수집(장기 메타)과 대결 플레이(세션)가 분리되어 있으면서 서로를 먹인다 — **B+C 분리 구조에 가장 가까운 상용 사례**.
- **솔로 웹 축소 가능성**: **중간(대결이 걸림돌)**. 코어는 PvP. 서버 없는 정적 웹은 **결정론적 봇/스크립티드 상대**로 대체해야 함(로케이션은 시드로 고정). 12장·3레인·6턴이라는 **작은 격자**는 솔로 개발·웹에 유리.
- **PD 적용**: 3개 로케이션 = 사건의 3개 현장/국면. 카드 = 인물·단서. 로케이션 순차 공개 = 수사 중 밝혀지는 새 사실에 대한 적응. "스냅" = 결론을 조기 확신하는 베팅(자신감 걸기).

### 3b. 가챠 / 도감(Dex·앨범) 수집 루프

- **코어 루프**: 획득(뽑기/드롭) → 도감/앨범 슬롯 채우기 → 완성 편향이 다음 획득을 유도하는 자기강화 사이클. ([compulsion loop, Wikipedia](https://en.wikipedia.org/wiki/Compulsion_loop))
- **심리 기제**: 가변 보상 스케줄(operant conditioning, Hopson의 "Behavioral Game Design")이 습관을 형성. 한 아이템을 얻으면 "**완성 편향(completion bias)**"이 세트 완성 욕구를 촉발하고, 수집물 자체가 다음 행동을 촉발하는 투자물이 된다. ([grokipedia: compulsion loop](https://grokipedia.com/page/Compulsion_loop), [uism UX 분석](https://uism.co.jp/en/blog/why-are-people-obsessed-with-gacha-what-capsule-toys-can-teach-us-about-ux-engagement-strategy/))
- **학습·마스터되는 것 (Koster 경고)**: **거의 없다.** 순수 수집 루프는 마스터할 패턴이 얕다 — 학습이 아니라 조건화된 반복. Koster 렌즈에서 이것은 "재미"가 아니라 **동기 유발 장치**다. 상업적으로는 강력하지만 마스터리 천장이 없어 금세 권태에 이르거나 착취적으로 흐른다.
- **수집→플레이 통합**: 기본형에서는 **통합이 약하다** — 수집이 플레이를 먹이지 않고 수집 자체가 목적. caseCollection은 이 함정을 피해야 한다.
- **솔로 웹 축소 가능성**: **매우 높음(기술적으로)**. localStorage로 도감 상태 저장이면 서버 불필요. 단 결제 없는 프로젝트라 가챠의 화폐/RNG 착취 요소는 부적합하고 불필요.
- **PD 적용 (권장 방식)**: 도감을 **동기 레이어**로만 쓰고 획득 조건을 "추리 플레이(B)"에 묶는다. 즉 뽑기가 아니라 **사건 해결 = 카드 언락**. 완성 편향(홈즈 정전 60편 도감 채우기)은 강력한 장기 리텐션 훅이 되지만, 마스터리는 B에서 와야 한다.

> **컬렉션 가족 요약 (Koster 렌즈)**: 수집은 최강의 **동기**이나 최약의 **마스터리 원천**. Marvel Snap은 "수집이 덱 구성 옵션을 넓히고, 별도의 스킬 세션이 마스터리를 담당"하는 **이상적 B+C 분리 템플릿**을 보여준다. 순수 가챠/도감은 동기 레이어로만 채택하고 마스터리는 다른 가족에서 빌려야 한다.

---

## 4. 추리·퍼즐 (Deduction / Puzzle) — caseCollection의 심장

이 가족이 "B(짧은 추리 플레이)"의 직접 원천이다. 공통 원리: **게임이 답을 떠먹여 주지 않고, 플레이어가 스스로 통찰을 driving한다.**

### 4a. Return of the Obra Dinn

- **코어 루프**: 시신 장면(정지된 순간)을 조사 → 증거인지 아닌지 스스로 판단 → 인물·사인을 추론 → **3개 단위로만 정답 확정(lock-in)**.
- **핵심 설계**:
  - **최소한의 명시적 안내**로 플레이어 자율성 극대화. 게임은 손을 잡고 끌지 않는다 — 무엇이 증거인지, 어떤 리드를 따를지, 어떻게 연결할지 모두 플레이어 몫. ([criticalvideogamestudies](https://criticalvideogamestudies.com/return-of-the-obra-dinn-the-mechanic-of-intuition/), [frostilyte](https://frostilyte.ca/2019/05/16/a-look-at-deduction-in-return-of-the-obra-dinn/))
  - **3개 단위 확정**: 무차별 대입(brute-force)을 막는 장치. 이후 추리 장르의 표준이 됨. ([Wikipedia](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn))
  - **다중 해법 경로**: 같은 인물을 도구·자세·억양·소거법 등 완전히 다른 방법으로 특정 — 스포일 없이 "노트 비교"가 흥미롭다.
- **학습·마스터되는 것**: "관찰 → 가설 → 교차검증"이라는 추론 동사. 3개 확정이 **부분 정답 피드백**을 주어 학습 루프를 닫는다.
- **수집→플레이 통합**: 여기서 "수집물"은 **관찰한 사실/증거**다. 사실을 모을수록 소거 공간이 좁아진다 — 수집이 곧 추론 재료.
- **솔로 웹 축소 가능성**: **높음(메커닉만)**. 3D 시간정지 연출은 비싸지만, "부분 정답을 N개 단위로만 확정 + 소거 추론"이라는 **규칙 코어**는 웹 2D로 완전 이식 가능하고 저렴.
- **PD 적용**: 정전 삽화/텍스트 장면을 정지 화면으로 제시 → "누가/무엇을/어떻게"를 채우고 3개 단위로 확정. 홈즈식 "관찰로 신원 추론"과 완벽히 맞음.

### 4b. The Case of the Golden Idol

- **코어 루프**: 한 장면(정지된 범죄 현장)에서 하이라이트된 단어를 클릭해 **word bank**에 수집 → 색상별(이름/명사/동사) 단어를 문장 빈칸에 드래그(Mad Libs식) → 인물 식별 + 커스텀 퍼즐 해결 → 다음 장면. ([thinkygames](https://thinkygames.com/games/the-case-of-the-golden-idol/), [gamedeveloper](https://www.gamedeveloper.com/design/case-of-the-golden-idol))
- **핵심 설계 (개발자 1차 증언)**:
  - **어휘 배치가 동사**: "완전한 문장을 만들라"는 이상적 접근은 너무 경직 → "여기 구절들이 있다, 어디에 들어갈 것 같나?"라는 **배치형**이 훨씬 잘 작동. ([gamedeveloper](https://www.gamedeveloper.com/design/case-of-the-golden-idol))
  - **brute-force 방지 + 진행 피드백**: 단일 "오답" 메시지가 좌절을 유발 → "**두 칸 이하가 틀렸다**"는 지표를 추가해 갇힘과 진행을 균형. (완전 정답 위치는 안 알려주되 근접도는 준다.)
  - **thought path(사고 경로)**: 순차적 논리 연결 설계 — "어느 열쇠가 어느 문을 여는지 → 살인자의 방 → 그 방에 사는 사람 → 살인자 이름". 단서가 사슬로 이어진다.
  - **철학**: 플레이어가 탐정처럼 느끼는 건 "디어스토커 모자 때문이 아니라 똑똑해서 풀었기 때문" — hand-holding보다 "Aha!" 순간 우선. ([gamedeveloper](https://www.gamedeveloper.com/design/case-of-the-golden-idol))
- **학습·마스터되는 것**: "단서 어휘를 수집 → 논리 사슬로 문장을 완성"하는 동사. 장면마다 새 어휘·새 사슬로 **같은 동사를 리믹스**(Koster 변주).
- **수집→플레이 통합**: **수집물(단어 카드)이 곧 퍼즐 해결 재료**. 이것이 caseCollection의 B+C에 가장 이상적인 통합 — 수집과 사용의 경계가 자연스럽게 하나의 동사 안에 녹아든다.
- **솔로 웹 축소 가능성**: **매우 높음**. 2D 정지 장면 + 텍스트 + 드래그드롭. 순수 클라이언트, 서버 불필요. 솔로 개발 규모에 가장 적합. 콘텐츠(장면·정답 로직) 제작 비용이 주 병목.
- **PD 적용**: 원작 소설 문단에서 단서 단어를 하이라이트 → word bank 수집 → "범인은 ___, 흉기는 ___, 동기는 ___" 빈칸 완성. 홈즈/뤼팽 텍스트가 그대로 콘텐츠가 된다.

### 4c. Her Story

- **코어 루프**: 경찰 DB에 **키워드 검색** → 매칭되는 짧은(수 초) 영상 클립이 시간순으로 상위 5개만 노출 → 클립에서 새 키워드를 얻어 다시 검색 → 비선형으로 이야기를 재구성. ([Wikipedia](https://en.wikipedia.org/wiki/Her_Story_(video_game)), [thinkygames](https://thinkygames.com/games/her-story/))
- **핵심 설계**: 진행 게이트는 오직 **플레이어의 어휘(아는 단어)**. 이론상 어떤 클립이든 언제든 접근 가능 — 호기심이 이끄는 대로 어디로든 갈 수 있다. 대부분의 플레이어가 서로 다른 경로/순서로 이야기를 조립. ([mechanicsofmagic](https://mechanicsofmagic.com/2021/05/11/the-curious-case-of-her-story/))
- **학습·마스터되는 것**: "**어떤 단어를 검색하면 새 사실이 열릴까**"를 추론하는 메타 동사. 탐정 작업의 근본 판타지를 진짜로 구현한 소수 게임.
- **수집→플레이 통합**: "수집물" = 발견한 클립/키워드. 키워드가 다음 검색의 열쇠 = **수집이 진행의 연료**. 단, 명시적 "정답 판정"이 약해(자유 서사) 마스터리 피드백이 흐릿한 편.
- **솔로 웹 축소 가능성**: **매우 높음(구조)**. 검색→콘텐츠 언락은 순수 클라이언트로 구현 쉬움. 다만 원본이 실사 영상이라 caseCollection은 텍스트·삽화 클립으로 대체.
- **PD 적용**: 사건 증언/신문 조서를 텍스트 클립으로 DB화 → 키워드 검색으로 언락. 홈즈가 목격자 진술을 교차 검색하는 감각. "검색으로 카드(증언) 수집"이라는 B의 대안 형태.

> **추리·퍼즐 가족 요약 (Koster 렌즈)**: 동사 = "스스로 증거를 판단하고 논리로 연결". Golden Idol의 **word bank 배치 + 근접도 피드백 + 사고 경로 사슬**은 caseCollection의 B에 가장 즉시 이식 가능하고, "수집물이 곧 퍼즐 재료"라 B+C 통합이 자연스럽다. Obra Dinn의 **N개 단위 확정**은 brute-force 방지의 검증된 표준 장치. Her Story의 **검색 언락**은 카드 수집을 진행에 묶는 우아한 대안.

---

## 5. 하이브리드 사례 (수집이 곧 퍼즐/플레이 재료)

- **Inscryption (2b 재조명)**: 수집 카드가 전투 부품이자 **탈출방·ARG 퍼즐의 열쇠**. "수집물이 퍼즐 해결 재료"의 상용 증명. 다만 연출 규모가 큼. ([perkatonic](https://www.perkatonic.com/en/article/74/inscryption-daniel-mullins-games-devolver-digital-impression-game-videogame-indie-card-deck-builder))
- **The Case of the Golden Idol (4b 재조명)**: 사실상 **"수집(단어) = 퍼즐 재료"의 순수형**. 별도 전투 없이 수집→배치가 그대로 코어 루프.
- **보드게임 하이브리드**:
  - **Detective: A Modern Crime Board Game** — 사건이 **카드 덱**으로 표현되고, 플레이어가 정보·단서를 모으고 리드를 따라가며 마지막에 질문에 답해 승점 획득. "단서 카드 수집 → 결론 논증"의 아날로그 원형. ([detectiveboardgame](https://detectiveboardgame.com/detective-a-modern-crime-boardgame/), [ultraboardgames 규칙](https://www.ultraboardgames.com/detective-a-modern-crime-board-game/game-rules.php))
  - **Chronicles of Crime** — 앱 + QR 카드로 용의자 신문/증거 조사. 카드 스캔 = 정보 언락. 정적 웹으로 치환 시 "카드 클릭 = 정보 언락"과 동형. ([coopgestalt](https://coopgestalt.com/2020/12/05/top-10-cooperative-detective-board-and-card-games/))
- **함의**: caseCollection의 가장 자연스러운 하이브리드 축은 **"추리(B)로 단서·인물 카드를 획득 → 그 카드가 다음(더 큰) 사건의 추론/덱 재료가 된다(C)"**. Golden Idol의 word bank를 "영속 수집 카드"로 승격하면 B와 C가 하나의 동사로 이어진다.

---

## 6. caseCollection 후보 코어 루프 비교 (Koster 렌즈)

아래 표는 B+C 하이브리드로 성립 가능한 후보 5개를 Koster 기준으로 평가한다.
평점: ◎ 강함 / ○ 보통 / △ 약함.

| 후보 루프 | B(획득) 동사 | C(사용) 동사 | 학습 곡선 | 마스터리 천장·변주 | 정적 웹·솔로 적합성 | PD 소재 적합성 | 종합 |
|---|---|---|---|---|---|---|---|
| **A. 단서-투-덱 (Golden Idol × Slay the Spire)** | word bank 배치로 미니 케이스 해결→단서/인물 카드 언락 | 언락 카드로 짧은 논증 덱 전투(사건=적) | ○ 두 동사라 온보딩 부담 | ◎ 추론+덱 시너지 이중 심화, 케이스·카드 교체로 변주 | ○ 2D로 가능하나 밸런싱·콘텐츠 2배 | ◎ 단서·인물이 자연히 카드화 | **최유력** |
| **B. 수집=퍼즐재료 (순수 Golden Idol형)** | 소설 텍스트에서 단어 카드 수집 | 그 카드를 다음 장면 빈칸에 배치(수집·사용 일체) | ◎ 단일 동사, 매우 명료 | ○ 사고 경로 사슬로 심화, 하지만 전투식 시너지 없음 | ◎ 드래그드롭+텍스트, 최소 규모 | ◎ 원문이 곧 콘텐츠 | **최안전** |
| **C. 단서-투-스냅 (Her Story/Golden Idol × Marvel Snap)** | 추리로 인물·단서 카드 획득 | 12장급 소형 덱으로 3현장 짧은 대결(vs 스크립트 봇) | ○ Snap 규칙 학습 필요 | ◎ 로케이션 변주로 재플레이성 높음 | ○ 봇/시드로 PvP 대체 필요 | ○ 대결 프레이밍이 추리 톤과 이질적 | 중상 |
| **D. 단서-투-점수엔진 (× Balatro)** | 추리로 조커격 "추론 특기" 카드 획득 | 단서 조합 핸드로 점수 최적화 짧은 런 | ◎ 포커식 온보딩 쉬움 | ◎ 곱셈 시너지로 천장 극대 | ◎ 저사양 싱글, 웹 최적 | △ 점수·조커 은유가 추리 서사와 약결합 | 중상 |
| **E. 도감완성 + 라이트 사용 (가챠/Dex × 라이트 덱)** | 사건 해결로 도감 카드 언락(뽑기 아님) | 수집 카드로 가벼운 덱 편성 | ◎ 매우 쉬움 | △ 마스터리 얕음(수집=동기, 사용=얕음) | ◎ localStorage로 충분 | ◎ 홈즈 정전 60편 도감이 강한 훅 | 리텐션 보조용 |

### 각 후보의 리스크

- **A. 단서-투-덱** — *두 코어 시스템을 솔로로 밸런싱·콘텐츠 제작해야 함(범위 폭발 위험).* B와 C의 톤/난이도 접합부가 어색할 수 있다. MVP를 B만으로 먼저 검증 후 C를 얹는 단계적 접근 권장.
- **B. 수집=퍼즐재료** — *마스터리 천장이 "추론 난이도"에만 의존* → 콘텐츠(케이스) 소진 시 리플레이성 급락. Koster의 권태 문제 직격. 절차적 케이스 생성 또는 변주 규칙(막마다 규칙 리믹스, cf. Inscryption)으로 수명 연장 필요. **정답 로직 저작 비용**이 주 병목.
- **C. 단서-투-스냅** — *PvP 코어를 봇으로 대체하면 마인드게임(상대 예측)이라는 핵심 재미가 증발.* 로케이션 시드·봇 AI 설계 난도. 대결 은유가 "협력적 추리" 톤과 충돌할 위험.
- **D. 단서-투-점수엔진** — *Koster 렌즈에서 마스터리는 최상이나 내러티브 결합이 가장 약함* — 점수 최적화가 "추리"로 느껴지지 않으면 소재가 순수 드레싱으로 전락(정확히 caseCollection이 피하려는 실패). 은유 설계에 사활.
- **E. 도감완성** — *단독 코어로는 마스터할 패턴이 얕아 착취적/공허해지기 쉬움.* 결제 없는 프로젝트라 가챠 RNG는 부적합. **반드시 A/B/D 위에 얹는 리텐션 레이어로만** 채택.

---

## 7. 결론 및 권고

1. **B의 코어 동사는 Golden Idol형 "단서 배치 + 근접도 피드백 + 사고 경로 사슬"을 채택**하라 — 정적 웹·솔로·한국어·PD 텍스트에 모두 최적이고, "수집물이 곧 퍼즐 재료"라 B+C 통합이 자연스럽다. brute-force 방지는 Obra Dinn식 **N개 단위 확정** 또는 Golden Idol식 **"N칸 이하 오답" 근접도 지표**로 해결.
2. **가장 안전한 시작점은 후보 B(수집=퍼즐재료 순수형)로 MVP**, 검증 후 **후보 A(단서-투-덱)로 C를 확장**하는 단계적 로드맵. 이러면 Koster의 "동사를 먼저 가르치고 나중에 리믹스"가 개발 순서와도 일치한다.
3. **후보 E(도감/완성 편향)는 코어가 아니라 장기 리텐션 레이어로만** — 홈즈 정전 도감 완성을 동기 훅으로 쓰되, 언락 조건을 반드시 추리 플레이에 묶어 마스터리를 B에 유지.
4. **소재는 드레싱임을 잊지 말 것** — 플레이어가 재미를 느끼는 지점은 홈즈라는 껍질이 아니라 "내가 똑똑해서 풀었다"는 추론 마스터리여야 한다(Golden Idol 원칙).
5. **리플레이성/권태 대책이 최대 설계 과제** — 순수 추리 케이스는 소진되면 리플레이성이 낮다. 절차적 케이스 변주(Inscryption식 막별 규칙 리믹스, Dominion식 "매 케이스 다른 기법 세트") 또는 후보 D의 점수엔진식 최적화 축을 보조 마스터리 레이어로 검토.

---

## 참고 출처

**평가 렌즈 (Koster)**
- A Theory of Fun — Game Studies Wiki: https://game-studies.fandom.com/wiki/A_Theory_of_Fun_for_Game_Design
- Games as Learning in Koster — Bumbling Through Dungeons: https://bumblingthroughdungeons.com/theory-fun-game-design-raph-koster/

**덱빌더**
- Why Slay the Spire Still Rules — VideoGamer: https://www.videogamer.com/features/why-slay-the-spire-still-rules-the-roguelike-deckbuilder-genre/
- Slay the Spire Tips — Eneba: https://www.eneba.com/hub/games/game-guides/slay-the-spire-tips/
- Building the "First Game" engine — Dominion Strategy: https://dominionstrategy.com/2012/07/30/building-the-first-game-engine/
- Dominion — Wikipedia: https://en.wikipedia.org/wiki/Dominion_(card_game)
- Dominion (2008) — Meeple Like Us: https://www.meeplelikeus.co.uk/dominion-2008/

**로그라이트 카드**
- How Balatro Became One of the Most Addictive Roguelikes — Goomba Stomp: https://goombastomp.com/how-balatro-became-one-of-the-most-addictive-roguelikes/
- Balatro: Juicy Feedback — Blake Crosley: https://blakecrosley.com/guides/design/balatro
- Unpacking Balatro's Addicting Game Design — Error & Exp: https://errorandexp.substack.com/p/unpacking-balatros-addicting-game
- In-Depth Analysis of Balatro's Design — Oreate AI: https://www.oreateai.com/blog/indepth-analysis-of-the-game-design-philosophy-and-roguelike-mechanisms-in-balatro/4fdfc5f5314b10a83aa161f2aa243254
- Inscryption — Wikipedia: https://en.wikipedia.org/wiki/Inscryption
- Inscryption impression — Perkatonic: https://www.perkatonic.com/en/article/74/inscryption-daniel-mullins-games-devolver-digital-impression-game-videogame-indie-card-deck-builder

**컬렉션 중심**
- Marvel Snap Deck Building Guide — TouchArcade: https://toucharcade.com/2022/12/29/marvel-snap-deck-building-guide-best-decks-play-and-win/
- Every Marvel Snap location — Charlie Intel: https://www.charlieintel.com/news/every-marvel-snap-location-and-effect-221968/
- Marvel Snap Review — Tilting at Pixels: https://tiltingatpixels.com/post/Marvel-Snap/
- Compulsion loop — Wikipedia: https://en.wikipedia.org/wiki/Compulsion_loop
- Compulsion loop — Grokipedia: https://grokipedia.com/page/Compulsion_loop
- Why Are People Obsessed with Gacha — UISM: https://uism.co.jp/en/blog/why-are-people-obsessed-with-gacha-what-capsule-toys-can-teach-us-about-ux-engagement-strategy/

**추리·퍼즐**
- Return of the Obra Dinn: The Mechanic of Intuition — CVGS: https://criticalvideogamestudies.com/return-of-the-obra-dinn-the-mechanic-of-intuition/
- A Look at Deduction in Obra Dinn — Frostilyte: https://frostilyte.ca/2019/05/16/a-look-at-deduction-in-return-of-the-obra-dinn/
- Return of the Obra Dinn — Wikipedia: https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn
- Pursuing the "Aha!" moment — Game Developer (개발자 인터뷰): https://www.gamedeveloper.com/design/case-of-the-golden-idol
- The Case of the Golden Idol — Thinky Games: https://thinkygames.com/games/the-case-of-the-golden-idol/
- Her Story — Wikipedia: https://en.wikipedia.org/wiki/Her_Story_(video_game)
- The Curious Case of Her Story — Mechanics of Magic: https://mechanicsofmagic.com/2021/05/11/the-curious-case-of-her-story/

**하이브리드 / 보드게임**
- Detective: A Modern Crime Board Game — 공식: https://detectiveboardgame.com/detective-a-modern-crime-boardgame/
- Detective 규칙 — UltraBoardGames: https://www.ultraboardgames.com/detective-a-modern-crime-board-game/game-rules.php
- Top 10 Cooperative Detective Games (Chronicles of Crime 등) — Coopgestalt: https://coopgestalt.com/2020/12/05/top-10-cooperative-detective-board-and-card-games/
