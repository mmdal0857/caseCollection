# Case generator contract prototype — 결과

날짜: 2026-07-27  
질문: `patternRecipe + storySeed.requires`에서 결정론적 합법 후보를 만들고, 명시적 `solutions[]`와 가변축 분리가 기존 case를 손실 없이 표현하는가?

## 판정

**성립한다.**

```powershell
npm run prototype:case-generator:demo
```

검증 결과:

- 기존 수제 case `c1 / c2 / c3 / boss`를 `truth / presentation / obstacles([])`로 변환: 구조 오류 0.
- 각 case에서 결정론적 합법 후보 24개(프로토 상한) 생성.
- 선택 후보 네 건 모두 삼중 gate 통과:
  - ① 순차 상태에서 아는·빌린 측면으로 풀 수 있음
  - ② 카드 kind·facet frame·슬롯 계약이 응집
  - ③ 스타터 어휘에 공개 과다·강압 과다 양쪽을 미는 측면 존재
- 동일 입력으로 두 번 실행했을 때 후보 fingerprint 동일:
  - `c1`: `52a9ea6c0616`
  - `c2`: `d5cb120b96b9`
  - `c3`: `8d1df45c8f58`
  - `boss`: `f7bb88fb85a8`
- sLLM 후보 allowlist: 합법 candidate ID는 수용하고 목록 밖 발명 ID는 거부.
- TypeScript 검사, 기존 core smoke, datapack smoke, Vite build 모두 통과.

## 발견한 반례

기존 `CondAnswer`는 현재 상태를 매번 다시 읽는다. 상태 임계 바로 아래에서 정답 카드를 놓았을 때 그 카드의 태그가 임계를 넘기면, 방금 놓은 정답이 스스로 오답이 될 수 있다.

- `c2s5`: live 재평가 뒤집힘 probe 45건
- `boss b4 / b6`: live 재평가 뒤집힘 probe 90건

새 계약은 solution의 `when`을 **배치 시점에 평가해 채택 가능성을 동결**한다. 확정 뒤 상태가 바뀌어도 그 solution은 사후 오답이 되지 않는다. 같은 probe에서 frozen 뒤집힘은 0건이다.

## 프로토가 지지한 계약

1. `patternEvidence`와 versioned `patternRecipe`를 분리한다.
2. recipe와 구조화된 `storySeed.requires`를 엔진 탐색 조건으로 컴파일한다.
3. sLLM은 합법 candidate ID만 선택할 수 있고 payload를 수정하지 못한다.
4. slot truth는 `solutions[{ cardId, facetKey, when? }]`를 명시한다.
5. 조건부 solution의 채택 가능성은 배치 시점에 동결한다.
6. `axisProfile`의 기계 규칙과 `axisPresentation`의 사건별 표현을 분리한다.
7. `obstacles: []`는 정상 case다.

## 나중에 확인할 비차단 항목

### axisProfile catalog의 초기 크기

TUI에서 `[v]`로 두 catalog를 비교할 수 있다.

- `observed`: 현재 콘텐츠가 실제로 사용한 기계 프로필 3종(`공개 / 논리 / 신중`)
- `full-tag`: 태그마다 하나씩 둔 누적형 프로필 5종

권고는 **MVP에는 observed 3종만 정식 승격하고, 원문·case가 새 규칙을 요구할 때 6~8종까지 늘리는 것**이다. 숫자를 맞추기 위해 사용되지 않는 프로필을 미리 발명하지 않는다. 이 선택은 생성기 계약을 막지 않는다.

### prefers 가중치와 LLM 취향 점수

프로토는 결정론 확인을 위해 `논리 +2`, 선택 axis 태그 `+1`의 임시 점수를 쓴다. 실제 가중치는 생성기 형태가 아니라 콘텐츠 튜닝값이다. 후보 fingerprint와 삼중 gate에는 영향을 주지 않도록 유효성 판정 밖에 둔다.

