<script lang="ts">
  import { fade, fly, slide } from 'svelte/transition';
  import type { Action, GameState, RunContent, Tag } from '../engine';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();

  const ev = $derived(content.interludeEvents.find((e) => e.id === game.interlude?.eventId));
  const nextCase = $derived(content.cases[game.caseIndex + 1]);
  const revealed = $derived(game.interlude?.revealed ?? []);
  const decided = $derived(!!game.interlude?.choiceId);
  const ap = $derived(game.interlude?.ap ?? 0);
  const usedActions = $derived(game.interlude?.usedActions ?? []);

  function tagCount(tag: Tag): number {
    return game.verified.filter((id) => content.clues[id]?.tags.includes(tag)).length;
  }
  function revealOf(leadId: string): string | null {
    return ev?.investigation?.find((l) => l.id === leadId)?.reveal ?? null;
  }
</script>

<section class="screen interlude">
  <span class="interlude-mark">인터루드</span>
  {#if ev}
    <h1 in:fly={{ y: 10, duration: 300 }}>{ev.title}</h1>
    <p class="lede">{ev.desc}</p>

    {#if nextCase}
      <div class="next-case">
        <span class="next-label">다가오는 사건</span>
        <b>{nextCase.title}</b>
        <p>{nextCase.teaser ?? nextCase.intro}</p>
      </div>
    {/if}

    <div class="ap-bar">
      <span class="ap-label">행동력</span>
      <span class="ap-pips">
        {#each Array(content.interludeAP) as _, i (i)}
          <i class="ap-pip" class:spent={i >= ap}></i>
        {/each}
      </span>
      <b class="ap-num">{ap} / {content.interludeAP}</b>
      <span class="ap-note">조사·행동에 배분한다 — 전부는 할 수 없다</span>
    </div>

    <div class="actions-grid">
      <span class="section-head"><b>행동</b><i>비용을 치르고 판을 정비한다</i></span>
      <div class="action-list">
        {#each content.interludeActions as act (act.id)}
          {@const used = usedActions.includes(act.id)}
          {@const tooCostly = ap < act.cost}
          <button
            class="act"
            class:used
            disabled={used || tooCostly}
            onclick={() => dispatch({ type: 'INTERLUDE_ACTION', actionId: act.id })}
          >
            <span class="act-cost">{act.cost}</span>
            <span class="act-body"><b>{act.label}</b><i>{act.desc}</i></span>
            {#if used}<span class="act-done">✓</span>{/if}
          </button>
        {/each}
      </div>
    </div>

    {#if ev.investigation && ev.investigation.length > 0}
      <div class="investigation">
        <span class="section-head"><b>조사</b><i>리드 하나당 행동력 1 — 무엇을 캐고 무엇을 포기할 것인가</i></span>
        <div class="lead-list">
          {#each ev.investigation as lead (lead.id)}
            {@const done = revealed.includes(lead.id)}
            <button class="lead" class:done onclick={() => dispatch({ type: 'INVESTIGATE', leadId: lead.id })} disabled={done || ap < 1}>
              <span class="lead-mark">{done ? '✓' : '🔎'}</span>
              <span class="lead-label">{lead.label}</span>
              <i class="lead-cost">1</i>
              {#if lead.isHint}<i class="lead-hint-badge">힌트</i>{/if}
            </button>
          {/each}
        </div>
        {#each revealed as id (id)}
          <p class="reveal-line" class:hint={ev.investigation.find((l) => l.id === id)?.isHint} transition:slide={{ duration: 220 }}>
            {revealOf(id)}
          </p>
        {/each}
      </div>
    {/if}

    {#if !decided}
      <div class="choice-list">
        <span class="section-head"><b>결정</b><i>이 국면을 어떻게 넘길 것인가</i></span>
        {#each ev.choices ?? [] as ch (ch.id)}
          {@const locked = ch.requires ? tagCount(ch.requires.tag) < ch.requires.count : false}
          <button
            class="choice"
            class:locked
            disabled={locked}
            onclick={() => dispatch({ type: 'INTERLUDE_CHOICE', choiceId: ch.id })}
          >
            <b>{ch.label}</b>
            {#if ch.requires}
              <span class="req" class:met={!locked}>
                검증된 [{ch.requires.tag}] 단서 {ch.requires.count}장 필요 — 현재 {tagCount(ch.requires.tag)}장
              </span>
            {/if}
          </button>
        {/each}
      </div>
    {:else}
      <div class="interlude-result" in:fade={{ duration: 300 }}>
        <p>{game.interlude?.result}</p>
        <button class="primary" onclick={() => dispatch({ type: 'CONTINUE' })}>다음 사건으로</button>
      </div>
    {/if}
  {/if}
</section>
