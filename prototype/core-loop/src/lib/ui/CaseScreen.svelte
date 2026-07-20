<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import type { Action, GameState, PatternId, RunContent } from '../engine';
  import { SUIT_LABEL, cardFitsSlot, influenceOf } from '../engine';
  import { send, receive } from '../fx';
  import CardChip from './CardChip.svelte';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();

  let selectedCard: string | null = $state(null);
  let hintMode: string | null = $state(null);
  let dedEl: HTMLElement | undefined = $state();

  const def = $derived(content.cases[game.caseIndex]);

  const inUse = $derived(
    new Set([
      ...Object.values(game.placed).filter(Boolean),
      ...Object.values(game.confirmed),
    ]),
  );

  const guestHand = $derived(
    def.guestClues
      .filter((id) => !game.ownedClues.includes(id) && !inUse.has(id))
      .map((id) => ({ id, guest: true })),
  );
  const ownedHand = $derived(
    game.ownedClues.filter((id) => !inUse.has(id)).map((id) => ({ id, guest: false })),
  );

  const declarable = $derived([
    ...game.ownedPatterns.map((id) => ({ id, guest: false })),
    ...(def.guestPattern && !game.ownedPatterns.includes(def.guestPattern)
      ? [{ id: def.guestPattern, guest: true }]
      : []),
  ]);

  const canSubmit = $derived(
    def.slots.every((sl) => game.confirmed[sl.id] || game.placed[sl.id]),
  );

  const hintCounts = $derived(
    Object.values(content.hintDefs).map((h) => ({
      ...h,
      count: game.hints.filter((x) => x === h.id).length,
    })),
  );

  // ── 통합(v6): 시나리오 조립을 추리 보드에 흡수 ──────────────────────────
  // 슬롯 순서대로 놓인 카드가 곧 사건 서사. 인접한 두 슬롯이 인과 사슬을 이루는지
  // 평가해(응집도) 정답 판정(근접도)과 나란히 보여준다 — 하나의 빈칸 두루마리.
  const chain = $derived(
    def.slots.map((sl) => game.confirmed[sl.id] ?? game.placed[sl.id] ?? null),
  );
  // 서사 적합도: 카드가 슬롯 역할에 맞는가(정답은 항상 맞음 → 정답=코히런트).
  const chainFit = $derived(
    def.slots.map((sl, i) => {
      const cid = chain[i];
      return cid ? cardFitsSlot(content.clues[cid], sl) : null; // null=빈 슬롯
    }),
  );
  // 인접 링크: 양 끝 카드가 각자 역할에 맞으면 이야기가 이어진다. 태그 공유면 강한 링크.
  const chainLinks = $derived(
    def.slots.map((sl, i) => {
      if (i === 0) return null;
      const aId = chain[i - 1];
      const bId = chain[i];
      if (!aId || !bId) return null;
      const coherent = chainFit[i - 1] === true && chainFit[i] === true;
      const resonance = content.clues[aId].tags.some((t) => content.clues[bId].tags.includes(t));
      return { coherent, strong: coherent && resonance };
    }),
  );
  const cohesion = $derived.by(() => {
    const ls = chainLinks.filter((l) => l != null);
    return { coherent: ls.filter((l) => l!.coherent).length, total: ls.length };
  });

  // 태그 = 영역 다수결: 지금 배경 상태에서 판정 규칙이 뒤집힌 슬롯(문맥 우세).
  const flipped = $derived(
    def.slots.filter((sl) => {
      if (typeof sl.answer === 'string') return false;
      const v = sl.answer.stat === 'heat' ? game.heat : game.trust;
      return v >= sl.answer.gte;
    }),
  );
  // 직전 확정에서 트랙을 민 태그 영향력(줄다리기 가시화).
  const lastInfluence = $derived(
    game.lastSubmit && game.lastSubmit.confirmedNow.length > 0
      ? influenceOf(game.lastSubmit.confirmedNow, content)
      : null,
  );

  let narrativeVerdict: { coherent: number; total: number; weakest: number } | null = $state(null);
  function reviewNarrative() {
    let weakest = -1;
    for (let i = 1; i < def.slots.length; i++) {
      const l = chainLinks[i];
      if (l && !l.coherent) { weakest = i; break; }
    }
    narrativeVerdict = { coherent: cohesion.coherent, total: cohesion.total, weakest };
  }

  // 오답 shake — 연속 오답에도 애니메이션이 재점화되도록 명령형으로 클래스 재부착.
  $effect(() => {
    const ls = game.lastSubmit;
    if (ls?.kind === 'wrong' && dedEl) {
      void ls.seq;
      dedEl.classList.remove('shake');
      void dedEl.offsetWidth;
      dedEl.classList.add('shake');
    }
  });

  function clickCard(id: string) {
    if (hintMode) return;
    selectedCard = selectedCard === id ? null : id;
  }

  function clickSlot(slotId: string) {
    if (game.confirmed[slotId]) return;
    if (hintMode) {
      dispatch({ type: 'HINT', hintId: hintMode, slotId });
      hintMode = null;
      return;
    }
    if (selectedCard) {
      dispatch({ type: 'PLACE', slotId, cardId: selectedCard });
      selectedCard = null;
      narrativeVerdict = null; // 판이 바뀌면 재확인 무효
    } else if (game.placed[slotId]) {
      dispatch({ type: 'CLEAR_SLOT', slotId });
      narrativeVerdict = null;
    }
  }

  function declare(p: PatternId) {
    dispatch({ type: 'DECLARE', pattern: p });
  }

  function reveal(slotId: string) {
    return game.reveals.find((r) => r.slotId === slotId);
  }

  function slotLabel(slotId: string): string {
    return def.slots.find((sl) => sl.id === slotId)?.label ?? slotId;
  }
</script>

<section class="screen case">
  <div class="case-head">
    <h1>{def.title}</h1>
    <p class="intro">{def.intro}</p>
    {#if def.contextHint}
      <p class="context-hint">{def.contextHint}</p>
    {/if}
  </div>

  {#if flipped.length > 0}
    <div class="regime-banner" in:fly={{ y: -6, duration: 250 }}>
      ⚑ 문맥 우세 — 배경 상태가 임계를 넘어 <b>{flipped.map((s) => s.label).join('·')}</b>의 정답이 지금 다른 카드로 바뀌어 있다. (같은 슬롯, 다른 답)
    </div>
  {/if}

  <div class="patterns-row">
    <span class="row-label">
      가설 선언{def.patterns.length > 1 ? ` — 골격 ${def.patterns.length}개` : ''}
    </span>
    {#each declarable as p (p.id)}
      <button
        class="pattern-chip"
        class:declared={game.declared.includes(p.id)}
        class:guest={p.guest}
        disabled={game.patternJudged}
        onclick={() => declare(p.id)}
      >
        {content.patterns[p.id].name}{#if p.guest}<i class="badge-guest">게스트</i>{/if}
      </button>
    {/each}
    {#if game.patternJudged}
      <span class="pattern-verdict" class:hit={game.patternHit}>
        {game.patternHit ? '적중 — 슈트별 근접도 해금' : '빗나감 — 재선언 불가'}
      </span>
    {:else}
      <span class="row-note">첫 제출에서 판정 · 적중하면 근접도가 슈트별로 상세화</span>
    {/if}
  </div>

  <div class="deduction-wrap" bind:this={dedEl}>
    <p class="deduction">
      {#each def.slots as slot, i (slot.id)}
        <span class="piece">{def.pieces[i]}</span>
        {#if game.confirmed[slot.id]}
          <span class="slot confirmed flip-in">
            <CardChip small card={content.clues[game.confirmed[slot.id]]} verified />
          </span>
        {:else}
          <button
            class="slot"
            class:filled={!!game.placed[slot.id]}
            class:targeting={!!hintMode}
            onclick={() => clickSlot(slot.id)}
          >
            {#if game.placed[slot.id]}
              {#key game.placed[slot.id]}
                {@const cid = game.placed[slot.id]!}
                <span class="slot-card" in:receive={{ key: cid }} out:send={{ key: cid }}>
                  <CardChip
                    small
                    card={content.clues[cid]}
                    verified={game.verified.includes(cid)}
                  />
                </span>
              {/key}
            {:else}
              <span class="slot-label">{slot.label}</span>
            {/if}
            {#if reveal(slot.id)}
              <span class="reveal">{reveal(slot.id)!.text}</span>
            {/if}
          </button>
        {/if}
      {/each}
      <span class="piece">{def.pieces[def.slots.length]}</span>
    </p>
  </div>

  {#if chain.some(Boolean)}
    <div class="story-strip">
      <span class="story-label">서사 사슬</span>
      <div class="story-chain">
        {#each def.slots as sl, i (sl.id)}
          {#if i > 0}
            {@const lk = chainLinks[i]}
            <span class="story-link {lk ? (lk.coherent ? (lk.strong ? 'strong' : 'ok') : 'bad') : 'gap'}">
              {lk ? (lk.coherent ? (lk.strong ? '⇒' : '→') : '⚡') : '·'}
            </span>
          {/if}
          <span class="story-node" class:empty={!chain[i]} class:misfit={chainFit[i] === false}>
            {chain[i] ? content.clues[chain[i]!].name : slotLabel(sl.id)}
          </span>
        {/each}
      </div>
      <span class="story-cohesion" class:full={cohesion.total > 0 && cohesion.coherent === cohesion.total}>
        응집 {cohesion.coherent}/{cohesion.total}
      </span>
      <button class="review" onclick={reviewNarrative} disabled={cohesion.total === 0}>재확인</button>
    </div>
    {#if narrativeVerdict}
      <div class="narrative-verdict" class:sound={narrativeVerdict.weakest < 0}>
        {#if narrativeVerdict.weakest < 0}
          ◈ 서사 검토 — 이야기가 앞뒤로 이어진다 (응집 {narrativeVerdict.coherent}/{narrativeVerdict.total}). 정답 판정과 별개로, 이 배열은 사건으로 성립한다.
        {:else}
          ⚡ 서사 검토 — {content.clues[chain[narrativeVerdict.weakest - 1]!]?.name} → {content.clues[chain[narrativeVerdict.weakest]!]?.name}에서 이야기가 끊긴다. 여기가 가장 약한 고리.
        {/if}
      </div>
    {/if}
  {/if}

  {#if game.lastSubmit}
    {#key game.lastSubmit.seq}
      <div class="feedback-block" in:fly={{ y: 8, duration: 250 }}>
        <div class="feedback {game.lastSubmit.kind}">
          {#if game.lastSubmit.kind === 'wrong'}
            ✕ {game.lastSubmit.outOf}개 중 {game.lastSubmit.total}개 아귀가 맞음 — 3개 미만, 확정 없음 (주목 +1)
          {:else if game.lastSubmit.kind === 'confirm'}
            ◈ {game.lastSubmit.total}장 확정 — 수사 노트 해금
          {:else}
            ★ 사건 재구성 완료
          {/if}
          {#if game.lastSubmit.perSuit}
            <span class="persuit">
              {#each game.lastSubmit.perSuit as x (x.suit)}
                <i>[{SUIT_LABEL[x.suit]}] {x.right}/{x.placed}</i>
              {/each}
            </span>
          {/if}
        </div>
        <ul class="reactions">
          {#each game.lastSubmit.reactions as r, i (r.slotId)}
            <li
              class="reaction"
              class:correct={r.correct}
              class:wrong={!r.correct}
              class:special={r.special}
              in:fly={{ y: 6, duration: 220, delay: 60 + i * 70 }}
            >
              <span class="reaction-slot">{slotLabel(r.slotId)}</span>
              <span class="reaction-mark">{r.correct ? '◈' : r.special ? '❝' : '✕'}</span>
              <span class="reaction-line">
                {r.line}
                {#if !r.correct && r.pattern}<i class="reaction-pattern">{r.pattern}</i>{/if}
              </span>
            </li>
          {/each}
        </ul>
        {#if lastInfluence && (lastInfluence.heat !== 0 || lastInfluence.trust !== 0)}
          <div class="influence-note">
            <span class="influence-label">영역 다수결</span>
            확정 카드의 태그가 트랙을 밀었다 —
            {#each lastInfluence.tags as t (t.tag)}<i class="inf-tag">{t.tag}×{t.count}</i>{/each}
            <b class="inf-result">
              {#if lastInfluence.heat !== 0}주목 {lastInfluence.heat > 0 ? '+' : ''}{lastInfluence.heat}{/if}
              {#if lastInfluence.trust !== 0}&nbsp;신뢰 {lastInfluence.trust > 0 ? '+' : ''}{lastInfluence.trust}{/if}
            </b>
          </div>
        {/if}
        {#if game.awaitingAdvance}
          <div class="advance-row">
            <span class="advance-note">사건이 풀렸다 — 위 반응과 영향력을 확인하고 넘어가라.</span>
            <button class="primary" onclick={() => dispatch({ type: 'ADVANCE' })}>계속</button>
          </div>
        {/if}
      </div>
    {/key}
  {/if}

  <div class="actions-row">
    {#each hintCounts as h (h.id)}
      <button
        class="hint-btn"
        class:arming={hintMode === h.id}
        disabled={h.count === 0}
        onclick={() => (hintMode = hintMode === h.id ? null : h.id)}
        title={h.desc}
      >
        {h.name} ×{h.count}
      </button>
    {/each}
    {#if hintMode}
      <span class="row-note arming-note">슬롯을 클릭해 사용 — 버튼을 다시 누르면 취소</span>
    {/if}
    <button
      class="primary submit"
      disabled={!canSubmit}
      onclick={() => dispatch({ type: 'SUBMIT' })}
    >
      추리 제출{game.submits > 0 ? ` (${game.submits}회째)` : ''}
    </button>
  </div>

  <div class="hand-wrap">
    {#if selectedCard}
      <span class="row-note selected-note">선택됨: {content.clues[selectedCard].name} → 슬롯을 클릭해 배치</span>
    {/if}

    {#if guestHand.length > 0}
      <div class="hand-section guest-section">
        <span class="section-head guest-head">
          <b>빌린 단서 (게스트)</b>
          <i>이 사건에서만 쓸 수 있다 · 사건을 해결하면 <em>영구 획득</em></i>
        </span>
        <div class="hand">
          {#each guestHand as h (h.id)}
            <div class="hand-item" in:receive={{ key: h.id }} out:send={{ key: h.id }} animate:flip={{ duration: 250 }}>
              <CardChip
                card={content.clues[h.id]}
                guest
                verified={game.verified.includes(h.id)}
                selected={selectedCard === h.id}
                onclick={() => clickCard(h.id)}
              />
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="hand-section">
      <span class="section-head">
        <b>내 단서</b>
        <i>어휘 게이트 — 보유한 단서만 추리에 놓을 수 있다</i>
      </span>
      <div class="hand">
        {#each ownedHand as h (h.id)}
          <div class="hand-item" in:receive={{ key: h.id }} out:send={{ key: h.id }} animate:flip={{ duration: 250 }}>
            <CardChip
              card={content.clues[h.id]}
              verified={game.verified.includes(h.id)}
              selected={selectedCard === h.id}
              onclick={() => clickCard(h.id)}
            />
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
