<script lang="ts">
  import { fly } from 'svelte/transition';
  import { CONTENT } from './lib/content';
  import { initGame, reduce, type Action, type GameState } from './lib/engine';
  import Meters from './lib/ui/Meters.svelte';
  import BriefingScreen from './lib/ui/BriefingScreen.svelte';
  import CaseScreen from './lib/ui/CaseScreen.svelte';
  import RewardScreen from './lib/ui/RewardScreen.svelte';
  import InterludeScreen from './lib/ui/InterludeScreen.svelte';
  import EndScreen from './lib/ui/EndScreen.svelte';
  import ScenarioBoard from './lib/ui/ScenarioBoard.svelte';
  import DebugPanel from './lib/ui/DebugPanel.svelte';
  import ArtSwitcher from './lib/ui/ArtSwitcher.svelte'; // PROTOTYPE(13) — 시안 확정 시 제거

  let game = $state(initGame(CONTENT));
  const dispatch = (a: Action) => {
    // 순수 리듀서는 structuredClone으로 상태를 복제한다 — Svelte 5 $state 프록시는
    // structuredClone이 복제하지 못하므로($state.snapshot 필요) 평범한 객체로 스냅샷해 넘긴다.
    game = reduce($state.snapshot(game) as GameState, a, CONTENT);
  };

  // 모드: 추리 게임(v3) vs 시나리오 보드 실험(인접 서사 사슬).
  let mode: 'game' | 'scenario' = $state('game');
</script>

<div class="shell">
  <header class="topbar">
    <span class="proto-mark">PROTOTYPE — 얼굴 의미론 v10 (ticket 17)</span>
    <div class="mode-toggle">
      <button class:active={mode === 'game'} onclick={() => (mode = 'game')}>추리 게임 (통합)</button>
      <button class:active={mode === 'scenario'} onclick={() => (mode = 'scenario')}>시나리오 샌드박스</button>
    </div>
    {#if mode === 'game' && game.screen !== 'briefing'}
      <Meters
        heat={game.heat}
        trust={game.trust}
        badHeat={CONTENT.badHeat}
        axis={game.axis}
        axisDef={CONTENT.cases[game.caseIndex]?.axis}
      />
      <span class="run-progress">
        사건 {Math.min(game.caseIndex + 1, CONTENT.cases.length)}/{CONTENT.cases.length}
      </span>
    {/if}
  </header>

  {#if mode === 'scenario'}
    <div class="screen-holder" in:fly={{ y: 14, duration: 320 }}>
      <ScenarioBoard />
    </div>
  {:else}
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
  {/if}
</div>

{#if mode === 'game'}<DebugPanel {game} />{/if}
<ArtSwitcher />
