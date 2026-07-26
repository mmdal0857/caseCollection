<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Action, GameState, PatternId, RunContent, Slot, Tag } from '../engine';
  import { FRAME_LABEL, facetCtxFor, facetOf } from '../engine';
  import { readFacets } from '../facets';
  import { josaPlaceholder, resolveJosa } from '../josa';
  import CardChip from './CardChip.svelte';
  import HandRail from './HandRail.svelte';
  import Meters from './Meters.svelte';
  import ReactionBand from './ReactionBand.svelte';
  import StageBackground from './StageBackground.svelte';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (action: Action) => void;
  } = $props();

  let selectedCard: string | null = $state(null);
  let facetSlot: string | null = $state(null);
  let hintMode: string | null = $state(null);
  let showNotebook = $state(false);

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
  const canSubmit = $derived(def.slots.every((slot) => game.confirmed[slot.id] || game.placed[slot.id]));
  const caseNotes = $derived(game.notebook.filter((note) => note.correct !== null));
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
    selectedCard = selectedCard === id ? null : id;
    facetSlot = null;
  }

  function clickSlot(slotId: string) {
    if (game.confirmed[slotId]) return;
    if (hintMode) {
      dispatch({ type: 'HINT', hintId: hintMode, slotId });
      hintMode = null;
    } else if (selectedCard) {
      facetSlot = slotId;
    } else if (game.placed[slotId]) {
      dispatch({ type: 'CLEAR_SLOT', slotId });
    }
  }

  function chooseFacet(facetKey: string) {
    if (!facetSlot || !selectedCard) return;
    dispatch({ type: 'PLACE', slotId: facetSlot, cardId: selectedCard, facetKey });
    selectedCard = null;
    facetSlot = null;
  }

  function declare(pattern: PatternId) {
    dispatch({ type: 'DECLARE', pattern });
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
          disabled={game.patternJudged}
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
              <span class="slot-label">{slot.label}<i class="slot-frame">{frameOf(slot)}</i></span>
            {/if}
          </button>
          {#if slot.josaAfter}<span class="josa" class:resolved={!!placed}>{josaFor(slot)}</span>{/if}
        {/each}
        <span class="piece">{def.pieces[def.slots.length]}</span>
      </p>
    </div>

    {#if facetChoices && selectedClue}
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
        <button class="hint-btn" class:arming={hintMode === hint.id} disabled={count === 0}
          onclick={() => (hintMode = hintMode === hint.id ? null : hint.id)}>
          {hint.name} ×{count}
        </button>
      {/each}
      <button class="notebook-btn" onclick={() => (showNotebook = !showNotebook)}>수사 노트 ({caseNotes.length})</button>
      <button class="primary submit" disabled={!canSubmit} onclick={() => dispatch({ type: 'SUBMIT' })}>추리 제출</button>
    </div>

    {#if showNotebook}
      <div class="notebook">
        {#each caseNotes as note, index (note.facetKey + index)}
          <p class:struck={!note.correct}><b>{content.clues[note.cardId].name}</b> — [{note.meaning}] {note.line}</p>
        {/each}
      </div>
    {/if}
  </main>

  <ReactionBand submit={game.lastSubmit} {slotLabel} />
  {#if game.awaitingAdvance}
    <div class="advance-row"><button class="primary" onclick={() => dispatch({ type: 'ADVANCE' })}>계속</button></div>
  {/if}
  <HandRail cards={hand} selected={selectedCard} verified={game.verified} onpick={pickCard} />
</section>
