<script lang="ts">
  import type { Action, GameState, RunContent } from '../engine';
  import CardChip from './CardChip.svelte';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();

  const allClues = $derived(Object.values(content.clues));
  const ownedCount = $derived(game.ownedClues.length);
  const verifiedCount = $derived(game.verified.filter((id) => content.clues[id]).length);
</script>

<section class="screen briefing">
  <h1>사건부 — 미해결 4건</h1>
  <p class="lede">
    보유한 단서 카드만 추리에 쓸 수 있다(어휘 게이트). 제출하면 "몇 개 맞음"만 알려주고,
    3개 이상 맞으면 그 자리에서 확정된다. 오답 제출과 요란한 카드는 <b>주목</b>을 끌어올리고 —
    주목이 8을 넘긴 채 인터루드를 맞으면 run이 나쁘게 끝난다.
  </p>

  <div class="collection-head">
    <h2>컬렉션</h2>
    <span class="progress-2axis">보유 {ownedCount}/{allClues.length} · 검증 {verifiedCount}</span>
  </div>
  <div class="collection-grid">
    {#each allClues as card (card.id)}
      {#if game.ownedClues.includes(card.id)}
        <CardChip {card} verified={game.verified.includes(card.id)} />
      {:else}
        <div class="card back" title="미보유">?</div>
      {/if}
    {/each}
  </div>

  <div class="collection-head"><h2>패턴 카드</h2></div>
  <div class="pattern-list">
    {#each Object.values(content.patterns) as p (p.id)}
      {#if game.ownedPatterns.includes(p.id)}
        <div class="pattern-card" class:verified={game.verified.includes(p.id)}>
          <b>{p.name}</b>
          <span class="card-note" class:locked={!game.verified.includes(p.id)}>
            {game.verified.includes(p.id) ? p.text : '수사 노트 — 미해금'}
          </span>
        </div>
      {:else}
        <div class="pattern-card back">?</div>
      {/if}
    {/each}
  </div>

  <div class="hint-inventory">
    소모품:
    {#each game.hints as h, i (i)}
      <span class="hint-token">{content.hintDefs[h].name}</span>
    {/each}
  </div>

  <button class="primary" onclick={() => dispatch({ type: 'START' })}>run 시작</button>
</section>
