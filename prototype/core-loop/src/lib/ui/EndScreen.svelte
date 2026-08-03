<script lang="ts">
  import type { Action, GameState, RunContent } from '../engine';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();

  const warningSeen = $derived(
    game.ending?.kind !== 'BAD' ||
      game.riskWarnings.includes('press') ||
      game.riskWarnings.includes('collapse'),
  );
</script>

<section class="screen end {game.ending?.kind === 'GOOD' ? 'good' : 'bad'}">
  <p class="eyebrow">{game.ending?.kind === 'GOOD' ? '결말' : '실패 결말'}</p>
  <h1>{game.ending?.title}</h1>
  <p class="lede">{game.ending?.desc}</p>

  {#if game.ending?.kind === 'BAD'}
    <p class="ending-warning-proof">
      {warningSeen
        ? '이 위험은 수사 상태와 인터루드 경고에서 먼저 예고되었습니다.'
        : '경고 기록이 없는 결말은 유효하지 않습니다.'}
    </p>
  {/if}

  <button class="primary" onclick={() => dispatch({ type: 'SHOW_SUMMARY' })}>
    수사 요약
  </button>
</section>
