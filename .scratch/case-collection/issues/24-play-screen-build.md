# 플레이 화면 구현 (위계 A 검증)

Status: open
Labels: wayfinder:prototype
Assignee: MMDAL (opus session, 2026-07-26)
Blocked-by: 20

## Question

[20 플레이 화면 정보 위계 재설계](20-play-screen-hierarchy.md)가 확정한 **변형 A(수직 적층)** 를 실제로 지어 검증한다. 20의 결정은 `[종이]` — 변형 비교로 정했을 뿐 실행으로 증명되지 않았으므로, 규약대로 대응 prototype 티켓이 필요하다.

동시에 이 티켓이 [08 §②](08-mvp-scope.md)의 **"Svelte UI는 폐기하고 새로 짓는다"의 첫 착수 지점**이다. 순수 모듈(`engine`·`facets`·`dramaturgy`·`scenario`·`josa`·`persona`)은 승격 대상이므로 건드리지 않고, UI 층만 다시 짓는다.

## 검증할 것 (플레이로 판정)

20의 세 원리가 실제로 작동하는지가 전부다. 화면이 예쁜지가 아니다.

1. **배경이 미터로 읽히는가** — 방이 조여드는 것만으로 "지금 어느 쪽으로 실패하는 중"이 전달되는가. 안 읽히면 계기 스트립의 승격 임계를 낮추거나 원리 ①을 재검토.
2. **두루마리가 주인공으로 느껴지는가** — 세로 45% 예산이 실제로 충분한가. v10의 병("퍼즐이 카드 목록보다 작다")이 사라졌는지.
3. **슈트 4스택이 49장에서 견디는가** — 20장·49장 두 지점에서 손패 조작이 답답해지지 않는가. 가용/보유 뱃지가 실제로 읽히는가.
4. **전파 전이가 "수(手)"로 느껴지는가** — 배치 후 이웃 순차 전이가 타격감을 주는가, 아니면 그냥 화면이 깜빡이는가. [12](12-context-tag-semantics.md)의 코어 메커닉이 여기서 처음 눈에 보인다.

## 착수 시 삭제할 것 (재작성이므로 승계 금지)

- 디버그 위젯 "잠금 시점" 3버튼 — [17](17-context-semantics-prototype.md)에서 즉시 잠금 확정으로 죽었다
- `src/lib/protoart.svelte.ts`, `src/lib/ui/ArtSwitcher.svelte` — [13](13-card-art-pipeline.md)의 시안 비교 하네스, THROWAWAY
- [11](11-core-loop-prototype.md)에서 기각된 `ScenarioBoard` 잔재

**승계할 것**: `CardChip.svelte`의 아트 슬롯 + 슈트 폴백, `app.css`의 프레임·태그 처리 CSS (13에서 승격된 실물).

## 튜닝 대상 (20이 프로토로 넘긴 것)

- 손패 펼침 인터랙션의 형태 — 부챌침 각도, 클릭 vs 호버
- 계기 스트립 승격 임계값
- 반응 띠 예약 높이

## 범위 밖

크롬 언어는 [23 인터페이스 비주얼 시스템](23-interface-visual-system.md), run 단위 화면 전이는 [22 run 골격 비트와 화면 그래프](22-run-beats-and-screen-graph.md), 컬렉션·노트 화면은 [21](21-collection-and-notes-screen.md). 이 티켓은 **플레이 화면 한 장**만 짓는다 — 다만 손패 추림 어휘는 21과 공유해야 하므로(20 규약 5) 어휘를 바꾸려면 21에 파급 코멘트가 필요하다.

## Codex delegation

Mode: T
Owner: Claude
Source-ticket: .scratch/case-collection/issues/20-play-screen-hierarchy.md
Decision-state: closed
Write-scope:
  - prototype/core-loop/src/App.svelte
  - prototype/core-loop/src/app.css
  - prototype/core-loop/src/lib/ui/CaseScreen.svelte
  - prototype/core-loop/src/lib/ui/Meters.svelte
  - prototype/core-loop/src/lib/ui/CardChip.svelte
  - prototype/core-loop/src/lib/ui/StageBackground.svelte  (신규)
  - prototype/core-loop/src/lib/ui/ReactionBand.svelte     (신규)
  - prototype/core-loop/src/lib/ui/HandRail.svelte         (신규)
  - 삭제: prototype/core-loop/src/lib/ui/DebugPanel.svelte
  - 삭제: prototype/core-loop/src/lib/ui/ArtSwitcher.svelte
  - 삭제: prototype/core-loop/src/lib/ui/ScenarioBoard.svelte
  - 삭제: prototype/core-loop/src/lib/protoart.svelte.ts
Read-only (수정 금지):
  - prototype/core-loop/src/lib/*.ts 전량 (engine·facets·dramaturgy·scenario·persona·josa·datapack·content·fx)
  - 그 밖의 화면(BriefingScreen·RewardScreen·InterludeScreen·EndScreen)은 삭제된 컴포넌트 참조를 끊는 최소 수정만
Knowledge-sources:
  - CONTEXT.md
  - .scratch/case-collection/issues/20-play-screen-hierarchy.md  (전문 — 위계·원리 3개·규약 8개)
  - .scratch/case-collection/issues/24-play-screen-build.md      (이 티켓 — 검증 항목·삭제/승계 목록)
  - .scratch/case-collection/issues/13-card-art-pipeline.md      (아트 = 사물 × 태그 처리, 배경 = 장면 × 그레이딩)
  - .scratch/case-collection/issues/12-context-tag-semantics.md  (§7 실패 방향 예고, 배치 = 수)
  - CLAUDE.md (Svelte 5 규칙: $state.snapshot, $derived)
Acceptance:
  - `npx esbuild smoke.ts --bundle --format=esm --platform=node --outfile=smoke.mjs && node smoke.mjs` — 출력이 변경 전과 **동일**(UI 전용 변경이므로 순수 모듈 거동 불변)
  - `npx esbuild smoke-datapack.ts --bundle --format=esm --platform=node --outfile=smoke-datapack.mjs && node smoke-datapack.mjs` — 동일
  - `npx tsc --noEmit` 클린
  - `npx vite build` 클린
  - 삭제된 4개 파일에 대한 import·참조가 레포에 0건 (grep으로 증명)
  - 손패 슬롯이 카드 수와 무관하게 항상 4개 (슈트 수) — 20장·49장 두 지점에서 확인
  - 두루마리 세로 예산 ≥45%, 손패 레일 ≤180px, 계기 스트립 ≤48px(승격 시 ≤96px)가 코드에 명시
Integration-owner: Claude
Status: delegated

### 위임 시 경계 두 개 (반드시 지킬 것)

1. **배경 장면 이미지는 생성하지 말 것.** [13](13-card-art-pipeline.md)의 배경 = 신뢰축 장면 3장 × 주목축 CSS 그레이딩인데, 장면 3장은 Higgsfield로 굽는 **생성 에셋**이고 이미지 생성은 Codex 범위 밖(`docs/agents/codex-collab.md` "Image generation stays out of Codex's scope"). Codex는 **층과 그레이딩 시스템만** 짓는다:
   - `StageBackground.svelte`가 신뢰 구간(하 / 중 / 상) → 이미지 경로 3개를 받고, 주목값 → CSS 필터·오버레이 그레이딩을 연속 적용한다.
   - **이미지 파일이 없을 때 우아하게 폴백**한다(근-흑색 단색 + 그레이딩만). 파일은 Claude가 나중에 채운다.
   - 경로 규약만 정하고 리포트에 적을 것.
2. **게임 밸런스·판정은 건드리지 말 것.** heat/trust 임계, `Tag`/`Kind`/`SlotFrame` 의미, 판정 규칙 결과는 리팩터 대상이 아니다(표준 규칙). 이 작업은 **화면 층 재배치**이고 게임 로직은 불변이다.

### 검증 불가 항목 (Claude가 플레이로 판정)

Codex는 빌드·타입·스모크까지만 책임진다. 20의 원리 3개가 실제로 작동하는지(배경이 미터로 읽히는가 / 두루마리가 주인공으로 느껴지는가 / 전파가 "수"로 느껴지는가)는 **플레이 판정**이므로 Claude가 띄워서 확인한다.

### 통합 결과 (Claude, 2026-07-26)

**Status: accepted (수정 후)** — 위임 결과를 독립 검증해 통합했다. 커밋 `6ba2bd1`.

검증은 계약대로 Codex 자기보고를 믿지 않고 재실행했다: 스모크 2종이 위임 전 기준선과 `diff -q` **IDENTICAL**(FAIL 0), `tsc --noEmit` 클린, `vite build` 클린(140 modules), 삭제 4종 참조 0건, 예산 수치 코드 명시, 거버넌스 파일 무침범, Codex 커밋 0.

**Codex 자기보고와 어긋난 것 1건 (Deviations: none 이었으나 실제로는 이탈)**:
- `CaseScreen.svelte`가 배경 경로를 `/assets/backgrounds/${def.id}-trust-{low|mid|high}.webp`로, 즉 **case별로** 만들었다. [13 §⑦](13-card-art-pipeline.md)은 **배경을 case가 아니라 배경 상태에 귀속**시켰고 그것이 9장을 3장으로 줄인 근거다. case별로 굽는 순간 장수가 case 수만큼 불어난다. → 경로를 `/assets/backgrounds/trust-{low|mid|high}.webp`로 고치고 근거 주석을 달았다.
- 부수: 재작성 잔재인 미사용 import(`cardFitsSlot`) 제거.

**교훈**: 결과 계약의 `Deviations:` 항목은 Codex가 *자신이 인지한* 이탈만 적는다. 지배 결정과의 정합성은 위임자가 직접 대조해야 한다 — 빌드·타입·스모크는 전부 통과했으므로 기계 검증만으로는 절대 안 잡혔을 이탈이다.

**남은 수용 조건**: 플레이 판정(배경이 미터로 읽히는가 / 두루마리가 주인공으로 느껴지는가 / 슈트 4스택이 49장에서 견디는가 / 전파가 "수"로 느껴지는가). 배경 장면 3장을 굽는 중이며 그 후 판정한다.

## 2차 위임 (플레이 판정에서 나온 결함 2건)

Mode: T / Owner: Claude / Decision-state: closed / Integration-owner: Claude
Write-scope: `prototype/core-loop/src/app.css`, `prototype/core-loop/src/lib/ui/CaseScreen.svelte` (정확히 둘)
Status: delegated

플레이 판정(2026-07-26, dev 5199, 1600×900) 결과 **4개 조건 중 3개 통과, 1개 미검증, 결함 2건**:

**통과**: 배경이 실제로 들어오고 그레이딩이 먹는다(밝은 벽이 "회색 죽"이 될까 우려했으나 **기각** — `brightness(.34)` + 근-흑색 오버레이로 잘 눌린다, 재생성 불필요) · 두루마리가 중앙 최대 면적으로 주인공이다(v10의 "퍼즐이 카드 목록보다 작다" 해소) · 손패가 슈트 4스택이고 `물리 4/4 · 행동 4/4 · 문서 2/2 · 감식 2/2`로 가용/보유가 정확하다 · 반응 띠가 고정 좌석을 갖는다.
**미검증**: 전파가 "수"로 느껴지는가 — 아직 배치를 하지 않았다.

### 결함 ① 계기 스트립이 두루마리에 가려진다 — **규약 8의 스펙 버그**

`.instrument-strip`이 `position: sticky; z-index: 1`인데 뒤따르는 `.scroll-layer`가 `z-index: 2`라, 스크롤 콘텐츠가 sticky 판독 위에 그려진다.

**Codex 잘못이 아니다.** [20](20-play-screen-hierarchy.md) 규약 8이 z-order를 `배경(0) < 계기(1) < 두루마리(2) …`로 적었고 Codex는 문언 그대로 따랐다. 그 순서의 의도는 "배경이 콘텐츠 아래"였고 **sticky 판독이 스크롤 콘텐츠 아래 깔린다는 뜻이 아니었다.** 규약이 sticky와 모순이므로 **20 규약 8의 문언을 수정해야 한다**(수정 방식이 확정된 뒤 Claude가 반영).

[12 §7](12-context-tag-semantics.md)이 "실패 방향은 반드시 예고"를 요구하고 20의 관찰 3번이 v10에서 "예고를 나르는 위젯이 가장 안 띈다"였으므로, **형태만 바뀌어 같은 문제가 남으면 실패**다.

### 결함 ② 슬롯 라벨에 프레임 라벨이 붙어 중복으로 읽힌다

`CaseScreen.svelte:180`이 `{slot.label}<i>{frameOf(slot)}</i>`로 렌더해 `침입 경로경로`·`살해 수단수단`·`물리적 흔적흔적`·`행동 단서행동`이 된다. 프레임 표시의 의도(타입 힌트)는 유지하고 **시각적으로 분리**한다.

`이/가` 빗금 병기는 버그가 아니다 — [19](19-josa-leak-neutralization.md)가 정한 설계다.

**주목할 점**: 스모크의 조사 린트는 PASS였다. **린트가 데이터를 검사하고 렌더를 검사하지 않기 때문**이다. 1차 위임의 배경 귀속 이탈과 함께, **기계 검증을 통과하는 결함**의 두 번째 사례다.

### 2차 위임 통합 결과 (Claude, 2026-07-26)

**Codex Outcome: `blocked`** — 계약대로 정직한 보고다. 파일은 고쳤지만 브라우저 정책이 `127.0.0.1:5199` 접근을 거부해 **렌더 검증을 못 했으므로** `completed`가 아니라 `blocked`를 반환했다. 그 미완료 구간이 정확히 위임자의 몫(플레이 판정)이었다.

**Codex의 수정**: 결함 ①은 sticky를 유지한 채 스트립을 `z-index: 5`로 올리고 승격 시 붉은 테두리·경고광을 추가. 결함 ②는 라벨과 프레임을 분리(프레임을 작은 pill로). 모바일에서는 승격되지 않은 스트립을 `max-height: 0`으로 숨겨 규약 7을 지켰다.

**독립 검증(Claude 재실행)**: 스모크 2종 본문이 기준선과 **IDENTICAL**(esbuild 배너 4줄 제외 — 다른 세션이 `npm run smoke` 스크립트를 추가해 빌드 출력이 앞에 붙는다), FAIL 0, `tsc --noEmit` 클린, `vite build` 클린.

**렌더 판정에서 새 결함 1건 발견 → Claude가 직접 수정**:
- 스트립은 읽히게 됐지만 **두루마리 제목을 13px 덮었다.** 원인은 z-index가 아니라 **하나의 상단바를 세 숫자로 가정한 것** — 실측 40px인데 컨테이너 높이는 `100vh - 54px`, sticky 오프셋은 `48px`. 컨테이너가 뷰포트를 넘어 페이지가 스크롤되고, 그 순간 sticky 스트립이 자기 그리드 행에서 떨어져 이웃을 덮었다.
- 산수를 맞추는 대신 **겹침이 불가능한 구조**로 갔다: `--topbar-h` 변수로 단일 진리원을 만들고, 컨테이너 높이에 `.shell` 패딩을 반영하고, **sticky를 제거**했다. 스트립은 그리드 1행이므로 컨테이너가 뷰포트에 맞으면 sticky 없이 항상 보인다 — sticky의 유일한 실효는 겹침을 만드는 것이었다.
- 측정: 겹침 `13px → -29px`(29px 여유), 스트립 완전 가시, 두루마리 **45.7%**(규약 ≥45%), 스트립 48px, 손패 슬롯 4개.
- **[20](20-play-screen-hierarchy.md) 규약 8을 개정**했다(스펙 버그 + 파생 규약 2개 추가: 컨테이너는 뷰포트를 넘지 않는다 / 단일 진리원).

**잔여 한계(기록만, 이 티켓에서 안 쫓음)**: 페이지가 여전히 64px 넘친다(`scrollHeight 964 / viewport 900`). 정지 상태에서는 전부 보이고 규약 예산도 지켜지므로 판정에는 영향이 없다. 크롬 세부 정련은 [23](23-interface-visual-system.md) 소관.

**남은 수용 조건**: 전파가 "수"로 느껴지는가 — 아직 카드를 배치하지 않아 미검증.

### 전파·배치 판정 (Claude, 2026-07-26) — 통과 3, 신규 결함 1

브라우저로 실제 배치까지 밟아 확인했다(dev 5199, 1600×900).

**어휘 게이트가 화면에 나타난다** — 얼굴 선택 피커에서 `밀실의 허점 [경로]`는 선택 가능, `전달 통로 [수단]`은 **"아직 모르는 얼굴 — 수사 노트에 없다"**로 비활성. [12 §4](12-context-tag-semantics.md)의 **보유 ≠ 앎**이 UI에서 실증됐다.

**조사 해소가 렌더에서 작동한다** — 채워진 슬롯의 조사는 `이`(환기구 틈, 받침 ㅁ), 빈 슬롯은 `이/가` 병기. [19](19-josa-leak-neutralization.md)의 설계가 정확히 그대로다. **스모크 린트가 데이터만 보던 구간을 렌더로 확인한 것**이라 의미가 있다.

**전파 채널이 걸려 있다** — 배치된 카드에 `propagate-step`이 붙고 `animationName: propagate-in`, `--propagation-index`가 스태거용으로 세팅된다. 다만 카드 1장만 놓은 상태라 전파 대상 이웃이 없어 **스태거의 "수(手)" 감각 자체는 미검증**이다. 이건 이웃이 실제로 잠기는 국면을 만들어야 나오므로 **사람이 한 판 굴려야 하는 판정**으로 남긴다.

**계기가 반응한다** — 배치 후 `봉인` 2 → 3으로 즉시 갱신.

### 결함 ③ 배치 후에도 부챌침이 열린 채 반응 띠·손패를 덮는다

`.stack-fan`이 `position: fixed; bottom: 174px; min-height: 230px`로 열린 뒤 **배치가 끝나도 닫히지 않는다.** 결과적으로 20이 레이든 반응에 확보해 준 **고정 좌석과 손패 레일이 가려진다** — 관찰 6번(반응 레이어에 자리가 없다)을 해소한 규약이 다시 무력화된다.

수정 방향: 배치(`PLACE` 디스패치) 또는 얼굴 피커 진입 시 부챌침을 닫는다. 상태가 `HandRail`에 있고 배치는 `CaseScreen`에서 일어나므로 컴포넌트 간 조정이 필요하다 — 한 줄 수정이 아니라 3차 위임 또는 직접 수정 대상.

### 3차 라운드 — 결함 ③ (사용자 직접 위임, Lane B)

스펙: [24-round3-fan-close.md](24-round3-fan-close.md). Claude가 스펙과 UX 결정을 확정했고 **디스패치·수용은 사용자가 직접** 한다(`Mode: direct`).

**UX 결정 (Claude)**: 부챌침은 **카드를 고른 즉시** 닫는다. 닫히는 시점이 "배치 완료"가 아니라 "선택 완료"인 이유는 [20](20-play-screen-hierarchy.md)의 위계다 — 손패는 **대기 층**이고, 고른 뒤의 무대는 두루마리와 반응 띠다. 얼굴 피커가 열려 있는 동안에도 부챌침이 떠 있으면 안 된다.

**앞선 진단 정정**: 결함 ③을 처음 기록할 때 "상태가 HandRail에, 배치는 CaseScreen에 있어 컴포넌트 간 조정이 필요하다"고 적었는데 **틀렸다.** `openSuit`은 `HandRail.svelte`의 로컬 `$state`이고 카드 선택도 같은 컴포넌트의 `onpick` 경로를 지나므로, **한 파일로 끝난다.** 닫는 시점을 "배치"가 아니라 "선택"으로 정한 덕에 조정이 사라졌다 — UX 결정이 구현 범위를 줄인 사례.
