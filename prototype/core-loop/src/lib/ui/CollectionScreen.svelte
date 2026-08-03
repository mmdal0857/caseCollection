<script lang="ts">
  import {
    cardFacetSlots,
    collectionProgress,
    type CollectionStateV1,
  } from '../collection';
  import {
    SUITS,
    SUIT_ICON,
    SUIT_LABEL,
    type RunContent,
    type Suit,
  } from '../engine';

  let { collection, content, onback }: {
    collection: CollectionStateV1;
    content: RunContent;
    onback: () => void;
  } = $props();

  let suit = $state<Suit | 'all'>('all');
  let ownership = $state<'all' | 'owned' | 'unowned'>('all');
  let selectedId = $state<string | null>(null);

  const progress = $derived(collectionProgress(collection, content));
  const cards = $derived(
    Object.values(content.clues).filter((card) => {
      const owned = collection.ownedCardIds.includes(card.id);
      return (
        (suit === 'all' || card.suit === suit) &&
        (ownership === 'all' ||
          (ownership === 'owned' ? owned : !owned))
      );
    }),
  );
  const selected = $derived(selectedId ? content.clues[selectedId] : null);
  const selectedSlots = $derived(
    selected ? cardFacetSlots(collection, selected.id, content) : [],
  );
  const selectedNotes = $derived(
    selected
      ? collection.rejectedInterpretations.filter((item) => item.cardId === selected.id)
      : [],
  );
</script>

<main class="collection-screen">
  <header class="collection-title">
    <button class="back-button" onclick={onback} aria-label="이전 화면">←</button>
    <div>
      <p class="eyebrow">컬렉션</p>
      <h1>컬렉션과 수사 노트</h1>
    </div>
  </header>

  <section class="progress-axes" aria-label="컬렉션 진행도">
    <span><b>{progress.ownedCards.value}/{progress.ownedCards.total}</b> 보유 카드</span>
    <span><b>{progress.knownOwnedFacets.value}/{progress.knownOwnedFacets.total}</b> 보유 카드의 아는 측면</span>
    <span><b>{progress.knownAllFacets.value}/{progress.knownAllFacets.total}</b> 전체 아는 측면</span>
  </section>

  <div class="collection-filters">
    <div role="group" aria-label="슈트 필터">
      <button class:active={suit === 'all'} onclick={() => (suit = 'all')}>전체</button>
      {#each SUITS as item (item)}
        <button
          class="suit-marker suit-{item}"
          class:active={suit === item}
          onclick={() => (suit = item)}
        >
          <span aria-hidden="true">{SUIT_ICON[item]}</span>
          {SUIT_LABEL[item]}
        </button>
      {/each}
    </div>
    <div role="group" aria-label="보유 상태 필터">
      <button class:active={ownership === 'all'} onclick={() => (ownership = 'all')}>전체</button>
      <button class:active={ownership === 'owned'} onclick={() => (ownership = 'owned')}>보유</button>
      <button class:active={ownership === 'unowned'} onclick={() => (ownership = 'unowned')}>미보유</button>
    </div>
  </div>

  <section class="collection-layout">
    <div class="collection-cards" aria-label="단서 카드">
      {#each cards as card (card.id)}
        {@const owned = collection.ownedCardIds.includes(card.id)}
        <button
          class="collection-card suit-{card.suit}"
          class:unowned={!owned}
          class:selected={selectedId === card.id}
          onclick={() => (selectedId = card.id)}
          aria-label={owned ? card.name : `${SUIT_LABEL[card.suit]} 미보유 카드`}
        >
          <span class="suit-symbol" aria-hidden="true">{SUIT_ICON[card.suit]}</span>
          <b>{owned ? card.name : '미확보'}</b>
          <span>{owned ? `${cardFacetSlots(collection, card.id, content).filter((slot) => slot.known).length}/${card.facets.length} 측면` : SUIT_LABEL[card.suit]}</span>
        </button>
      {/each}
    </div>

    <aside class="collection-detail" aria-live="polite">
      {#if selected && collection.ownedCardIds.includes(selected.id)}
        <p class="eyebrow">{SUIT_LABEL[selected.suit]} · {selected.kind}</p>
        <h2>{selected.name}</h2>
        <ol class="facet-slots">
          {#each selectedSlots as slot (slot.index)}
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
        <div class="rejected-notes">
          <h3>줄 그어진 해석</h3>
          {#if selectedNotes.length === 0}
            <p>아직 기록된 오답 해석이 없습니다.</p>
          {:else}
            {#each selectedNotes as note (`${note.caseId}:${note.slotId}:${note.facetKey}`)}
              <p><s>{note.reaction}</s></p>
            {/each}
          {/if}
        </div>
      {:else if selected}
        <p class="collection-silhouette">
          <span aria-hidden="true">{SUIT_ICON[selected.suit]}</span>
          이 카드를 보유하면 측면 자리가 드러납니다.
        </p>
      {:else}
        <p>카드를 선택하면 알려진 측면과 수사 노트를 함께 볼 수 있습니다.</p>
      {/if}
    </aside>
  </section>

  <section class="pattern-stack">
    <h2>패턴 카드</h2>
    <div>
      {#each Object.values(content.patterns) as pattern (pattern.id)}
        <article class:unowned={!collection.ownedPatternIds.includes(pattern.id)}>
          <b>{collection.ownedPatternIds.includes(pattern.id) ? pattern.name : '미확보 패턴'}</b>
          <span>{collection.ownedPatternIds.includes(pattern.id) ? pattern.text : '?'}</span>
        </article>
      {/each}
    </div>
  </section>
</main>
