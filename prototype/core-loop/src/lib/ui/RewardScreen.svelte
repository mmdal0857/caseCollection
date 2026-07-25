<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Action, GameState, RunContent } from '../engine';
  import CardChip from './CardChip.svelte';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();
</script>

<section class="screen reward">
  <h1>단서팩</h1>
  <p class="lede">사건 해결 보상 — 셋 중 하나만 가질 수 있다.</p>
  <div class="pack-row">
    {#each game.packOffer as id, i (id)}
      <div class="pack-item" in:fly={{ y: 40, duration: 350, delay: i * 130 }}>
        <CardChip
          card={content.clues[id]}
          verified={game.verified.includes(id)}
          onclick={() => dispatch({ type: 'PICK_REWARD', cardId: id })}
        />
      </div>
    {/each}
  </div>
</section>
