<script lang="ts">
  import type { Action, GameState, RunContent } from '../engine';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (action: Action) => void;
  } = $props();

  const definition = $derived(content.cases[game.caseIndex]);
  const reactions = $derived(game.lastSubmit?.reactions ?? []);
</script>

<section class="screen clear-feedback">
  <p class="eyebrow">사건 정리</p>
  <h1>{definition.title}</h1>
  <p class="clear-verdict">이론이 성립했습니다.</p>

  <div class="clear-reactions" aria-label="마지막 제출 반응">
    {#each reactions as reaction (reaction.slotId)}
      <p>
        <b>{definition.slots.find((slot) => slot.id === reaction.slotId)?.label}</b>
        <span>{reaction.line}</span>
      </p>
    {/each}
  </div>

  {#if definition.guestClues.length > 0}
    <div class="guest-earned">
      <b>컬렉션에 남은 게스트 카드</b>
      <span>
        {definition.guestClues.map((id) => content.clues[id].name).join(' · ')}
      </span>
    </div>
  {/if}

  <button class="primary" onclick={() => dispatch({ type: 'ADVANCE' })}>
    {game.caseIndex === content.cases.length - 1 ? '엔딩으로' : '인터루드로'}
  </button>
</section>
