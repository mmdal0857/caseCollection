<script lang="ts">
  import { humanizeInterludeResult } from '../engine';
  import type {
    Action,
    GameState,
    InterludeActionKind,
    RunContent,
  } from '../engine';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (action: Action) => void;
  } = $props();

  const event = $derived(
    content.interludeEvents.find((item) => item.id === game.interlude?.eventId),
  );
  const definition = $derived(
    content.interludes.find((item) => item.id === game.interlude?.definitionId),
  );
  const nextCase = $derived(content.cases[game.caseIndex + 1]);
  const ap = $derived(game.interlude?.ap ?? 0);
  const used = $derived(game.interlude?.usedActions ?? []);
  const budget = $derived(definition?.apBudget ?? content.interludeAP);
  const actions = $derived(definition?.actions ?? content.interludeActions);
  const complete = $derived(used.length === budget);

  const kindLabel: Record<InterludeActionKind, string> = {
    recon: '정찰',
    interview: '면담',
    stabilize: '안정',
  };
  const kindDescription: Record<InterludeActionKind, string> = {
    recon: '다음 사건의 공개 허용 복선을 확인한다.',
    interview: '다음 사건 guest allowlist의 측면 하나를 빌린다.',
    stabilize: '현재 실패축을 한 단계 완화한다.',
  };
</script>

<section class="screen interlude">
  <p class="eyebrow">INTERLUDE · 3선 2택</p>
  <h1>{definition?.presentation ?? event?.title ?? '다음 사건을 준비한다'}</h1>
  <p class="lede">{event?.desc}</p>

  {#if game.riskWarnings.includes('press') || game.riskWarnings.includes('collapse')}
    <aside class="risk-warning" role="alert">
      <b>실패 임계 접근</b>
      {#if game.riskWarnings.includes('press')}
        <span>주목이 한 단계 더 오르면 언론 재판으로 끝날 수 있습니다.</span>
      {/if}
      {#if game.riskWarnings.includes('collapse')}
        <span>신뢰가 한 단계 더 내려가면 수사반이 붕괴할 수 있습니다.</span>
      {/if}
      <span>`수사 안정`으로 현재 위험축을 한 단계 완화할 수 있습니다.</span>
    </aside>
  {/if}

  <div class="next-case">
    <span class="next-label">다가오는 사건</span>
    <b>{nextCase.title}</b>
    <p>{nextCase.teaser ?? '브리핑 전에는 공개 가능한 배경만 확인할 수 있다.'}</p>
  </div>

  <div class="ap-bar" aria-label={`남은 행동력 ${ap}`}>
    <span class="ap-label">장면 행동력</span>
    <span class="ap-pips" aria-hidden="true">
      {#each Array(budget) as _, index (index)}
        <i class="ap-pip" class:spent={index >= ap}></i>
      {/each}
    </span>
    <b>{ap}/{budget}</b>
    <span>이 장면에서만 사용 · 다음 장면으로 이월되지 않음</span>
  </div>

  <div class="interlude-actions">
    {#each actions as action (action.kind)}
      {@const chosen = used.includes(action.kind)}
      <button
        class="interlude-action"
        class:chosen
        disabled={chosen || ap === 0}
        onclick={() =>
          dispatch({ type: 'INTERLUDE_ACTION', kind: action.kind })}
      >
        <span class="action-kind">{kindLabel[action.kind]}</span>
        <b>{action.label}</b>
        <span>{'desc' in action ? action.desc : kindDescription[action.kind]}</span>
        <i>{chosen ? '선택 완료' : 'AP 1'}</i>
      </button>
    {/each}
  </div>

  {#if game.interlude && game.interlude.results.length > 0}
    <div class="interlude-results" aria-live="polite">
      {#each game.interlude.results as result, index (`${index}:${result}`)}
        <p>{humanizeInterludeResult(result, content)}</p>
      {/each}
    </div>
  {/if}

  <button
    class="primary"
    disabled={!complete}
    onclick={() => dispatch({ type: 'CONTINUE' })}
  >
    다음 브리핑
  </button>
</section>
