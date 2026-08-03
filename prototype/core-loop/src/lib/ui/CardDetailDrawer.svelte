<script lang="ts">
  import { tick } from 'svelte';
  import { cardFacetSlots, type CollectionStateV1 } from '../collection';
  import { SUIT_ICON, SUIT_LABEL, type ClueCard, type RunContent } from '../engine';
  import CardChip from './CardChip.svelte';

  let { open, card, collection, content, owned, verified, onclose }: {
    open: boolean;
    card: ClueCard | null;
    collection: CollectionStateV1;
    content: RunContent;
    owned: boolean;
    verified: boolean;
    onclose: () => void;
  } = $props();

  let panel = $state<HTMLElement>();
  const slots = $derived(card && owned ? cardFacetSlots(collection, card.id, content) : []);
  const rejectedNotes = $derived(
    card
      ? collection.rejectedInterpretations.filter((item) => item.cardId === card.id)
      : [],
  );

  $effect(() => {
    if (open && card) void tick().then(() => panel?.focus());
  });

  function keydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') onclose();
  }
</script>

{#if open && card}
  <button class="drawer-scrim" aria-label="카드 판독창 닫기" onclick={onclose}></button>
  <div
    bind:this={panel}
    class="card-detail-drawer"
    role="dialog"
    aria-modal="true"
    aria-labelledby="card-detail-title"
    tabindex="-1"
    onkeydown={keydown}
  >
    <header>
      <div>
        <p class="eyebrow">{SUIT_LABEL[card.suit]} 카드 판독</p>
        <h2 id="card-detail-title">{card.name}</h2>
      </div>
      <button onclick={onclose} aria-label="카드 판독창 닫기">×</button>
    </header>

    <div class="card-detail-card">
      <CardChip {card} {verified} guest={!owned} />
    </div>

    {#if owned}
      <ol class="facet-slots">
        {#each slots as slot (slot.index)}
          <li class:unknown={!slot.known}>
            {#if slot.known}
              <b>알려진 측면 {slot.index + 1}</b>
              <span>{slot.meaning}</span>
            {:else}
              <b>미해금 측면 {slot.index + 1}</b>
              <span aria-label="아직 모르는 측면">— 비어 있음 —</span>
            {/if}
          </li>
        {/each}
      </ol>
    {:else}
      <p class="card-detail-silhouette">
        <span aria-hidden="true">{SUIT_ICON[card.suit]}</span>
        이 카드를 보유하면 측면 자리가 드러납니다.
      </p>
    {/if}

    <section class="drawer-rejections">
      <h3>줄 그어진 해석</h3>
      {#if rejectedNotes.length === 0}
        <p>아직 기록된 오답 해석이 없습니다.</p>
      {:else}
        {#each rejectedNotes as note (`${note.caseId}:${note.slotId}:${note.cardId}:${note.facetKey}`)}
          <p><s>{note.reaction}</s></p>
        {/each}
      {/if}
    </section>
  </div>
{/if}
