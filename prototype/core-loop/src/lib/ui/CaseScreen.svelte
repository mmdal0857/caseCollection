<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { CollectionStateV1 } from '../collection';
  import type { SfxCue } from '../audio';
  import type { Action, GameState, PatternId, RunContent, Slot, Tag } from '../engine';
  import { FRAME_LABEL, facetCtxFor, facetOf } from '../engine';
  import { readFacets } from '../facets';
  import { josaPlaceholder, resolveJosa } from '../josa';
  import CardChip from './CardChip.svelte';
  import CaseNotebookDrawer from './CaseNotebookDrawer.svelte';
  import HandRail from './HandRail.svelte';
  import Meters from './Meters.svelte';
  import ReactionBand from './ReactionBand.svelte';
  import StageBackground from './StageBackground.svelte';

  let { game, content, collection, dispatch, playSfx }: {
    game: GameState;
    content: RunContent;
    collection: CollectionStateV1;
    dispatch: (action: Action) => void;
    playSfx: (cue: SfxCue) => void;
  } = $props();

  let selectedCard: string | null = $state(null);
  let facetSlot: string | null = $state(null);
  let hintMode: string | null = $state(null);
  let showNotebook = $state(false);
  let notebookButton: HTMLButtonElement;

  const def = $derived(content.cases[game.caseIndex]);
  const inUse = $derived(new Set([
    ...Object.values(game.placed).filter(Boolean).map((placed) => placed!.cardId),
    ...Object.values(game.confirmed).map((placed) => placed.cardId),
  ]));
  const hand = $derived.by(() => {
    const ids = [
      ...def.guestClues.filter((id) => !game.ownedClues.includes(id)),
      ...game.ownedClues,
    ].filter((id) => !inUse.has(id));
    return ids.map((id) => {
      const card = content.clues[id];
      const available = def.slots.some((slot, index) => {
        if (game.confirmed[slot.id]) return false;
        return readFacets(card.facets, slot.role?.frame ?? null, facetCtxFor(game, content, index))
          .some((choice) => choice.usable);
      });
      return { card, guest: !game.ownedClues.includes(id), available };
    });
  });
  const declarable = $derived([
    ...game.ownedPatterns.map((id) => ({ id, guest: false })),
    ...(def.guestPattern && !game.ownedPatterns.includes(def.guestPattern)
      ? [{ id: def.guestPattern, guest: true }] : []),
  ]);
  const selectedClue = $derived(selectedCard ? content.clues[selectedCard] : null);
  const facetChoices = $derived.by(() => {
    if (!facetSlot || !selectedClue) return null;
    const index = def.slots.findIndex((slot) => slot.id === facetSlot);
    const slot = def.slots[index];
    return {
      slot,
      list: readFacets(selectedClue.facets, slot.role?.frame ?? null, facetCtxFor(game, content, index)),
    };
  });
  // **판정 이력** — 그 측면으로 제출해 결과를 본 적이 있는가(정오 무관). 커밋·지식·가용성과
  // 별개의 네 번째 축이며 `note.correct`가 채워졌는지와 일대일이다(CONTEXT.md 등록).
  const judgedFacets = $derived(
    new Set(game.notebook.filter((note) => note.correct !== null).map((note) => note.facetKey)),
  );
  // 집은 카드가 **실제로** 들어갈 수 있는 슬롯 집합. 목적은 힌트가 아니라 **헛클릭 제거**다
  // — 네 슬롯을 다 눌러보며 어디가 받는지 알아내는 건 플레이가 아니라 반복노동이다.
  // 다면성 발견은 여기서 죽지 않는다: 발견은 표기가 아니라 **놓은 뒤 피드백**(확정 보상·
  // 전파·반응)에 있으므로, 어디에 놓을 수 있는지를 좁혀줘도 무엇이 되는지는 여전히 놓아야 안다.
  // 예측을 새로 쓰지 않고 측면 피커가 쓰는 `readFacets`를 그대로 돌린다 — 컬티스트
  // 시뮬레이터의 "하이라이트가 거짓말한다"는 예측과 판정이 다른 술어를 쓸 때만 생긴다
  // (ticket 31 · docs/research/2026-07-28-cultist-simulator-affordance.md §2).
  const placeableSlots = $derived.by(() => {
    if (!selectedClue) return null;
    const ok = new Set<string>();
    def.slots.forEach((slot, index) => {
      if (game.confirmed[slot.id]) return;
      const list = readFacets(selectedClue.facets, slot.role?.frame ?? null, facetCtxFor(game, content, index));
      // 술어를 두 번 틀리고 실측으로 잡았다(2026-07-28).
      //   ① `list.length > 0` — `readFacets`는 **거르지 않고** 전부 판정해 돌려주고 정렬만
      //      하므로 늘 참이다. 네 슬롯이 전부 켜졌다.
      //   ② `list.some(v => v.usable)` — `usable`은 어휘 게이트·배경 게이트·앞 문맥만 보고
      //      **슬롯 frame을 보지 않는다.** 역시 네 슬롯이 전부 켜졌다.
      // 실제로 「환기구 틈」이 쓸 수 있는 읽기는 「밀실의 허점」(경로) 하나뿐이었다
      // (「전달 통로」는 *아직 모르는 측면*). 그러므로 **아는 읽기가 이 슬롯의 역할과 맞는가**,
      // 즉 `usable && fitsRole`이다.
      //
      // 여기에 **판정 이력**이 하나 더 붙는다(그릴링 결정). 공짜로 아는 측면(`facets[0]`)까지
      // 밝히면 "맞는 카드를 틀린 측면으로 읽었다"는 실패 양태가 평범한 플레이에서 사라진다 —
      // 엔진이 전용 반응까지 만들어둔 양태다. 그래서 **제출해 결과를 본 읽기만** 대조한다.
      // 대가는 희박함이다(run당 판정 14 / 측면 55, 첫 case는 통째로 공백). 실측으로 그
      // 숫자를 보여드린 뒤에도 사용자가 "희박해도 원칙이 먼저"로 재확인했다.
      if (list.some((v) => v.usable && v.fitsRole && judgedFacets.has(v.facet.key))) ok.add(slot.id);
    });
    return ok;
  });
  // 집은 카드의 읽기를 **판정 이력 × 지식** 두 축으로 갈라 센다. 한 숫자로 합치면
  // "더 굴려보면 열리는 것"과 "수사를 더 해야 열리는 것"이 구분되지 않는다.
  const pickedReadings = $derived.by(() => {
    if (!selectedClue) return null;
    const ctx = facetCtxFor(game, content, 0); // known·lent는 슬롯과 무관하므로 인덱스는 아무거나
    let judged = 0, knownUnjudged = 0, unknown = 0;
    for (const f of selectedClue.facets) {
      if (judgedFacets.has(f.key)) judged += 1;
      else if (ctx.known.has(f.key) || ctx.lent.has(f.key)) knownUnjudged += 1;
      else unknown += 1;
    }
    return { judged, knownUnjudged, unknown, lit: placeableSlots?.size ?? 0 };
  });
  const canSubmit = $derived(def.slots.every((slot) => game.confirmed[slot.id] || game.placed[slot.id]));
  // 배경은 **case가 아니라 배경 상태에 귀속**한다(ticket 13 §⑦). case별로 굽는 순간
  // 장수가 case 수만큼 불어나 13이 9장을 3장으로 줄인 근거가 사라진다.
  const scenes = {
    low: '/assets/backgrounds/trust-low.webp',
    mid: '/assets/backgrounds/trust-mid.webp',
    high: '/assets/backgrounds/trust-high.webp',
  };

  const treatment: Record<Tag, string> = {
    은밀: 'stealth', 공개: 'exposed', 논리: 'logic', 강압: 'force', 신중: 'prudence',
  };

  function meaningOf(slotId: string) {
    const placed = game.confirmed[slotId] ?? game.placed[slotId];
    return placed ? facetOf(placed.cardId, placed.facetKey, content)?.meaning ?? null : null;
  }

  function treatmentOf(slotId: string) {
    const placed = game.confirmed[slotId] ?? game.placed[slotId];
    const tag = placed ? facetOf(placed.cardId, placed.facetKey, content)?.tags[0] : null;
    return tag ? treatment[tag] : null;
  }

  function slotLabel(id: string) {
    return def.slots.find((slot) => slot.id === id)?.label ?? id;
  }

  function frameOf(slot: Slot) {
    return slot.role ? FRAME_LABEL[slot.role.frame] : '자유';
  }

  function josaFor(slot: Slot) {
    if (!slot.josaAfter) return '';
    const placed = game.confirmed[slot.id] ?? game.placed[slot.id];
    return placed
      ? resolveJosa(slot.josaAfter, content.clues[placed.cardId].name)
      : josaPlaceholder(slot.josaAfter);
  }

  function pickCard(id: string) {
    if (hintMode) return;
    if (selectedCard !== id) playSfx('card_pick');
    selectedCard = selectedCard === id ? null : id;
    facetSlot = null;
  }

  function clickSlot(slotId: string) {
    if (game.confirmed[slotId]) return;
    if (hintMode) {
      dispatch({ type: 'HINT', hintId: hintMode, slotId });
      hintMode = null;
    } else if (selectedCard) {
      // 못 받는 슬롯도 **클릭은 열어둔다.** 흐려놓은 것만으로 "네 칸 다 눌러보기"는 이미
      // 사라졌고, 피커는 막힌 측면마다 이유를 말해준다("아직 모르는 측면" · "앞 문맥이 다른
      // 이야기를 하고 있다"). 그 설명이 어휘 게이트를 가르치는 통로이므로, 필요를 없애되
      // 통로까지 막지는 않는다.
      facetSlot = slotId;
    } else if (game.placed[slotId]) {
      dispatch({ type: 'CLEAR_SLOT', slotId });
    }
  }

  function chooseFacet(facetKey: string) {
    if (!facetSlot || !selectedCard) return;
    playSfx('card_place');
    dispatch({ type: 'PLACE', slotId: facetSlot, cardId: selectedCard, facetKey });
    selectedCard = null;
    facetSlot = null;
  }

  function declare(pattern: PatternId) {
    dispatch({ type: 'DECLARE', pattern });
  }

  function closeNotebook(): void {
    showNotebook = false;
    requestAnimationFrame(() => notebookButton?.focus());
  }
</script>

<StageBackground trust={game.trust} heat={game.heat} {scenes} />

<section class="screen case play-layers">
  <Meters heat={game.heat} trust={game.trust} badHeat={content.badHeat} axis={game.axis} axisDef={def.axis} />

  <main class="scroll-layer">
    <header class="case-head">
      <h1>{def.title}</h1>
      <p class="intro">{def.intro}</p>
      {#if def.contextHint}<p class="context-hint">{def.contextHint}</p>{/if}
    </header>

    <div class="patterns-row">
      <span class="row-label">가설 선언</span>
      {#each declarable as pattern (pattern.id)}
        <button
          class="pattern-chip"
          class:declared={game.declared.includes(pattern.id)}
          class:guest={pattern.guest}
          disabled={game.patternJudged || game.casePhase === 'review'}
          onclick={() => declare(pattern.id)}
        >
          {content.patterns[pattern.id].name}
        </button>
      {/each}
    </div>

    <div class="deduction-wrap">
      <p class="deduction">
        {#each def.slots as slot, index (slot.id)}
          <span class="piece">{def.pieces[index]}</span>
          {@const placed = game.confirmed[slot.id] ?? game.placed[slot.id]}
          <button
            class="slot"
            class:filled={!!placed}
            class:locked={!!placed?.locked || !!game.confirmed[slot.id]}
            class:choosing={facetSlot === slot.id}
            class:can-take={!!placeableSlots?.has(slot.id)}
            class:cannot-take={!!placeableSlots && !placeableSlots.has(slot.id) && !game.confirmed[slot.id]}
            disabled={game.casePhase === 'review'}
            onclick={() => clickSlot(slot.id)}
          >
            {#if placed}
              <span class="slot-card propagate-step" style:--propagation-index={index}>
                <CardChip
                  small
                  card={content.clues[placed.cardId]}
                  verified={game.verified.includes(placed.cardId)}
                  treatment={treatmentOf(slot.id)}
                />
                <i class="facet-tag">{meaningOf(slot.id)}</i>
              </span>
            {:else}
              <span class="slot-label">
                <span>{slot.label}</span>
                <i class="slot-frame">{frameOf(slot)}</i>
              </span>
            {/if}
          </button>
          {#if slot.josaAfter}<span class="josa" class:resolved={!!placed}>{josaFor(slot)}</span>{/if}
        {/each}
        <span class="piece">{def.pieces[def.slots.length]}</span>
      </p>
    </div>

    {#if game.casePhase === 'compose' && facetChoices && selectedClue}
      <div class="facet-picker" in:fly={{ y: 8, duration: 200 }}>
        <div class="facet-head"><b>{selectedClue.name}</b> — {facetChoices.slot.label}에서 무엇으로 읽을 것인가</div>
        <ul class="facet-list">
          {#each facetChoices.list as choice (choice.facet.key)}
            <li class="facet" class:usable={choice.usable}>
              <button class="facet-btn" disabled={!choice.usable} onclick={() => chooseFacet(choice.facet.key)}>
                <b>{choice.facet.meaning}</b>
                <span>{FRAME_LABEL[choice.facet.frame]}</span>
                {#if !choice.usable}<i>{choice.why}</i>{/if}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="actions-row">
      {#each Object.values(content.hintDefs) as hint (hint.id)}
        {@const count = game.hints.filter((id) => id === hint.id).length}
        <button class="hint-btn" class:arming={hintMode === hint.id} disabled={count === 0 || game.casePhase === 'review'}
          onclick={() => (hintMode = hintMode === hint.id ? null : hint.id)}>
          {hint.name} ×{count}
        </button>
      {/each}
      <button
        bind:this={notebookButton}
        class="notebook-btn"
        onclick={() => (showNotebook = true)}
      >
        수사 노트 ({collection.rejectedInterpretations.length})
      </button>
      {#if game.casePhase === 'compose'}
        <button
          class="primary review"
          onclick={() => dispatch({ type: 'REQUEST_REVIEW' })}
        >
          이론 검토
        </button>
      {/if}
    </div>

    {#if game.casePhase === 'review' && game.review}
      <div class="review-panel" role="status">
        <p class="eyebrow">CASE REVIEW</p>
        <h2>
          {game.review.kind === 'sound'
            ? '이론이 성립한다'
            : game.review.kind === 'incomplete'
              ? '아직 비어 있는 고리가 있다'
              : '반증되는 고리가 있다'}
        </h2>
        <p>
          대조된 고리 {game.review.total}/{game.review.outOf}
          {#if game.review.weakSlotId}
            · 약한 고리:
            {slotLabel(game.review.weakSlotId)}
          {/if}
        </p>
        <div class="review-actions">
          <button onclick={() => dispatch({ type: 'RETURN_TO_COMPOSE' })}>
            수정하기
          </button>
          <button
            class="primary"
            disabled={game.review.kind === 'incomplete' || !canSubmit}
            onclick={() => dispatch({ type: 'FINAL_SUBMIT' })}
          >
            최종 제출
          </button>
        </div>
      </div>
    {/if}
  </main>

  <ReactionBand submit={game.lastSubmit} {slotLabel} />
  {#if game.casePhase === 'compose'}
    <HandRail cards={hand} selected={selectedCard} verified={game.verified} onpick={pickCard} readings={pickedReadings} />
  {:else}
    <div class="review-hand-lock">검토 중 · 수정하려면 ‘수정하기’를 누르십시오.</div>
  {/if}
</section>

<CaseNotebookDrawer
  open={showNotebook}
  {game}
  {content}
  {collection}
  onclose={closeNotebook}
/>
