<script lang="ts">
  import type { ClueCard } from '../engine';
  import { SUIT_LABEL, SUIT_ICON } from '../engine';

  let {
    card,
    verified = false,
    guest = false,
    selected = false,
    small = false,
    onclick,
  }: {
    card: ClueCard;
    verified?: boolean;
    guest?: boolean;
    selected?: boolean;
    small?: boolean;
    onclick?: () => void;
  } = $props();
</script>

{#if small}
  <span class="chip suit-{card.suit}" class:verified>
    <i class="chip-icon">{SUIT_ICON[card.suit]}</i>{card.name}
  </span>
{:else}
  <button
    class="card suit-{card.suit}"
    class:selected
    class:guest
    class:static={!onclick}
    onclick={onclick}
    type="button"
  >
    <span class="card-art" aria-hidden="true">{SUIT_ICON[card.suit]}</span>
    <span class="card-top">
      <i class="chip-suit">{SUIT_LABEL[card.suit]}</i>
      {#if guest}<i class="badge-guest">게스트</i>{/if}
      {#if verified}<i class="badge-verified">검증</i>{/if}
    </span>
    <span class="card-name">{card.name}</span>
    <span class="card-tags">
      {#each card.tags as t (t)}<i class="tag">{t}</i>{/each}
    </span>
    {#if verified}
      <span class="card-note">{card.text}</span>
    {:else}
      <span class="card-note locked">수사 노트 — 미해금</span>
    {/if}
  </button>
{/if}
