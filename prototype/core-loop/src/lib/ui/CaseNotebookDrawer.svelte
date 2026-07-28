<script lang="ts">
  import { tick } from 'svelte';
  import type { CollectionStateV1 } from '../collection';
  import { SUIT_LABEL, type GameState, type RunContent } from '../engine';

  let { open, game, content, collection, onclose }: {
    open: boolean;
    game: GameState;
    content: RunContent;
    collection: CollectionStateV1;
    onclose: () => void;
  } = $props();

  let panel = $state<HTMLElement>();
  const definition = $derived(content.cases[game.caseIndex]);
  const visibleIds = $derived([
    ...new Set([
      ...game.ownedClues,
      ...definition.guestClues,
    ]),
  ]);
  const visibleNotes = $derived(
    collection.rejectedInterpretations.filter((item) =>
      visibleIds.includes(item.cardId),
    ),
  );

  $effect(() => {
    if (open) void tick().then(() => panel?.focus());
  });

  function keydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') onclose();
  }
</script>

{#if open}
  <button class="drawer-scrim" aria-label="수사 노트 닫기" onclick={onclose}></button>
  <div
    bind:this={panel}
    class="notebook-drawer"
    role="dialog"
    aria-modal="true"
    aria-labelledby="case-notebook-title"
    tabindex="-1"
    onkeydown={keydown}
  >
    <header>
      <div>
        <p class="eyebrow">CASE NOTEBOOK</p>
        <h2 id="case-notebook-title">현재 수사 노트</h2>
      </div>
      <button onclick={onclose} aria-label="수사 노트 닫기">×</button>
    </header>

    <div class="drawer-cards">
      {#each visibleIds as cardId (cardId)}
        {@const card = content.clues[cardId]}
        <article class="suit-{card.suit}">
          <b>{card.name}</b>
          <span>{SUIT_LABEL[card.suit]} · {game.ownedClues.includes(cardId) ? '보유' : '대여'}</span>
          <ul>
            {#each card.facets.filter((facet) => game.knownFacets.includes(facet.key) || game.borrowedFacetKeys.includes(facet.key)) as facet (facet.key)}
              <li>{facet.meaning}</li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>

    <section class="drawer-rejections">
      <h3>줄 그어진 오답</h3>
      {#if visibleNotes.length === 0}
        <p>현재 카드와 관련된 오답 기록이 없습니다.</p>
      {:else}
        {#each visibleNotes as note (`${note.caseId}:${note.slotId}:${note.cardId}:${note.facetKey}`)}
          <p><s>{note.reaction}</s></p>
        {/each}
      {/if}
    </section>
  </div>
{/if}
