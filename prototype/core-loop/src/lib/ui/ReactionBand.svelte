<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { GameState } from '../engine';

  let { submit, slotLabel }: {
    submit: GameState['lastSubmit'];
    slotLabel: (id: string) => string;
  } = $props();
</script>

<section class="reaction-band" aria-live="polite">
  {#if submit}
    <div class="reaction-summary {submit.kind}">
      {submit.kind === 'wrong'
        ? `${submit.outOf}개 중 ${submit.total}개 아귀가 맞음`
        : submit.kind === 'confirm' ? `${submit.total}장 확정` : '사건 재구성 완료'}
    </div>
    <ul class="reactions">
      {#each submit.reactions as reaction, i (reaction.slotId)}
        <li
          class="reaction"
          class:correct={reaction.correct}
          class:wrong={!reaction.correct}
          class:special={reaction.special}
          in:fly={{ y: 6, duration: 220, delay: i * 70 }}
        >
          <span class="reaction-slot">{slotLabel(reaction.slotId)}</span>
          <span class="reaction-mark">{reaction.correct ? '◈' : reaction.special ? '❝' : '✕'}</span>
          <span class="reaction-line">{reaction.line}</span>
        </li>
      {/each}
    </ul>
  {:else}
    <span class="reaction-wait">레이든은 당신이 놓을 다음 수를 기다린다.</span>
  {/if}
</section>
