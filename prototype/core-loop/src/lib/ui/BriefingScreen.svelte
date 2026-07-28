<script lang="ts">
  import type { Action, GameState, RunContent } from '../engine';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();
  const definition = $derived(content.cases[game.caseIndex]);
</script>

<section class="screen briefing">
  <p class="eyebrow">
    {game.caseIndex === content.cases.length - 1 ? 'BOSS BRIEFING' : `CASE ${game.caseIndex + 1}`}
  </p>
  <h1>{definition.title}</h1>
  <p class="lede">{definition.intro}</p>
  {#if definition.teaser}<p class="briefing-teaser">{definition.teaser}</p>{/if}

  <ol class="briefing-steps" aria-label="이번 사건의 세 동작">
    <li><b>1. 카드 집기</b><span>핸드의 슈트 스택에서 카드를 고릅니다.</span></li>
    <li><b>2. 측면 고르기</b><span>그 카드를 어떤 의미로 읽을지 정합니다.</span></li>
    <li><b>3. 배치해 확정하기</b><span>빈칸에 놓으면 상태와 다음 고리에 전파됩니다.</span></li>
  </ol>

  <button class="primary" onclick={() => dispatch({ type: 'START' })}>
    사건 시작
  </button>
</section>
