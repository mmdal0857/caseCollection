<script lang="ts">
  import type { ClueCard } from '../engine';
  import { SUIT_LABEL, SUIT_ICON } from '../engine';
  // PROTOTYPE(티켓 13) — 아트 슬롯 시안. `proto`/`artFor` 임포트는 스타일 확정 시 제거하고
  // card.art(04 스키마의 개별 슬롯)만 남긴다.
  import { proto, artFor, treatClass } from '../protoart.svelte';

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

  // 04: 카드별 개별 아트 슬롯 + 슈트 공용 폴백. 폴백 경로도 같이 보여야
  // "일부만 채운 컬렉션"이 어떻게 보이는지 판단할 수 있다(08 §④ 분량 결정의 입력).
  const art = $derived(artFor(card.id));
  const frame = $derived(proto.frame);
  const treat = $derived(treatClass());
</script>

{#if small}
  <span class="chip suit-{card.suit}" class:verified>
    <i class="chip-icon">{SUIT_ICON[card.suit]}</i>{card.name}
  </span>
{:else}
  <button
    class="card suit-{card.suit} frame-{frame}"
    class:selected
    class:guest
    class:static={!onclick}
    class:has-art={art !== null}
    onclick={onclick}
    type="button"
  >
    <span class="art-slot {treat}" aria-hidden="true">
      {#if art !== null}
        <img src={art} alt="" />
      {:else}
        <i class="art-fallback">{SUIT_ICON[card.suit]}</i>
      {/if}
    </span>
    <span class="card-body">
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
    </span>
  </button>
{/if}
