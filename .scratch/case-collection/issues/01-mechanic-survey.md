# 메커닉 설계 공간 서베이

Status: closed
Labels: wayfinder:research
Assignee: research-subagent (opus)
Blocked-by:

## Question

수집과 플레이가 결합된 카드 게임의 메커닉 설계 공간은 어떻게 생겼는가? Koster 재미이론 관점(학습 곡선·마스터리·변주)에서 각 패턴의 재미 구조는 무엇이고, PD 추리소설 카드 게임(B+C 하이브리드: 플레이로 카드 획득 + 수집물의 게임적 사용)에 적용 가능한 후보는 무엇인가?

조사 범위: 덱빌더(Slay the Spire, Dominion), 로그라이트 카드(Inscryption, Balatro), 컬렉션 중심(TCG, Marvel Snap, 도감/앨범형), 추리·퍼즐(Return of the Obra Dinn, The Case of the Golden Idol, Her Story)의 코어 루프 패턴과, 수집이 플레이에 통합되는 방식.

Findings: `docs/research/2026-07-19-mechanic-survey.md` (main — 로컬 트래커라 research 브랜치 규약 생략)

## Resolution

(2026-07-19, Opus research 서브에이전트) 상세는 [docs/research/2026-07-19-mechanic-survey.md](../../../docs/research/2026-07-19-mechanic-survey.md). 5개 메커닉 가족을 Koster 렌즈(학습 가능한 패턴의 마스터리)로 분석.

- **덱빌더(StS·Dominion)**: 수집과 플레이가 한 몸(획득=덱 재료) — B+C 분리 구조와는 결이 안 맞음. 마스터리 천장은 높음.
- **로그라이트(Balatro·Inscryption)**: Balatro가 Koster 이상에 최근접(쉬운 온보딩 + 곱셈 시너지 천장 + juice), 정적 웹에 최적. Inscryption의 막별 규칙 리믹스는 변주 구조 참고 가치.
- **컬렉션(Marvel Snap·가챠/도감)**: 수집은 최강 동기·최약 마스터리 원천. Snap의 "수집이 덱 옵션을 넓히고 스킬 세션이 마스터리 담당" 구조가 이상적 B+C 분리 템플릿. 순수 가챠는 동기 레이어로만.
- **추리·퍼즐(Obra Dinn·Golden Idol·Her Story)**: B의 심장. Golden Idol의 word-bank 배치 + 근접도 피드백 + thought-path 사슬이 즉시 이식 가능 — "수집물=퍼즐 재료"라 B+C 통합이 자연스러움. Obra Dinn의 N개 단위 확정은 검증된 brute-force 방지책.

**후보 루프 평가**: ⓑ 수집=퍼즐재료(순수 Golden Idol형) — 최안전 MVP, 리스크는 콘텐츠 소진 시 리플레이성 / ⓐ 단서-투-덱(Golden Idol × StS) — 최유력, 이중 마스터리, 리스크는 솔로 범위 폭발 / ⓓ 단서-투-점수엔진(× Balatro) — 마스터리 최상, 내러티브 결합 최약 / ⓔ 도감완성 — 코어 아님, 리텐션 레이어.

**권고**: ⓑ로 MVP → 재미 검증 후 ⓐ로 C 확장 (Koster의 "동사 먼저, 리믹스 나중"이 개발 순서와 일치). 최대 과제는 리플레이성/권태 대책 — 코어 루프 티켓(03)에서 정면으로 다룰 것.
