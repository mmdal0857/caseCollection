<script lang="ts">
  import { fly } from 'svelte/transition';
  import { CONTENT } from './lib/content';
  import { initGame, reduce, type Action, type GameState } from './lib/engine';
  import BriefingScreen from './lib/ui/BriefingScreen.svelte';
  import CaseScreen from './lib/ui/CaseScreen.svelte';
  import RewardScreen from './lib/ui/RewardScreen.svelte';
  import InterludeScreen from './lib/ui/InterludeScreen.svelte';
  import EndScreen from './lib/ui/EndScreen.svelte';

  let game = $state(initGame(CONTENT));
  const dispatch = (a: Action) => {
    // 순수 리듀서는 structuredClone으로 상태를 복제한다 — Svelte 5 $state 프록시는
    // structuredClone이 복제하지 못하므로($state.snapshot 필요) 평범한 객체로 스냅샷해 넘긴다.
    game = reduce($state.snapshot(game) as GameState, a, CONTENT);
  };

</script>

<div class="shell">
  <header class="topbar">
    <span class="proto-mark">CASE COLLECTION</span>
    <span class="run-progress">사건 {Math.min(game.caseIndex + 1, CONTENT.cases.length)}/{CONTENT.cases.length}</span>
  </header>

  {#key `${game.screen}:${game.caseIndex}`}
    <div class="screen-holder" in:fly={{ y: 14, duration: 320 }}>
      {#if game.screen === 'briefing'}
        <BriefingScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'case'}
        <CaseScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'reward'}
        <RewardScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'interlude'}
        <InterludeScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'end'}
        <EndScreen {game} content={CONTENT} {dispatch} />
      {/if}
    </div>
  {/key}
</div>
