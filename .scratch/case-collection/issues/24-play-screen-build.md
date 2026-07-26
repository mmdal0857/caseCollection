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
