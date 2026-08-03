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
  - 정적 클라이언트 온리 웹 게임 — 서버 없음, GitHub Pages/자체 호스팅, localStorage 저장 → 런타임 LLM 배제, 콘텐츠는 빌드타임 생성
  - Dead Letters와 독립 — 원작(PD 소설) 데이터 직결, 세계관 미공유. ~~캐릭터 미공유~~ → **2026-07-25 개정: 탐정 레이든 1명만 차용**(13 세션, Out of scope 항목 참조). 나머지 캐릭터·세계관은 여전히 미공유
  - 코어 루프 방향: B+C 하이브리드(플레이로 카드 획득 + 수집물의 게임적 사용) — 확정은 코어 루프 티켓에서
  - 한국어 우선, 영어는 파이프라인 슬롯만
  - 재사용 = 모듈(추출된 코어) + 플로우(추출 절차의 일반화 스킬) 둘 다 — 이번 추출이 플로우의 첫 검증 사례
  - 코어 경계 시작 가설: 생성된 위키 데이터 + 조회 레이어(최소). 생성 파이프라인 포함 여부는 게임 요구 확정 후
- **협업**: 코딩 구현·리뷰 위임은 Codex 우선. 운영 규약(권한 모델·Entry Lane A/B·위임 계약·실패 처리)은 `docs/agents/codex-collab.md`가 정본 — 지도에는 상세를 두지 않는다. 서브에이전트 모델은 **Opus** 사용(Fable 세션 한도 절약, 2026-07-19 지시).
- **마일스톤**: 2026-08 첫 공개 빌드 목표 — 느슨한 제약, MVP 스코프 티켓에서 참고.
- **스킬**: 티켓 해소는 /grilling + /domain-modeling 기본, prototype 티켓은 /prototype. 용어는 OUT `CONTEXT.md` 준수. 주의: OUT 용어집에서 "case"는 기피어(에피소드 인스턴스와 혼동) — 이 프로젝트에서 "case"를 핵심 명사로 재정의하려면 /domain-modeling으로 명시적 결정하고 이 레포의 `CONTEXT.md`에 기록.
- **트래커**: 로컬 마크다운 — 운영 규약은 `docs/agents/issue-tracker.md`의 "Wayfinding operations".
- **프로토 브랜치 귀멸화** (2026-07-23): `prototype/core-loop`가 `main`에 병합됨(머지 커밋 b2596bf) — 코어 루프가 [17](issues/17-context-semantics-prototype.md)로 전면 검증됐고 사용자 방향("코어 유지+퍼즐 추가+시각화")이 확정되면서, prototype/ 스킬의 기본값("throwaway, out of main")을 이 효과가 명시적으로 오버라이드. **/ 유예 (2026-07-28): 이 오버라이드는 절대적이지 않다** — [18](issues/18-case-generator-shape.md)의 case 생성기와 [26](issues/26-openwiki-candidate-discovery-pilot.md)의 OpenWiki 파일럿은 `.worktrees/`에 **격리 유지**가 사용자 결정이다("일단 유지"). 기각이 아니라 유예이므로 병합 여부는 다시 열릴 수 있고, 그때까지 **두 브랜치의 검증 결과는 main에서 재현되지 않는다**. `prototype/core-loop/`는 이제 main의 정식 작업 트리 일부 — 향후 세션은 그 안에서 직접 이어서 구현한다. 2026-07-28에 [16](issues/16-external-data-pack-loading.md)·[14](issues/14-tag-extraction-promotion.md)가 `game-data-pack@2`와 추출 파이프라인을 완성해 이전 타입 오류 경고는 해소됐다.
- **⚠️ 예외 — `prototype/case-generator-shape`는 아직 격리 유지** (2026-07-27): [18](issues/18-case-generator-shape.md)의 순수 로직 프로토(`2d4f42d`)는 위 오버라이드 대상이 **아니다** — main에 없고 별도 브랜치+워크트리(`.worktrees/case-generator-shape`)에만 있다. 병합 여부는 사용자 판단으로 [28](issues/28-case-generator-e2e-datapack-prototype.md)이 실 sLLM·실 원문까지 이어붙일 때로 미뤄졌다(28의 Comments 참조) — 지금 시점에 "프로토는 main에 있다"고 가정하지 말 것.

## Decisions so far

<!-- one line per closed ticket: [검증마커] name(link) — gist [/ 기각: 검토 후 배제한 대안] -->
<!-- 기각 표기 규약: 요약이 채택안만 남기면 명시적 기각이 "공백"으로 오독된다(실증: docs/research/2026-07-20-cross-research-audit.md §3).
     결정 과정에서 검토 후 배제·유예한 대안이 있으면 줄 끝에 `/ 기각:` 또는 `/ 유예:`로 남길 것. 상세는 티켓 원문이 정본. -->
<!-- 검증 상태 표기 규약 (2026-07-21): closed는 "결정됐다"일 뿐 "검증됐다"가 아니다. 마커 없이 나열하면
     프로토로 9회 두들겨 맞은 결정과 종이 위 설계가 똑같이 확정돼 보여, 후속자가 미검증 설계 위에 스펙을 쓴다.
     각 항목 앞에 붙일 것 (기준 = "실행으로 증명됐는가" — 게임플레이면 플레이, 아키텍처면 구축):
       `[검증]`      — 실행으로 확인됨 (반증 시 재개정 이력 있음)
       `[종이]`      — 논증으로 확정, 실행 검증 없음 → 스펙/구현 전 프로토 필요
       `[검증+종이]` — 원안은 검증됐으나 이후 개정분이 미검증 (혼재). 어느 쪽이 미검증인지 gist에 명시
       `[조사]`      — 리서치 산출물 (검증 대상이 아니라 근거)
     `[종이]`·`[검증+종이]`가 붙은 결정은 대응하는 prototype 티켓이 프론티어에 있어야 한다.
     현재: 03·04·12의 미검증분은 17로 검증 완료(2026-07-23). 06·07의 구축 검증 → 스펙 ② 작성·실행 단계. -->

- `[조사]` [메커닉 설계 공간 서베이](issues/01-mechanic-survey.md) — 권고: 수집=퍼즐재료(Golden Idol형)로 MVP 후 단서-투-덱(×StS)으로 확장; Balatro형 점수엔진은 마스터리 최고나 내러티브 결합 최약, 도감은 리텐션 레이어; 최대 과제는 리플레이성.
- `[조사]` [위키 데이터 인벤토리](issues/02-wiki-data-inventory.md) — 카드화 1순위는 clue_type(49)·story(77), case_pattern(4)은 희귀 소재, work(110)는 얇음; 최대 공백은 이미지 전무·수치/희귀도 근거 부재·캐릭터 1급 노드 부재. graph.json은 코드 그래프라 무관.
- `[조사]` [획득 구조 레퍼런스 리서치](issues/09-acquisition-reference-research.md) — 6개 패턴 조사(Balatro/Snap/Dominion/Chants·Golden Idol/Wildfrost + BGG Tech-Tree 대응); 정적웹·1인개발엔 결정론 계열이 최적, MVP는 어휘 확정 게이트+고정공급 기회비용+선택형 단서팩(무중복 편향) 조합 권고, 가챠 피티·다층 라이브 경제는 과설계로 배제.
- `[검증]` [코어 루프 확정](issues/03-core-loop.md) — ⓑ Golden Idol형 MVP(→ⓐ 확장); case=생성 사건 퍼즐("case" 재정의, CONTEXT.md 신설), 패턴 골격×story 소재풀; 어휘 게이트+게스트 단서 학습형; 근접도+3개 확정 판정; 연속 런(3~5건+복합패턴 보스); 라이프 대신 문맥 태그 시스템(배경 상태×태그 조합식, 인터루드 이벤트, BAD 엔딩). **2026-07-20 정식 재개정(반증 없음, 통합 루프로 확장)**: ①빈칸 추리문에서 정답 축(근접도)+서사 축(인접 링크·응집도)이 함께 — "정답 채우기"→"옳으면서 앞뒤 맞는 이야기 짓기", 정답=응집 full로 정렬 ②**반응 레이어가 재미의 핵심 축**(드라마투르기 코믹 패턴 생성+레이든 페르소나) ③**kind×frame 의미 어휘**가 반응·응집·정렬의 공통 토대(→04에 kind 필드 추가 필요) ④문맥 태그=**영역 다수결**(은밀↔공개·강압↔신중 줄다리기, 임계 넘으면 판정 규칙 flip) ⑤인터루드=조사 미니루프+**AP 배분 퍼즐** ⑥재확인(검토) 루프 ⑦클리어 피드백 단계. **새 제약**: case 생성기는 "풀 수 있음 + 정답이 이야기로 성립함" **이중 제약** 필수. **/ 기각**: 권태 대책으로 규칙 변주 모디파이어·일일 사건·도감 리텐션 레이어 제외(01 서베이 권고 중 점수엔진식 보조 마스터리 축도 미채택 — 반응 레이어·영역 다수결로 대체). 잔여 리스크는 감사 §2-3. 3차 개정분(③배치=확정·④보유≠앎)은 [17](issues/17-context-semantics-prototype.md)로 검증 완료(2026-07-23). Resolution은 2026-07-21 통합 재작성됨(개정 이력 별도 보존).
- `[검증]` [웹 스택과 디바이스 타깃](issues/05-web-stack.md) — Svelte 5+Vite+TS(SvelteKit 미사용), DOM+절제된 juice(부족 시 PixiJS 레이어 해치, 프로토에서 검증); 데스크톱 우선·클릭/탭 기반 터치 호환; 배포는 GitHub Pages(정본)+Higgsfield 마켓플레이스 병행, Railway 배제. 핵심 가치 교정: 텍스트 중심 아님 — 퍼즐 명료성+카드 시너지. **⚠️ 배포 체인은 2026-07-25 개정** — 원 Resolution의 itch.io butler는 사용자 결정(itch.io·Patreon 미사용)으로 무효, 05의 `## Comments` 참조. Higgsfield는 약관상 정본이 될 수 없어 병행이 강제된다. 유료 채널은 Steam 후보(18 이후, 리드타임 6주+). **/ 기각**: itch.io 전면(무료·유료 모두), Patreon 시차 공개 모델, Higgsfield 웹사이트+Stripe 직판(검증 완료 후 후순위 대기 [10001](issues/10001-higgsfield-stripe-storefront.md)).
- `[조사]` [최신 추상전략게임 메커닉 리서치](issues/15-abstract-games-research.md) — 핵심: "정답 맞히기+시나리오 조립" 통합은 **Golden Idol(2022)식 빈칸 추리문**로 이미 검증됨(caseCollection 추리문이 이미 그 형태). 톱 추천=①빈칸 추리문을 통합 척추로(v4 시나리오 보드를 추리문 자체로 흡수) ②인접 시너지(Azul) ③제약 만족 재확인(Obra Dinn/CSP) ④문맥 태그=영역 다수결(Tigris→12) ⑤템포(Dune)로 인터루드 추상화. 통합=봉합 아님, 추리문 위에 층층이 쌓기.
- `[검증]` [카드 스키마와 카드화 대상](issues/04-card-schema.md) — 컬렉션 = 단서 49 + 패턴 4(가설 선언 어휘 — 03 소폭 개정, 프로토 검증); 힌트는 소모형 순수 수제; 스키마 = id·name·suit·tags(공개)·insight·text(비공개→수사 노트 해금)·art(개별 슬롯+폴백), 수치·희귀도 없음; 텍스트 전량 카드용 재작성(위키 id 링크 유지); 태그 값은 수제 시드 → 원문 추출 2단계 승격(신규 티켓 14); 컬렉션은 슈트 4종 + 보유율×검증율 2축, 세트 없음. 12발 개정분(kind→facet 목록·노트 facet별 해금)은 [17](issues/17-context-semantics-prototype.md)로 검증 완료(진행도 3축 표시는 컬렉션 UI 사안 — 스펙에서 다룸).
- `[종이]` [획득 구조 세부 확정](issues/10-acquisition-detail.md) — 프레임 권고 1+3+2(어휘게이트+고정진열+선택팩); 영구화는 04의 보유×검증 2축 매핑(보유=case클리어 즉시, 검증=런완주 승격, 개방형 풀); BAD엔딩=검증승격 0·보유 전량보존(깔끔한 베팅); 지급 3분할(case=게스트/인터루드=고정진열 정조준구매/완주=선택팩); 수사포인트 화폐·힌트카드 둘 다 런한정·인터루드 진열구매(오답 이중처벌 회피 위해 화폐는 가산보너스); 완주팩 5중1+미보유가중치+승격권폴백; 진행=소수스타터+런마다 진열변주(하나만 변주). 수치 잠정 — 프로토서 튜닝. **/ 유예**: 09 권고 4(자가선택 수사 렌즈)·5(힌트 카드 크래프팅)는 MVP 이후 확장.
- `[종이]` [OUT 코어 경계](issues/06-core-boundary.md) — 코어 = 재실행 가능 **빌드타임 콘텐츠 파이프라인**(C, 산출물=공유 데이터 팩); 코드 **OUT-구체**(X)·일반화는 플로우 스킬. IN=획득(pg_downloader·pg_pd_filter)+정제(text_cleaner)+생성(wiki-agent·wiki_seeder 통째)+씨앗데이터(docs/wiki)+조회(pd_wiki); OUT=episode_generator(Ren'Py·case생성기 참고원형)·game·graphify. 코어는 **게임무관**(L) — 문맥 태그 추출(14)은 게임측 레이어. 모딩=데이터 팩(오프라인 저작→정적 로드)만, 런타임 추출 배제. → 07 프론티어·신규 16.
- `[종이]` [모듈 패키징과 소비 인터페이스](issues/07-module-packaging.md) — 코어 형태=**자기완결 파이썬 패키지**(caseCollection 레포 내, 게임 import 0=L; 독립 레포는 2번째 소비자 때). 인터페이스=CLI가 **generic 코어 팩**(위키데이터+cleaned_texts, 게임무관) 방출. **빌드 체인 2단**: ①코어(스펙②, generic 팩)→②게임변환(스펙①, 카드재작성+태그추출+case생성=게임데이터); 태그추출 LLM·빌드타임→로드팩=변환완료 게임데이터, 모더 오프라인 생성. **빌드 (ii)분리**: 파이프라인 오프라인→게임데이터팩 JSON 커밋→순수 JS빌드가 읽음(웹빌드 파이썬0). base=커밋팩·mod=외부 동일포맷(16). → 16 프론티어, 스펙② 결정 거의 완결.
- `[검증]` [코어 루프 프로토타입](issues/11-core-loop-prototype.md) — 인터랙티브 웹 프로토 **v1~v9** 완주. **루프 반증 없음** — ①어휘게이트 ③런긴장 ⑤가설선언 ⑥수사노트 작동 확인. **최대 발견 = 반응 레이어**: "답/오답 이진 피드백은 납작하다, 엉뚱한 카드의 재미가 핵심"(플레이 반응) → 드라마투르기 패턴화(kind×frame 부조화→코믹 패턴 생성+레이든 페르소나)로 해결, 종이 설계에 없던 축. 리서치 톱5 메커닉 전부 구현·검증(빈칸추리문·인접시너지·제약재확인·영역다수결·템포). ②문맥태그는 영역 다수결로 구체화(→12 뼈대). **④DOM juice 충분 — PixiJS 해치 발동 불필요, 05 결정 유지 확정.** 파급: 03 정식 재개정·04에 kind 요건·12 프론티어 정리. 자산은 `prototype/core-loop` 브랜치(throwaway), 순수 모듈(engine·dramaturgy·scenario·persona·josa)은 스펙 입력으로 승격 권장. **/ 기각**: 시나리오 조립을 별도 모드로 유지(추리 보드에 흡수), kind-rank 코히런스 문법(과엄격 — 역할 적합으로 교체). **/ 유예**: ⑦⑧ 획득 경제(10의 수사 포인트·진열)는 프로토 미구현 → 통합 스펙 단계에서 반영.
- `[검증]` [문맥 태그 의미론 설계](issues/12-context-tag-semantics.md) — **핵심 전환: 태그는 "카드의 비용표"가 아니라 "카드가 무엇이 될 수 있는지의 목록".** 재미의 원천은 손익계산이 아니라 **용도의 다면성 발견**. ①카드가 **측면(facet)** 여러 개를 소유(`(frame,의미)` 쌍 — 실·섬유가 밀실선 침입도구, 투명인간선 신분단서) ②의미는 **이웃이 만들고 배경상태가 게이트**, **앞→뒤 단방향**(순환 없음, 배치 순서가 전략축) ③**배치=확정** — 놓으면 측면 확정, 앞으로 전파해 해석공간을 열고닫음, 되돌리면 뒤가 연쇄 해제 → 포석 플레이 성립. 확정 보상=노트 해금+서사 한 줄(강한 링크만 정보 보상) ④**수사 노트가 어휘 게이트를 심화** — 해금된 측면만 사용 가능(보유≠앎), 게스트가 측면도 빌려줌, 오답 해석도 줄 그어 기록(드라마투르기 반응이 수집물) ⑤상태=**2고정축+case별 가변축**(재사용 풀 6~8종 → 01의 리플레이성 과제 대응) ⑥오염 **정확히 3경로**(카드 태그·되돌리기→주목·가변축), 힌트는 자원만(자원/상태 경제 분리) ⑦실패=**등급형**, 죽는 방향 둘(공개과다=언론재판·강압과다=수사반붕괴), 은밀·신중 극단은 실패 아닌 **측면 막힘**(안전한 구석 없음), 4~5런 1회·반드시 예고. **팩트**: 위키 trope_tags는 149개 롱테일 → **재사용 태그 축 없음**, 수제/LLM추출(14). **파이프라인**: sLLM 대량생성 → **엔진 기계검증**(이중제약, 프로토 순수모듈) → LLM 취향필터. **/ 기각**: 전체 배열 제약만족 일괄해석(피드백 없음 — 11의 발견으로 회귀), 슬롯이 후보 좁히고 이웃은 보정만("이웃이 만든다" 희석). **/ 유예**: 교차 참조(두 측면 알면 제3 통찰 — 컬렉션이 그래프)는 조합폭발로 MVP 이후. [17](issues/17-context-semantics-prototype.md)로 전면 검증(2026-07-23, 반증 없음) — 11과의 확정 시점 충돌은 **즉시 확정 확정**으로 해소. 보강: 검증기 제약 ③ 실패 방향 도달성(17발).

- `[검증]` [문맥 태그 의미론 프로토타입](issues/17-context-semantics-prototype.md) — 프로토 **v10** 완주, **12 전면 검증(반증 없음)**. ★1번 질문(11 vs 12 확정 시점 충돌) = **즉시 확정(12안) 확정** — "포석의 재미 맞음", 라이브 재해석의 재미는 측면 선택 단계가 흡수. 다면성=발견의 재미·보유≠앎=성장감·연쇄 해제=긴장. 스모크: 확정 3모드 완주, **엔진=콘텐츠 검증기 성립**(14·07 전제 확인), 이웃 전파·연쇄 해제 명세대로. **발견 1건**: 강압 측면 전부 비명백 → 초반 "죽는 방향 둘"이 하나(어휘 게이트×실패 설계 충돌) → 스타터 승격 해소 + **생성 제약 이중→삼중**("각 실패 방향은 스타터 어휘만으로 도달 가능", 12 보강·18 소관). 플레이 총평 "재미있다 — 코어 유지+퍼즐 추가+시각화" → 08 입력. **/ 기각**: 가늠→확정 절충안, 제출 시 확정(11 v6안).

- `[검증]` [카드 아트 파이프라인](issues/13-card-art-pipeline.md) — **스타일 A(플랫 셀 누아르) + 전면 프레임**(사용자 판단, 카드 안에서 4안 비교). 핵심 원리 = 아트는 **사물(명사) × 태그 처리(형용사)**이고 **명사는 생성·형용사는 계산**한다: 측면 55개가 태그 조합 7종(상위 5종이 53/55)으로 접히므로 구우면 ≈150장, 계산하면 **49장 + CSS 처리 5종** — 게다가 계산본은 **측면이 잠길 때 전이로 움직여** 12의 "배치=확정"이 처음 그림이 된다. 생성 규칙 3: 용도 아닌 사물을 그린다(12 §1 — 아트가 한 측면에 커밋하면 다면성 발견이 죽는다)·바탕을 근-흑색으로 못박는다(흰 바탕은 계산 처리가 안 먹음, 실패 실증)·조명 중립(형용사의 몫). 종횡비는 프레임(3:4)에 맞춘다. **08 §④ 가정 반증**: 진짜 코스트는 스타일 일관성이 아니다 — `--image-references` 고정 시 **드리프트 0/12**, 실패 모드는 대상 가독성이며 예측 가능(평평한 사각 사물). 장당 ~1.2시도, 53장 ≈ 128크레딧, **아트는 분량의 병목이 아니다**. 배경은 08 §⑤의 9장 대신 **신뢰축 장면 3장 × 주목축 그레이딩**(줄다리기가 연속으로 움직임). 마켓플레이스 https 제약은 Higgsfield `result_url`이 https CDN이라 **해소**. **/ 기각**: B 에칭(92px에서 해칭이 노이즈·크림 종이가 혼자 탐), C 증거사진, D 실루엣(평평한 사각 사물 구분 불가, 6장 중 2장 실패), 로컬 무과금(ComfyUI 미기동), 혼합 파이프라인. **/ 유예**: 히어로 카드의 태그-구운 수제본.
- `[조사]` [한국어 조사 누출 중립화](issues/19-josa-leak-neutralization.md) — 빈칸 추리문의 하드코딩 조사가 정답 받침을 누출(문법 오류 4건+조건부 정답 슬롯은 정적 조사 저작 불가 실측). 플랜: 슬롯 조사를 데이터 마커로 분리, **채워지면 배치 카드 기준 `josa.ts` 동적 계산·비면 빗금 병기 "이/가"**(Unreal hpp 선례, 빗금이 규범 근거 최강); 검증기에 조사 린트+카드명 한글 종결 규약; 생성기(18)는 리터럴 조사 금지. 인기 npm 조사 라이브러리는 ㄹ 예외 버그 — `josa.ts` 유지. **/ 기각**: 조사를 난이도 단서로 수용(Golden Idol 절충 — 사용자 방향과 배치), 외부 라이브러리, 문장 전면 재구성, 형태소 분석 도입.
- `[검증+종이]` [case 생성 파이프라인의 형태](issues/18-case-generator-shape.md) — case를 `truth / presentation / obstacles`로 분리하고, 버전 고정 `sourceSnapshot → patternEvidence → patternRecipe → storySeed(requires/prefers) → 결정론적 합법 candidate → LLM 선택·표현 → 기계 검증 → GeneratedCase`로 생성한다. 슬롯은 명시적 `solutions(cardId+facetKey+when?)`, 축은 재사용 `axisProfile`과 사건별 `axisPresentation`, LLM은 allowlist 안의 선택·취향 평가만 담당한다. 수제 4 case 이관·삼중 제약·결정론 fingerprint·배치시점 상태조건 고정은 logic prototype으로 검증; 실제 원문 변환·실 sLLM·최종 emit은 [E2E prototype](issues/28-case-generator-e2e-datapack-prototype.md)에서 검증. **/ 기각**: mutable Drive 직접 소비, OpenWiki 정본화, OUT `case_pattern` 직접 실행, story별 카드 ID 매핑, LLM의 truth 작성, 조건부 답의 live 재평가, case마다 새 축 규칙 생성.

- `[검증]` [플레이 화면 정보 위계 재설계](issues/20-play-screen-hierarchy.md) — **변형 A(수직 적층) 채택**. 진단: v10의 병은 관찰 7건의 합이 아니라 **화면이 패널 모음**이라는 한 가지 — 추리문·카드 그리드·미터·디버그가 형제 패널로 면적을 다툰다. 그래서 크게 만드는 대신 **층을 나눈다**(배경=상태 / 추리문=주인공 / 핸드=대기). 원리 3: **①배경이 미터다** — 13의 신뢰 장면 × 주목 그레이딩이 방을 미터로 만들면 문제 2(배경 없음)·3(미터 눌림)이 한 수로 풀리고 12 §7의 "실패 방향 예고"가 방이 조여드는 것으로 나타난다(정밀 판독 스트립은 **임계 접근 시에만 승격** — v10은 가장 중요한 정보가 가장 안 보였다). **②핸드는 슈트 4스택으로 접힌다** — 장수가 늘어도 슬롯은 4개, 슈트가 곧 추림 어휘여서 21과 공유, 가용/보유 뱃지가 어휘 게이트의 효과를 숫자로 보여준다. **③전파는 카드가 표시한다** — 13의 태그 처리 전이 + 이웃 순차 전이로 "배치=확정"이 애니메이션 경로가 되므로 전용 위젯 금지. 규약 8개(면적 예산·z-order·모바일 적층)는 스펙 ① 편입. **[24](issues/24-play-screen-build.md)로 검증 완료(2026-07-28) — 원리 3개 전부 통과, `[종이]`→`[검증]`.** **/ 기각**: B 추리문 전면+핸드 오버레이(배치가 "판 위에 두는 행위"보다 "목록에서 골라 닫기"로 느껴져 12와 배치), C 좌우 분할(배경 면적이 줄어 원리 ①의 지렛대가 약해짐 — 17 총평의 "시각화"와 역행). **/ 유예**: 펼침 각도·승격 임계·반응 띠 높이는 24에서 튜닝.
- `[검증]` [플레이 화면 구현](issues/24-play-screen-build.md) — [20](issues/20-play-screen-hierarchy.md)의 변형 A를 실제로 지어 **원리 3개 전부 통과**(배경이 미터로 읽힘 / 추리문이 주인공 / 전파를 카드가 표시 — 전용 위젯 금지가 옳았다). 08 §②의 "Svelte UI 폐기 후 재작성" 첫 착수 지점이기도 하다. **결함 4건 해소**: 수사 상태 가려짐(20 규약 8의 스펙 버그 — 문언 수정) · 슬롯 라벨 중복 · 펼침이 반응 띠를 덮음(선택 즉시 닫기, Lane B) · 펼침이 슈트 탭을 덮어 못 닫힘(탭 72px 중 51px 가림). **세 번 반복된 병 하나로 수렴** — 한 요소의 위치를 다른 요소의 높이로 추정해 상수에 박는 것(상단바 40px을 54·48px로, 레일 상단 234px을 174px로). 증상은 매번 "겹침"이었고 원인은 매번 "컨테이너가 뷰포트를 넘음"이었다. **파생 규칙 승격**: 위치 상수에 남의 높이를 추정해 넣지 말고 CSS 변수나 `bottom: 100%`·`grid-row: -2 / -1` 같은 실물 기준 앵커를 쓸 것. 수용 조건 하나(슈트 4스택이 49장에서 견디는가)는 [08 §④](issues/08-mvp-scope.md)가 볼륨을 24장으로 마감하며 **조건 자체가 무의미해졌다**(하류 결정이 상류 수용 조건을 무효화). **용어**: 플레이 중 사용자 지적으로 코어 용어 「배치 = 수(手)」를 **「배치 = 확정」**으로 전면 교체 — 3축 표의 커밋 축·코드의 `locked`와 어휘 일치.
- `[검증]` [집은 상태의 어포던스](issues/31-pickup-affordance.md) — **「노트 대조」 신설**: 집은 카드의 **판정받은** 읽기를 슬롯 역할과 대조해 갈 자리를 밝힌다. 목적은 힌트가 아니라 **헛클릭 제거**. 말하는 것은 `faceRight` 하나이고 `cardRight`는 침묵하므로(슬롯당 같은 frame 카드가 3~7장) 추리는 남는다. **판정 이력으로 지연** — 제출해 결과를 본 측면만 대조에 든다(정오 무관), 그래서 첫 case는 통째로 공백이고 run당 판정 14 / 측면 55로 희박하다(실측 제시 후 "원칙이 먼저"로 재확인). 빈 상태는 「대조할 노트가 없다」와 「맞는 자리가 없다」를 **갈라 말한다**. 미개봉 읽기는 두 숫자(아는데 미판정 · 아직 모름). **CONTEXT.md 3축 표가 4축으로** — 새 축 「판정 이력」. **/ 기각**: 결과 예고(Book of Hours `preview` — 재미가 최적화인 게임의 해법이라 의미 발견인 우리에겐 알맹이를 흘린다), 흐리기(게임은 역할 불일치 읽기도 받아주므로 "못 놓는다"는 거짓말), 열람 비용(상태 게이트가 이미 값). **내 반론 2건이 데이터로 무너진 기록** — 다면성 발견은 표기가 아니라 놓은 뒤 피드백에 살고, 정답 슬롯 12개 중 10개는 공짜 측면이 이미 정답 읽기였다. 근거: [컬티스트 시뮬레이터 어포던스 리서치](../../docs/research/2026-07-28-cultist-simulator-affordance.md).
- `[조사]` [OpenWiki 수집·위키 보강 적합성 리서치](issues/25-openwiki-collection-fit-research.md) — 0.2.3은 기존 rclone→버전 고정 원문 뒤의 **비정본 후보 발견 레이어**로만 격리 파일럿 권고; Drive/임의파일 커넥터·OUT typed 관계 검증·claim 출처 보장은 없으며, 대표 2~3권의 초기/no-op/단일변경 3회 gate로 판단. **/ 기각**: Drive 직접 수집, `pd_wiki` 정본 대체, 전권 체계 추출, 자동 승격.
- `[검증]` [OpenWiki 후보 발견 최소 파일럿](issues/26-openwiki-candidate-discovery-pilot.md) — OpenWiki 0.2.3+LM Studio `qwen3.6-27b`는 원문 3권 전체 20분·60k자×3 발췌 600초 모두 초기 후보 0건으로 완주 실패했다. 직접 LM function call은 41.9초에 통과하고 strict validator는 누락 SHA·미등록 관계를 검출했으므로, endpoint가 아니라 OpenWiki prompt/context 운용비가 병목이다. provenance prompt·validator만 기존 `pd_wiki` 경로에 흡수한다. **/ 기각**: OpenWiki 런타임 유지, no-op/update 의존, OUT 자동 승격, 더 작은 입력으로 gate 완화.
- `[종이]` [MVP 스코프](issues/08-mvp-scope.md) — 8월 빌드 8개 항목 전부 확정: ①목적=토대(재미검증 아님) ②코드=순수모듈 승격+UI 전면 재작성 ③메커닉=run 완주 전체+컬렉션 영구화 ④**콘텐츠 볼륨=24장(단서20+패턴4)·case 4개(c1~c3+보스)로 최종 확정, 확장 없음**(2026-07-27 — 18의 재검증은 새 콘텐츠가 아니라 기존 세트였음이 드러남) ⑤아트=전부(배경은 상태귀속 3장×그레이딩, 인물은 레이든 1명) ⑥배포=Higgsfield+GitHub Pages 병행 ⑦순서=스타일 키 우선 ⑧MVP 밖=생성기·태그추출·외부팩·리플레이성·itch.io. **/ 기각**: 외부 플레이테스트·계측+설문, [10](issues/10-acquisition-detail.md) 경제 수치 전량, 수집 없는 순수 퍼즐. **/ 유예**: 리플레이성 검증([01](issues/01-mechanic-survey.md) 최대 과제).
- `[검증]` [원문 기반 태그 추출 승격](issues/14-tag-extraction-promotion.md) — 게임측 빌드타임 `FacetExtractor`·`TasteFilter`·`CaseAssembler` 경계와 canonical replay를 구현했다. 원문 evidence span·enum·1–2 tag rubric을 기계 검증하고 `game-data-pack@2` alongside/promotion을 결정론적으로 emit한다.
- `[검증]` [외부 데이터 팩 로드](issues/16-external-data-pack-loading.md) — Ajv standalone `game-data-pack@2`, v1 migration, alongside/promotion 충돌 정책, IndexedDB 원문+localStorage 순서 저장, 깨진 팩 격리와 base 폴백을 구현·검증했다.
- `[검증]` [컬렉션과 수사 노트 화면](issues/21-collection-and-notes-screen.md) — 영구 보유·알려진 측면·중복 제거된 오답 기록과 run 한정 대여를 분리하고, 전체 컬렉션과 case 중 읽기 전용 drawer를 같은 데이터로 구현했다.
- `[검증]` [run 비트와 화면 그래프](issues/22-run-beats-and-screen-graph.md) — Home→Briefing→Compose→Review→Clear→Interlude(3선2택 AP2)→Ending→Summary 그래프, checkpoint 복구, 게스트 영구화를 구현했다. / 기각 유지: 보상팩·상점·수사 포인트 화폐.
- `[검증]` [인터페이스 비주얼 시스템](issues/23-interface-visual-system.md) — 플랫 셀 누아르 토큰, 색 비의존 슈트/태그 구분, 44px controls, responsive drawer와 reduced-motion 경계를 실제 Svelte 화면에 적용했다.
- `[검증]` [인터루드·BAD 엔딩 콘텐츠 계약](issues/29-interlude-bad-ending-content-contract.md) — 공개 allowlist 입력만 받는 결정론적 인터루드와 도달 가능한 두 BAD 엔딩을 `game-data-pack@2`에 넣고 warning 선행·taint·병합 provenance를 검증했다.
- `[검증]` [MVP 오디오 스코프](issues/30-mvp-audio-scope.md) — 보이스 없이 Higgsfield Sonilo Music loop 2개와 Seed Audio 의미 SFX 7개를 사람 청감 선택 후 WAV/OGG/MP3 27개로 승격했다. manifest hash·LUFS·peak·loop·브라우저 18/18 decode와 무음 시 GameState 불변을 검증했다. / 기각: 기계 QA만 통과하고 청감 반려된 로컬 ACE-Step/Stable Audio 후보.

- `[검증]` [OpenWiki 코드 모드 파일럿](issues/32-openwiki-code-mode-pilot.md) — code mode(`openwiki code --init`)는 personal mode(26, 기각)와 달리 실사용 품질에 도달했다. Gemini spend cap·로컬 LM Studio 두 provider는 실패했고 `openai-chatgpt`(Codex 계정)에서 성공 — 이 환경에서 OpenWiki는 클라우드급 모델에서만 검증됨. `openwiki/` 트리(콘셉트 문서 7개)와 `CLAUDE.md`/`AGENTS.md` 포인터 블록을 사용자 직접 리뷰 후 실물 리포에 반영. CI 자동 갱신은 미채택 — housekeeping 주기 갱신(`--update`)으로 대체. **/ 기각**: CI 자동 갱신(GitHub Secrets 미설정 + spend cap 초과 상태에서 즉시 실패).

- `[검증]` [case 생성 E2E 데이터팩 프로토타입](issues/28-case-generator-e2e-datapack-prototype.md) — Project Gutenberg 204 고정 원문과 실제 sLLM selector/presenter/taste transcript를 승인 입력으로 저장하고, 두 replay를 byte-identical하게 emit했다. 최신 `game-data-pack@2`와 교차해 `boss→generated case` 진입 인터루드까지 포함한 `cases=5, overrides=0`을 검증했다. / 유예: `prototype/case-generator-shape`의 main 병합은 별도 사용자 결정.

- `[검증]` [GitHub Pages 배포 파이프라인](issues/33-github-pages-deploy-pipeline.md) — `workflow_dispatch` 수동 트리거와 GitHub Actions Pages를 채택하고, `prototype/core-loop/dist`만 `/caseCollection/` base로 게시한다. schema·release-tool tests·smoke 11종·source/dist 경계·typecheck·build를 배포 gate로 강제했으며, clean Linux runner에서 드러난 Windows 절대 원문 의존은 byte-identical 저장소 fixture로 제거했다. 실제 Actions build/deploy와 공개 URL `https://mmdal0857.github.io/caseCollection/`의 200 응답·실브라우저 완주까지 검증했다. Higgsfield는 별도 수동 배포로 유지. **/ 기각**: main push·release tag 자동 트리거, `gh-pages` 브랜치 게시, 현재 단계의 커스텀 도메인.
- `[검증]` [사용자 노출 영문 카피 한국어화](issues/36-korean-ui-copy-cleanup.md) — 일반 플레이·저장 복구 화면의 영문 카피를 한국어로 통일하고, 내부 식별자는 유지한 채 `smoke:korean-ui`를 release gate에 편입했다.

## Not yet specified

- 수익화 — **유료 채널의 시점과 형태만 남았다.** 채널 후보는 Steam으로 좁혀졌고(콘텐츠 분량 때문에 [18](issues/18-case-generator-shape.md) 이후, 리드타임 6주+), 무료 배포는 GitHub Pages+Higgsfield로 확정. itch.io·Patreon은 미사용 결정, Stripe 직판은 후순위 대기([10001](issues/10001-higgsfield-stripe-storefront.md))이므로 이 줄에서 빠졌다. 남은 fog는 "유료판이 무엇을 담는가" — 무료 게시본과의 경계이고 18의 산출에 달렸다.
- 영어 지원 시점 — 파이프라인 슬롯 설계는 스펙에 포함, 실제 지원은 재미 검증 후. 조사 상당(a/an 등 문법 단서) 렌더 처리는 [19의 P2](issues/19-josa-leak-neutralization.md)가 원리(언어별 particle resolver를 렌더 계층에)만 미리 잡아둠 — 실제 지원 시점에 구체화.
- 일반화 추출 플로우 스킬의 형태 세부 — 골격 확정(06 경계 + 07 패키징: 자기완결 패키지→CLI generic 팩→하류 변환·번들·분리빌드). 남은 것은 결정이 아니라 **스펙 ② 작성 시 스킬로 문서화**(집필 항목).

## 후순위 대기 (10000번대)

번호 10000 이상은 **지금 하지 않지만 폐기도 아닌** 티켓이다. `Status: deferred`라서 프론티어 쿼리에 걸리지 않고, 각 티켓의 `Trigger:` 헤더가 꺼내는 조건을 명시한다. 규약은 [issue-tracker.md](../../docs/agents/issue-tracker.md)의 "후순위 대기 밴드" 절.

- `[프로토]` [Higgsfield 웹사이트 + Stripe 직판 스토어](issues/10001-higgsfield-stripe-storefront.md) — **결제 파이프라인 전 구간 실측 통과**(라이브 결제 1건: 세션→웹훅 서명검증→paid 승격→토큰→게이팅 열람, 위조 토큰 본문 누출 0, KRW zero-decimal 확인). 대기 사유는 기술이 아니라 경제 — 결제·세무·환불을 직접 지면서 **관객은 0에서 시작**하므로 소규모 판매에는 Steam이 앞선다. **트리거**: 게임 본체가 아닌 부속물을 직판할 상품이 생기고 이미 유입이 있을 때. **재개 시 먼저 답할 것**: Managed Payments를 `tax_code`로 켤지 끈 채 세금을 직접 처리할지(세무 판단, 구현 판단 아님). 문서에 없던 플랫폼 제약 6건과 재사용 가능한 디자인 자산(브리프+보드 6장) 위치는 티켓 본문에. 코드는 이 레포가 아니라 `f:\Project\casefile-archive`.

## Out of scope

- Dead Letters **세계관·플롯·기타 캐릭터** 재사용 — 독립 게임 결정(차팅, 2026-07-19)으로 배제. **단 탐정 레이든은 예외로 차용**(사용자 판단, [13](issues/13-card-art-pipeline.md) 세션 2026-07-25): 프로토 `persona.ts`가 편의상 쓰던 레이든이 08 §⑤에서 MVP 아트 항목으로 올라오며 이 줄과 충돌한 것을 발견 → 스코프 경계를 다시 그었다. OUT의 기존 스프라이트(`raiden_neutral/wry/grim`)를 그대로 쓸 수 있어 인물 아트 코스트가 거의 0이고, 시각 언어도 13이 고른 스타일 A와 같다. **경계는 "인물 1명"까지이며 세계관·에피소드·다른 등장인물은 여전히 배제** — 넓히려면 별도 결정.
- 서버 기반 기능(계정·서버측 컬렉션·라이브 운영) — 정적 클라이언트 결정으로 배제.
- 런타임 LLM 콘텐츠 생성 — 정적 클라이언트 결정의 귀결.
- 키워드 검색 언락(Her Story형 — 아는 단어를 검색해 새 사실을 여는 진행 게이트) — 01 서베이가 B의 대안으로 제시했으나, 05의 가치 교정("텍스트 중심 아님 — 퍼즐 명료성")과 방향 불일치로 배제(감사 §3, 2026-07-21).

---

open 티켓은 `issues/`에서 조회: `Status: open` + `Assignee:` 빈 값 + Blocked-by 전부 closed = 프론티어.
