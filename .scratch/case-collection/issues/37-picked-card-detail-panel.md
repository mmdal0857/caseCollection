# 집은 카드 그림 고정 표시 + 카드 판독창

Status: closed
Labels: wayfinder:task
Assignee: Codex
Blocked-by:

**Goal:** 핸드에서 카드를 집으면 지금처럼 텍스트만 뜨는 게 아니라 실제 카드 그림이 화면에 고정으로 보이게 하고, 그 그림을 탭하면 이 카드의 측면 목록·오답 이력을 보여주는 상세 판독창이 열리게 한다.

**Architecture:** [20](20-play-screen-hierarchy.md)의 층 예산(핸드 ≤180px, 판독은 새 층이 아니라 핸드 층 안)과 [31](31-pickup-affordance.md)의 「노트 대조」 판독줄을 그대로 두고 확장한다 — 새 상시 레이어를 만들지 않는다. 상세 판독창은 이미 있는 `CaseNotebookDrawer`(스크림+drawer, aria-modal)와 같은 모달 패턴을 그대로 복제한다. 표시 계층만 바꾸고 엔진·리듀서·저장 형식은 건드리지 않는다.

**Tech Stack:** Svelte 5, TypeScript, Vite

## 배경 — 이 티켓이 답하는 미결 질문

[31 「남긴 것」](31-pickup-affordance.md)이 명시적으로 미뤄둔 질문 그대로다: "카드 자체나 21 수집·노트 화면에도 대조를 둘지는 21에서" — 21([컬렉션과 수사 노트 화면](21-collection-and-notes-screen.md))은 이미 컬렉션 화면에 상세 패널(`CollectionScreen.svelte`의 `.collection-detail` — 측면 목록 + 오답 이력)을 구현했다. 이번 티켓은 같은 정보를 **플레이 중 핸드에서 집은 카드에도** 어휘를 통일해 제공한다.

## 대화로 확정한 설계 (그릴링 아님 — 사용자 확인 완료)

1. **부족한 것은 텍스트가 아니라 그림이다.** 지금 핸드 위에 뜨는 "카드이름을 집었다 · 노트 대조" 줄(ticket 31)은 유지하되, 실제 카드 아트를 보이게 한다.
2. **재클릭 동작은 대상별로 나뉜다.** 고정 패널(새 그림)을 탭 → 상세 판독창이 열린다. 핸드 안의 같은 카드를 다시 탭 → 지금처럼 선택 취소(기존 `pickCard` 토글, 변경 없음).
3. **상세 판독창 내용 = 측면 목록 + 오답 이력.** `CollectionScreen.svelte`의 `.collection-detail`과 동일한 두 섹션(`cardFacetSlots`로 아는/모르는 측면, `collection.rejectedInterpretations`로 이 카드의 줄 그어진 해석)을 재사용해 어휘를 통일한다.

## 범위 밖

- 슬롯(추리문)에 놓인 카드의 판독 — 이 티켓은 **핸드에서 집은 카드**만 다룬다.
- 측면 판독 로직(`readFacets`, `노트 대조`)의 변경 — 기존 `pickedReadings`/`placeableSlots` 계산은 그대로 둔다.
- 새 CSS 크롬 언어 — [23](23-interface-visual-system.md)의 기존 토큰(`--gold`, `--dim`, `--panel`, `--line` 등)과 기존 `.card`/`.drawer-scrim`/`.facet-slots`/`.rejected-notes` 클래스를 재사용한다.

## Task 1: 핸드 판독줄에 카드 그림 고정 + 상세 열기 콜백

**Files:**
- Modify: `prototype/core-loop/src/lib/ui/HandRail.svelte`
- Modify: `prototype/core-loop/src/app.css`

**Interfaces:**
- `HandRail`에 새 prop `onviewdetail: () => void` 추가(기존 `onpick`은 변경하지 않는다).
- Consumes: 기존 `picked` derived(선택된 카드), `publicAssetUrl`(CardChip.svelte가 이미 쓰는 것과 동일한 헬퍼, `../public-assets`에서 import).

- [x] **Step 1**: `.picked-readout` 안, 기존 `<span class="picked-icon">` 자리 앞(또는 대체)에 작은 클릭 가능한 썸네일을 추가한다.

```svelte
<button
  type="button"
  class="picked-thumb suit-{picked.card.suit}"
  onclick={onviewdetail}
  aria-label="{picked.card.name} 상세 보기"
>
  <img src={publicAssetUrl(`assets/cards/${picked.card.id}.webp`, import.meta.env.BASE_URL)} alt="" />
</button>
```

- 이미지 로드 실패 시 폴백(`SUIT_ICON`)까지 만들 필요는 없다 — 카드 아트는 20장 전량 존재가 확정([13](13-card-art-pipeline.md), CLAUDE.md "2026-07-27 기준 단서 20장 전량 생성 완료"). 실패 폴백을 추가하면 `CardChip.svelte`의 `artFailed` 처리와 로직이 중복된다.
- 기존 `<span><b>{picked.card.name}</b>{eul(picked.card.name)} 집었다</span>` 이하 텍스트는 그대로 둔다 — 삭제하지 않는다(ticket 31이 이미 확정한 "헛클릭 제거" 정보).

- [x] **Step 2**: `app.css`에 `.picked-thumb` 규칙을 추가한다. 핸드 레일 예산(`.hand-rail { max-height: 180px }`, 모바일 120px)을 넘지 않는 높이로 고정한다 — 참고로 `.stack-tab`이 이미 72px을 쓰므로 썸네일은 44~56px 높이 이내로 잡을 것. `.card.suit-*` 상단 보더 스타일(solid/dashed/double/dotted)을 동일하게 재사용해 슈트 구분을 유지한다.

```css
.picked-thumb {
  flex: none; width: 40px; height: 52px; padding: 0; overflow: hidden;
  border: 1px solid var(--line); border-top-width: 3px; border-radius: 4px;
  cursor: pointer;
}
.picked-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
```

(슈트별 `border-top-style`은 기존 `.card.suit-physical` 등의 규칙과 같은 선택자 패턴을 `.picked-thumb.suit-*`에도 추가할 것 — 정확한 문법은 `.card.suit-behavioral { border-top-style: dashed; }`류를 그대로 복제.)

- [x] **Step 3**: `npm run typecheck`으로 새 prop 타입 오류가 없는지 확인한다.

## Task 2: 카드 판독창 컴포넌트 + CaseScreen 배선

**Files:**
- Create: `prototype/core-loop/src/lib/ui/CardDetailDrawer.svelte`
- Modify: `prototype/core-loop/src/lib/ui/CaseScreen.svelte`
- Modify: `prototype/core-loop/src/app.css`

**Interfaces:**
- `CardDetailDrawer` props: `{ open: boolean; card: ClueCard | null; collection: CollectionStateV1; content: RunContent; owned: boolean; verified: boolean; onclose: () => void }`
- Consumes: `cardFacetSlots(collection, card.id, content)`(`../collection`에서 import — `CollectionScreen.svelte`가 이미 쓰는 것과 동일), `collection.rejectedInterpretations.filter((n) => n.cardId === card.id)`, `CardChip`(기존 컴포넌트, `frame-full`/`small=false`로 그대로 사용).
- `CaseNotebookDrawer.svelte`와 동일한 모달 골격(스크림 버튼 + `role="dialog"` + `aria-modal="true"` + `$effect`로 열릴 때 `tick()` 후 focus + `Escape` 키 닫기)을 그대로 복제한다.

- [x] **Step 1**: `CardDetailDrawer.svelte`를 작성한다. 구조:
  - header: 카드 이름 + 슈트 라벨(`SUIT_LABEL`), 닫기 버튼(`aria-label="카드 판독창 닫기"`).
  - 본문 상단: `<CardChip {card} {verified} guest={!owned} />` — 실제 카드 전체(아트·태그·이름·수사 노트)를 그대로 보여준다.
  - 측면 목록: `owned`이면 `CollectionScreen.svelte`의 `.facet-slots` 마크업(아는/모르는 측면)을 그대로 재사용, 아니면 "이 카드를 보유하면 측면 자리가 드러납니다." 안내(컬렉션 화면의 `collection-silhouette` 문구와 동일 어휘 사용).
  - 오답 이력: `CollectionScreen.svelte`의 `.rejected-notes` 섹션을 그대로 재사용("아직 기록된 오답 해석이 없습니다." 포함).
  - 스크림/포커스/Escape 로직은 `CaseNotebookDrawer.svelte`를 그대로 복제.

- [x] **Step 2**: `CaseScreen.svelte`에 상태를 배선한다.

```ts
let showCardDetail = $state(false);
```

`pickCard(id)` 함수 맨 앞에 `showCardDetail = false;`를 추가한다(카드를 새로 집거나 선택을 취소할 때마다 이전 카드의 상세 판독창이 남아있지 않게 한다). `HandRail`에 `onviewdetail={() => (showCardDetail = true)}`를 넘긴다.

`<CaseNotebookDrawer .../>` 아래에 추가:

```svelte
<CardDetailDrawer
  open={showCardDetail && !!selectedClue}
  card={selectedClue}
  owned={!!selectedCard && game.ownedClues.includes(selectedCard)}
  verified={!!selectedCard && game.verified.includes(selectedCard)}
  {collection}
  {content}
  onclose={() => (showCardDetail = false)}
/>
```

(`selectedClue`는 이미 `CaseScreen.svelte`에 있는 `$derived` — 새로 만들지 않는다.)

- [x] **Step 3**: `app.css`에 판독창 포지셔닝을 추가한다. `.notebook-drawer`와 동일한 규칙(오른쪽 고정 drawer, `width: min(92vw, 520px)`, `z-index: 21` 등)을 `.card-detail-drawer`로 복제하거나, 원한다면 공통 클래스로 추출해도 된다(필수 아님 — 기존 코드도 아직 추출돼 있지 않다).

- [x] **Step 4**: `npm run typecheck && npm run build`로 타입·빌드 오류가 없는지 확인한다.

## Acceptance Criteria

- 핸드에서 카드를 집으면 판독줄에 실제 카드 그림(썸네일)이 보인다. 기존 "이름을 집었다 · 노트 대조" 텍스트는 그대로 남는다.
- 그 썸네일을 탭하면 카드 판독창이 열리고, 전체 카드(아트·태그·수사 노트) + 아는/모르는 측면 목록(또는 미보유 안내) + 이 카드의 오답 이력이 보인다.
- 핸드 안에서 같은 카드를 다시 탭하면 선택이 취소되고(기존 동작 그대로) 판독줄·판독창이 함께 사라진다.
- 다른 카드를 새로 집으면 이전 카드의 열려 있던 판독창이 자동으로 닫힌다.
- 판독창은 스크림 클릭·닫기 버튼·Escape 세 가지로 모두 닫히고, 닫은 뒤 포커스가 트리거로 돌아온다.
- 엔진·리듀서·저장 형식·`readFacets`/`노트 대조` 판정 로직은 변경되지 않는다 — `npm run smoke:ci`가 기존과 동일하게 통과한다.
- `npm run smoke:ci && npm run typecheck && npm run build` 모두 exit 0, 출력에 `FAIL` 없음.
- 브라우저에서 실제로 카드를 집고, 썸네일을 눌러 판독창을 열고, 닫고, 다른 카드를 집어 자동으로 닫히는지 한 번 확인한다.

## Comments

- 2026-08-03: `/브레인스토밍` 대화로 설계 확정(사용자 답변 3건 — 그림 필요·재클릭 대상 분리·상세 내용 구성) 후 사용자가 "티켓 생성하고 코덱스에서 진행할게"로 직접 실행을 요청. Entry Lane B(`docs/agents/codex-collab.md`) — Claude가 위임한 것이 아니라 사용자가 Codex에 직접 넘기는 경로이므로 `## Codex delegation` 블록은 만들지 않는다. Write-scope는 위 Task별 Files 목록이 사실상의 경계다.

## Resolution

2026-08-03: 핸드의 기존 「노트 대조」 판독줄에 선택 카드의 40×52 실제 아트 썸네일을 추가하고, 슈트별 실선·파선·겹선·점선 테두리와 접근 가능한 상세 보기 이름을 적용했다. 썸네일은 절대 배치해 모바일 판독줄 높이를 52px로 유지하며 핸드의 120px 상한을 늘리지 않는다.

새 `CardDetailDrawer`는 전체 `CardChip`, 영구 컬렉션 기준의 알려진/미해금 측면, 카드별 줄 그어진 오답을 보여준다. 대여 카드는 측면을 누출하지 않고 동일한 미보유 안내를 표시한다. 스크림·닫기 버튼·Escape가 모두 닫히며 원래 썸네일로 초점이 돌아간다. 카드를 다시 집거나 선택 취소하면 `pickCard` 진입 시 이전 판독창을 닫는다. 모달이 상단바·오디오 설정보다 아래에 갇히던 stacking context도 drawer가 열린 동안만 승격했다. 엔진·리듀서·저장 형식·`readFacets`는 변경하지 않았다.

실제 프로덕션 빌드를 데스크톱과 모바일 폭에서 열어 RED(상세 보기 버튼 0개) → GREEN(실제 이미지 URL, 40×52 썸네일, dialog)을 확인했다. 보유 카드 측면 목록, 대여 카드 실루엣, 같은 카드 재클릭 선택 취소, 다른 카드 선택 시 열린 판독창 자동 닫힘, 스크림·닫기 버튼·Escape, 닫은 뒤 초점 복귀를 모두 상호작용으로 검증했다. 최종 `npm run smoke:ci`(12/12), `npm run typecheck`, `npm run build`가 exit 0으로 통과했고 출력에 `FAIL`이 없었다.
