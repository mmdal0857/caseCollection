<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Action, GameState, RunContent } from '../engine';
  import CardChip from './CardChip.svelte';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();

  const allClues = $derived(Object.values(content.clues));
  const clueVerified = $derived(game.verified.filter((id) => content.clues[id]).length);
  const totalSubmits = $derived(game.history.reduce((n, h) => n + h.submits, 0));

  // GOOD 엔딩 컨페티 — UI 전용 장식, 엔진과 무관.
  const confetti = Array.from({ length: 26 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 1.6 + Math.random() * 1.4,
    hue: [42, 6, 205, 268][i % 4],
  }));
</script>

<section class="screen end {game.ending?.kind === 'GOOD' ? 'good' : 'bad'}">
  {#if game.ending?.kind === 'GOOD'}
    <div class="confetti-layer" aria-hidden="true">
      {#each confetti as c, i (i)}
        <i
          class="confetti"
          style="left:{c.left}%; animation-delay:{c.delay}s; animation-duration:{c.dur}s; background:hsl({c.hue} 70% 60%)"
        ></i>
      {/each}
    </div>
  {/if}

  <h1 in:fly={{ y: 14, duration: 400 }}>{game.ending?.title}</h1>
  <p class="lede">{game.ending?.desc}</p>

  <div class="stats">
    <span>해결 {game.history.length}/{content.cases.length}건</span>
    <span>제출 {totalSubmits}회</span>
    <span>보유 {game.ownedClues.length}/{allClues.length}</span>
    <span>검증 {clueVerified}</span>
    <span>주목 {game.heat} · 신뢰 {game.trust}</span>
  </div>

  <div class="collection-grid compact">
    {#each allClues as card (card.id)}
      {#if game.ownedClues.includes(card.id)}
        <CardChip {card} verified={game.verified.includes(card.id)} />
      {:else}
        <div class="card back">?</div>
      {/if}
    {/each}
  </div>

  <button class="primary" onclick={() => dispatch({ type: 'RESTART' })}>다시 (run 재시작)</button>
</section>
