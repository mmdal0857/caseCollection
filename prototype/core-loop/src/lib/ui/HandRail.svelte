<script lang="ts">
  import type { ClueCard, Suit } from '../engine';
  import { SUIT_LABEL, SUIT_ICON } from '../engine';
  import CardChip from './CardChip.svelte';

  type HandCard = { card: ClueCard; guest: boolean; available: boolean };

  let { cards, selected, verified, onpick }: {
    cards: HandCard[];
    selected: string | null;
    verified: string[];
    onpick: (id: string) => void;
  } = $props();

  const suits: Suit[] = ['physical', 'behavioral', 'documentary', 'forensic'];
  let openSuit: Suit | null = $state(null);
</script>

<section class="hand-rail" aria-label="손패">
  <div class="suit-stacks">
    {#each suits as suit (suit)}
      {@const held = cards.filter((item) => item.card.suit === suit)}
      {@const available = held.filter((item) => item.available)}
      <div class="suit-stack" class:open={openSuit === suit}>
        <button
          class="stack-tab suit-{suit}"
          type="button"
          aria-expanded={openSuit === suit}
          onclick={() => (openSuit = openSuit === suit ? null : suit)}
        >
          <span class="stack-icon">{SUIT_ICON[suit]}</span>
          <b>{SUIT_LABEL[suit]}</b>
          <span class="stack-count">{available.length}/{held.length}</span>
          <i>가용/보유</i>
        </button>
        {#if openSuit === suit}
          <div class="stack-fan">
            {#each held as item, i (item.card.id)}
              <div class="fan-card" style:--fan-index={i}>
                <CardChip
                  card={item.card}
                  guest={item.guest}
                  verified={verified.includes(item.card.id)}
                  selected={selected === item.card.id}
                  onclick={() => onpick(item.card.id)}
                />
              </div>
            {/each}
            {#if held.length === 0}<span class="empty-stack">보유 카드 없음</span>{/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</section>
