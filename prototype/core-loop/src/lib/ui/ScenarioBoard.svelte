<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly, slide } from 'svelte/transition';
  import { CONTENT } from '../content';
  import { SUIT_ICON } from '../engine';
  import { linkBetween, composeScenario, verifyScenario, CRIME_SKELETON, type Verdict } from '../scenario';
  import { send, receive } from '../fx';

  // 서사 사슬 실험용 카드 풀 — kind가 골고루 퍼지도록 큐레이션.
  const POOL = [
    'omitted_witness', 'confronted_servant', 'night_errand', 'uniform_habit',
    'venom_trace', 'thread_fiber', 'mud_footprint', 'scattered_belongings',
    'tod_gap', 'handwriting_match', 'forged_ledger', 'torn_letter', 'train_ticket',
  ];
  const SIZE = 6;

  let positions: (string | null)[] = $state(Array(SIZE).fill(null));
  let selected: string | null = $state(null);
  let verdict: Verdict | null = $state(null); // 재확인 결과 — 판을 바꾸면 무효화

  function verify() {
    verdict = verifyScenario(positions.map((id) => (id ? CONTENT.clues[id] : null)));
  }

  const placedSet = $derived(new Set(positions.filter(Boolean)));
  const hand = $derived(POOL.filter((id) => !placedSet.has(id)));
  const readout = $derived(composeScenario(positions.map((id) => (id ? CONTENT.clues[id] : null))));
  const links = $derived(
    positions.map((id, i) => {
      if (i === 0 || !id || !positions[i - 1]) return null;
      return linkBetween(CONTENT.clues[positions[i - 1]!], CONTENT.clues[id]);
    }),
  );
  const synergyPct = $derived(readout.linksTotal === 0 ? 0 : Math.round((readout.linksCoherent / readout.linksTotal) * 100));

  function clickCard(id: string) {
    selected = selected === id ? null : id;
  }
  function clickPos(i: number) {
    verdict = null; // 판이 바뀌면 재확인 결과 무효
    if (selected) {
      // 이미 다른 칸에 있으면 제거 후 이동
      const prev = positions.indexOf(selected);
      if (prev >= 0) positions[prev] = null;
      positions[i] = selected;
      selected = null;
    } else if (positions[i]) {
      positions[i] = null;
    }
  }
  function reset() {
    positions = Array(SIZE).fill(null);
    selected = null;
    verdict = null;
  }
</script>

<section class="screen scenario-board">
  <h1>시나리오 보드 <span class="exp">— 실험</span></h1>
  <p class="lede">
    카드를 <b>나란히 배치</b>하는 것이 곧 사건을 <b>구상</b>하는 것. 인접한 두 카드는
    사건의 인과 사슬(범인 → 범행 → 흔적 → 기록)을 따라 흐르면 <em class="ok">이어지고</em>,
    거꾸로·비약하면 <em class="bad">이야기가 깨진다</em>. 잘 엮으면 아래에 사건 시나리오가 조립된다.
  </p>

  <div class="skeleton-guide">
    <span class="skeleton-label">사건 골격</span>
    {#each CRIME_SKELETON as beat, i (beat.kind)}
      <span class="beat" class:hit={verdict && verdict.beatsHit > i}>{beat.label}<i>{beat.kind}</i></span>
      {#if i < CRIME_SKELETON.length - 1}<span class="beat-arrow">→</span>{/if}
    {/each}
    <span class="skeleton-note">이 골격을 순서대로 밟으면 사건이 '성립'한다</span>
  </div>

  <div class="synergy">
    <span class="synergy-label">서사 응집도</span>
    <div class="synergy-bar"><div class="synergy-fill" style="width:{synergyPct}%"></div></div>
    <span class="synergy-num">{readout.linksCoherent}/{readout.linksTotal} 링크</span>
    <button class="verify" onclick={verify} disabled={readout.linksTotal === 0}>재확인 (검토)</button>
    <button class="reset" onclick={reset}>비우기</button>
  </div>

  <div class="chain">
    {#each positions as id, i (i)}
      {#if i > 0}
        <div class="link-cell">
          {#if links[i]}
            <span class="link {links[i]!.coherent ? 'ok' : 'bad'}" class:strong={links[i]!.strong} title={links[i]!.text}>
              {links[i]!.coherent ? (links[i]!.strong ? '⇒' : '→') : '⚡'}
              <i class="link-pat">{links[i]!.pattern}{#if links[i]!.strong}✦{/if}</i>
            </span>
          {:else}
            <span class="link empty">·</span>
          {/if}
        </div>
      {/if}
      <button class="pos {selected ? 'targeting' : ''}" class:filled={!!id} onclick={() => clickPos(i)}>
        {#if id}
          {#key id}
            <span class="pos-card suit-{CONTENT.clues[id].suit}" in:receive={{ key: id }} out:send={{ key: id }}>
              <i class="pos-icon">{SUIT_ICON[CONTENT.clues[id].suit]}</i>
              <b>{CONTENT.clues[id].name}</b>
              <i class="pos-kind">{CONTENT.clues[id].kind}</i>
            </span>
          {/key}
        {:else}
          <span class="pos-empty">{i + 1}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if readout.lines.length > 0}
    <div class="readout" transition:slide={{ duration: 200 }}>
      <span class="readout-head">조립된 시나리오</span>
      <p class="readout-body">
        {#each readout.lines as ln, i (i)}
          <span class="rl {ln.broken ? 'broken' : ''}" in:fly={{ y: 5, duration: 200, delay: i * 40 }}>{ln.text} </span>
        {/each}
      </p>
    </div>
  {/if}

  {#if verdict}
    <div class="verdict v-{verdict.verdict}" transition:slide={{ duration: 220 }}>
      <div class="verdict-head">
        <b class="verdict-mark">재확인 결과 — {verdict.verdict}</b>
        <span class="verdict-stats">응집 {verdict.coherentLinks}/{verdict.totalLinks} · 골격 {verdict.beatsHit}/{verdict.beatsTotal}</span>
      </div>
      {#if verdict.notes.length > 0}
        <ul class="verdict-notes">
          {#each verdict.notes as note, i (i)}<li>{note}</li>{/each}
        </ul>
      {/if}
    </div>
  {/if}

  <div class="pool">
    <span class="row-label">
      단서 카드 — 클릭해 집고, 칸을 클릭해 놓는다
      {#if selected}<i class="row-note">선택됨: {CONTENT.clues[selected].name}</i>{/if}
    </span>
    <div class="pool-cards">
      {#each hand as id (id)}
        <button
          class="pool-card suit-{CONTENT.clues[id].suit}"
          class:selected={selected === id}
          onclick={() => clickCard(id)}
          in:receive={{ key: id }}
          out:send={{ key: id }}
          animate:flip={{ duration: 250 }}
        >
          <i class="pool-icon">{SUIT_ICON[CONTENT.clues[id].suit]}</i>
          <span class="pool-name">{CONTENT.clues[id].name}</span>
          <i class="pool-kind">{CONTENT.clues[id].kind}</i>
        </button>
      {/each}
    </div>
  </div>

  <p class="board-note">
    <b>샌드박스</b> — 이 서사 사슬 메커닉은 이제 "추리 게임 (통합)" 모드의 추리 보드에
    <b>흡수</b>됐다(정답 판정 + 서사 응집도 한 판). 여기서는 정답 없이 자유롭게 사슬만 실험한다.
    링크 문법은 kind 사슬(v3 어휘) + 태그 공명(v5).
  </p>
</section>
