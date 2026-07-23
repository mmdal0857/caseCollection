<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import type { Action, GameState, PatternId, RunContent, Slot } from '../engine';
  import { FRAME_LABEL, SUIT_LABEL, cardFitsSlot, facetCtxFor, facetOf } from '../engine';
  import { LOCK_MODES, interpretationSpace, readFacets, type LockMode } from '../facets';
  import { eul } from '../josa';
  import { send, receive } from '../fx';
  import CardChip from './CardChip.svelte';

  let { game, content, dispatch }: {
    game: GameState;
    content: RunContent;
    dispatch: (a: Action) => void;
  } = $props();

  let selectedCard: string | null = $state(null);
  let facetSlot: string | null = $state(null); // 얼굴 고르는 중인 슬롯
  let hintMode: string | null = $state(null);
  let showNotebook = $state(false);
  let dedEl: HTMLElement | undefined = $state();

  const def = $derived(content.cases[game.caseIndex]);

  const inUse = $derived(
    new Set([
      ...Object.values(game.placed).filter(Boolean).map((p) => p!.cardId),
      ...Object.values(game.confirmed).map((p) => p.cardId),
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

  // ── v10(티켓 12·17): 얼굴 의미론 ────────────────────────────────────────────
  const slotIdx = (id: string) => def.slots.findIndex((sl) => sl.id === id);

  const selectedClue = $derived(selectedCard ? content.clues[selectedCard] : null);

  /** 이 슬롯에서 선택된 카드의 얼굴들이 어떻게 읽히는가 — 12 §1의 "무엇이 될 수 있는지의 목록". */
  const facetChoices = $derived.by(() => {
    if (!facetSlot || !selectedClue) return null;
    const i = slotIdx(facetSlot);
    const slot = def.slots[i];
    const ctx = facetCtxFor(game, content, i);
    return {
      slot,
      ctx,
      list: readFacets(selectedClue.facets, slot.role?.frame ?? null, ctx),
    };
  });

  /** 손패 전체가 지금 이 슬롯에서 여는 해석 공간 — 포석이 눈에 보이려면 이게 떠 있어야 한다. */
  function spaceAt(slotId: string) {
    const i = slotIdx(slotId);
    const ctx = facetCtxFor(game, content, i);
    const pool = [...game.ownedClues, ...def.guestClues].flatMap((id) => content.clues[id].facets);
    return { ...interpretationSpace(pool, ctx), prevFrame: ctx.prevFrame };
  }

  const targetSpace = $derived(facetSlot ? spaceAt(facetSlot) : null);

  function meaningOf(slotId: string): string | null {
    const p = game.confirmed[slotId] ?? game.placed[slotId];
    if (!p) return null;
    return facetOf(p.cardId, p.facetKey, content)?.meaning ?? null;
  }

  const lockedCount = $derived(Object.values(game.placed).filter((p) => p?.locked).length);
  const caseNotes = $derived(game.notebook.filter((n) => n.correct !== null));

  // ── v6~v9 유지: 서사 사슬(응집) ─────────────────────────────────────────────
  const chain = $derived(
    def.slots.map((sl) => (game.confirmed[sl.id] ?? game.placed[sl.id])?.cardId ?? null),
  );
  const chainFit = $derived(
    def.slots.map((sl, i) => {
      const cid = chain[i];
      return cid ? cardFitsSlot(content.clues[cid], sl) : null;
    }),
  );
  const chainLinks = $derived(
    def.slots.map((_, i) => {
      if (i === 0) return null;
      const aId = chain[i - 1];
      const bId = chain[i];
      if (!aId || !bId) return null;
      const coherent = chainFit[i - 1] === true && chainFit[i] === true;
      // v10: 공명은 카드 태그가 아니라 **놓인 얼굴의 태그**로 판정한다.
      const pa = game.confirmed[def.slots[i - 1].id] ?? game.placed[def.slots[i - 1].id]!;
      const pb = game.confirmed[def.slots[i].id] ?? game.placed[def.slots[i].id]!;
      const fa = facetOf(pa.cardId, pa.facetKey, content);
      const fb = facetOf(pb.cardId, pb.facetKey, content);
      const resonance = !!fa && !!fb && fa.tags.some((t) => fb.tags.includes(t));
      return { coherent, strong: coherent && resonance };
    }),
  );
  const cohesion = $derived.by(() => {
    const ls = chainLinks.filter((l) => l != null);
    return { coherent: ls.filter((l) => l!.coherent).length, total: ls.length };
  });

  const flipped = $derived(
    def.slots.filter((sl) => {
      if (typeof sl.answer === 'string') return false;
      const v = sl.answer.stat === 'heat' ? game.heat : game.trust;
      return v >= sl.answer.gte;
    }),
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
    facetSlot = null;
  }

  function clickSlot(slotId: string) {
    if (game.confirmed[slotId]) return;
    if (hintMode) {
      dispatch({ type: 'HINT', hintId: hintMode, slotId });
      hintMode = null;
      return;
    }
    if (selectedCard) {
      // 얼굴을 고르는 것이 곧 수를 두는 것 — 자동 선택하지 않는다(12 §3).
      facetSlot = slotId;
    } else if (game.placed[slotId]) {
      dispatch({ type: 'CLEAR_SLOT', slotId });
      narrativeVerdict = null;
    }
  }

  function chooseFacet(facetKey: string) {
    if (!facetSlot || !selectedCard) return;
    dispatch({ type: 'PLACE', slotId: facetSlot, cardId: selectedCard, facetKey });
    selectedCard = null;
    facetSlot = null;
    narrativeVerdict = null;
  }

  function declare(p: PatternId) { dispatch({ type: 'DECLARE', pattern: p }); }
  function reveal(slotId: string) { return game.reveals.find((r) => r.slotId === slotId); }
  function slotLabel(slotId: string): string {
    return def.slots.find((sl) => sl.id === slotId)?.label ?? slotId;
  }
  function frameOf(sl: Slot) { return sl.role ? FRAME_LABEL[sl.role.frame] : '자유'; }
</script>

<section class="screen case">
  <div class="case-head">
    <h1>{def.title}</h1>
    <p class="intro">{def.intro}</p>
    {#if def.contextHint}<p class="context-hint">{def.contextHint}</p>{/if}
    {#if def.axis}<p class="context-hint axis-hint">가변축 [{def.axis.label}] — {def.axis.hint}</p>{/if}
  </div>

  <!-- ★ 이 프로토의 1번 질문. 판을 갈아엎지 않고 시점만 바꿔 같은 사건에서 비교한다. -->
  <div class="lockmode-bar">
    <span class="lockmode-title">잠금 시점 <i>(ticket 17 Q1 — 바꿔가며 느껴볼 것)</i></span>
    {#each LOCK_MODES as m (m.id)}
      <button
        class="lockmode-btn"
        class:active={game.lockMode === m.id}
        onclick={() => dispatch({ type: 'SET_LOCK_MODE', mode: m.id as LockMode })}
        title={m.desc}
      >
        {m.label}<i class="lockmode-origin">{m.origin}</i>
      </button>
    {/each}
    <span class="lockmode-desc">{LOCK_MODES.find((m) => m.id === game.lockMode)!.desc}</span>
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
            <CardChip small card={content.clues[game.confirmed[slot.id].cardId]} verified />
            <i class="facet-tag">{meaningOf(slot.id)}</i>
          </span>
        {:else}
          {@const p = game.placed[slot.id]}
          <button
            class="slot"
            class:filled={!!p}
            class:locked={!!p?.locked}
            class:targeting={!!hintMode}
            class:choosing={facetSlot === slot.id}
            onclick={() => clickSlot(slot.id)}
          >
            {#if p}
              {#key p.facetKey}
                <span class="slot-card" in:receive={{ key: p.cardId }} out:send={{ key: p.cardId }}>
                  <CardChip small card={content.clues[p.cardId]} verified={game.verified.includes(p.cardId)} />
                  <i class="facet-tag" class:locked={p.locked}>
                    {p.locked ? '🔒' : '✎'} {meaningOf(slot.id)}
                  </i>
                </span>
              {/key}
            {:else}
              <span class="slot-label">{slot.label}<i class="slot-frame">{frameOf(slot)}</i></span>
            {/if}
            {#if reveal(slot.id)}<span class="reveal">{reveal(slot.id)!.text}</span>{/if}
          </button>
          {#if p?.locked && game.lockMode !== 'submit'}
            <button class="undo-btn" title="되돌리기 — 주목 +1, 뒤의 수가 연쇄로 풀린다"
              onclick={() => { dispatch({ type: 'CLEAR_SLOT', slotId: slot.id }); narrativeVerdict = null; }}>↺</button>
          {/if}
          {#if p && !p.locked && game.lockMode === 'commit'}
            <button class="commit-btn" title="이 해석을 확정해 잠근다 — 앞으로 전파된다"
              onclick={() => dispatch({ type: 'LOCK_SLOT', slotId: slot.id })}>확정</button>
          {/if}
        {/if}
      {/each}
      <span class="piece">{def.pieces[def.slots.length]}</span>
    </p>
  </div>

  <!-- 얼굴 고르기 = 수 두기. 막힌 얼굴도 이유와 함께 보여준다(보이는 위험은 전략). -->
  {#if facetChoices && selectedClue}
    <div class="facet-picker" in:fly={{ y: 8, duration: 200 }}>
      <div class="facet-head">
        <b>{selectedClue.name}</b>{eul(selectedClue.name)}
        <b class="fp-slot">{facetChoices.slot.label}</b>[{frameOf(facetChoices.slot)}] 자리에서 무엇으로 읽을 것인가
        <button class="fp-cancel" onclick={() => (facetSlot = null)}>취소</button>
      </div>
      {#if targetSpace}
        <div class="space-strip">
          <span class="space-label">앞 문맥</span>
          <b>{targetSpace.prevFrame ? FRAME_LABEL[targetSpace.prevFrame] : '미정 — 아직 아무것도 커밋되지 않았다'}</b>
          <span class="space-label">열린 해석</span>
          {#each targetSpace.open as fr (fr)}<i class="sp open">{FRAME_LABEL[fr]}</i>{/each}
          {#if targetSpace.closed.length > 0}
            <span class="space-label">잠긴 해석</span>
            {#each targetSpace.closed as cl (cl.frame)}
              <i class="sp closed" title={cl.block === 'unknown' ? '모르는 얼굴' : cl.block === 'gate' ? '배경 상태가 막았다' : '앞 문맥이 막았다'}>
                {FRAME_LABEL[cl.frame]}
              </i>
            {/each}
          {/if}
        </div>
      {/if}
      <ul class="facet-list">
        {#each facetChoices.list as v (v.facet.key)}
          <li class="facet" class:usable={v.usable} class:fits={v.fitsRole}>
            <button class="facet-btn" disabled={!v.usable} onclick={() => chooseFacet(v.facet.key)}>
              <span class="facet-meaning">{v.facet.meaning}</span>
              <span class="facet-frame">{FRAME_LABEL[v.facet.frame]}</span>
              {#each v.facet.tags as t (t)}<i class="facet-tagchip">{t}</i>{/each}
              {#if v.usable}
                <span class="facet-fit">{v.fitsRole ? '◎ 이 자리의 역할과 맞는다' : '△ 역할이 어긋난다 — 오답이 되지만 다음 수를 연다'}</span>
              {:else}
                <span class="facet-block">✕ {v.why}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if game.lastLock}
    {#key game.lastLock.seq}
      <div class="lock-note" class:strong={game.lastLock.strongLink} in:fly={{ y: 6, duration: 220 }}>
        <span class="lock-mark">{game.lastLock.strongLink ? '✦' : '◈'}</span>
        <span class="lock-line">{game.lastLock.line}</span>
        <span class="lock-meta">
          [{game.lastLock.meaning}]
          {#if game.lastLock.heat}주목 {game.lastLock.heat > 0 ? '+' : ''}{game.lastLock.heat}{/if}
          {#if game.lastLock.trust}&nbsp;신뢰 {game.lastLock.trust > 0 ? '+' : ''}{game.lastLock.trust}{/if}
          {#if game.lastLock.axis && def.axis}&nbsp;{def.axis.label} {game.lastLock.axis > 0 ? '+' : ''}{game.lastLock.axis}{/if}
        </span>
        {#if game.lastLock.discovered}
          <span class="lock-discover">
            ✦ 강한 링크 — <b>{content.clues[game.lastLock.discovered.cardId].name}</b>의 새 얼굴
            [{game.lastLock.discovered.meaning}]을 알게 됐다
          </span>
        {/if}
        {#if game.lastLock.opened.length > 0}
          <span class="lock-opened">
            이 수가 연 해석: {game.lastLock.opened.map((f) => FRAME_LABEL[f]).join('·')}
          </span>
        {/if}
      </div>
    {/key}
  {/if}

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
            {#if meaningOf(sl.id)}<i class="node-face">{meaningOf(sl.id)}</i>{/if}
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
          ◈ 서사 검토 — 이야기가 앞뒤로 이어진다 (응집 {narrativeVerdict.coherent}/{narrativeVerdict.total}).
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
            ✕ {game.lastSubmit.outOf}개 중 {game.lastSubmit.total}개 아귀가 맞음 — 3개 미만, 확정 없음
            <i class="no-penalty">(플랫 페널티 없음 — 오염은 놓은 얼굴의 태그가 냈다)</i>
          {:else if game.lastSubmit.kind === 'confirm'}
            ◈ {game.lastSubmit.total}장 확정 — 수사 노트 해금
          {:else}
            ★ 사건 재구성 완료
          {/if}
          {#if game.lastSubmit.perSuit}
            <span class="persuit">
              {#each game.lastSubmit.perSuit as x (x.suit)}<i>[{SUIT_LABEL[x.suit]}] {x.right}/{x.placed}</i>{/each}
            </span>
          {/if}
        </div>
        <ul class="reactions">
          {#each game.lastSubmit.reactions as r, i (r.slotId)}
            <li class="reaction" class:correct={r.correct} class:wrong={!r.correct} class:special={r.special}
              in:fly={{ y: 6, duration: 220, delay: 60 + i * 70 }}>
              <span class="reaction-slot">{slotLabel(r.slotId)}</span>
              <span class="reaction-mark">{r.correct ? '◈' : r.rightCardWrongFace ? '◐' : r.special ? '❝' : '✕'}</span>
              <span class="reaction-line">
                {r.line}
                {#if r.meaning}<i class="reaction-face">[{r.meaning}]</i>{/if}
                {#if !r.correct && r.pattern}<i class="reaction-pattern">{r.pattern}</i>{/if}
              </span>
            </li>
          {/each}
        </ul>
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
      <button class="hint-btn" class:arming={hintMode === h.id} disabled={h.count === 0}
        onclick={() => (hintMode = hintMode === h.id ? null : h.id)} title={h.desc}>
        {h.name} ×{h.count}
      </button>
    {/each}
    {#if hintMode}<span class="row-note arming-note">슬롯을 클릭해 사용 — 버튼을 다시 누르면 취소</span>{/if}
    <button class="notebook-btn" onclick={() => (showNotebook = !showNotebook)}>
      수사 노트 ({caseNotes.length}) {#if game.undos > 0}<i class="undo-count">되돌림 {game.undos}</i>{/if}
    </button>
    <span class="row-note">잠긴 수 {lockedCount}/{def.slots.length}</span>
    <button class="primary submit" disabled={!canSubmit} onclick={() => dispatch({ type: 'SUBMIT' })}>
      추리 제출{game.submits > 0 ? ` (${game.submits}회째)` : ''}
    </button>
  </div>

  {#if showNotebook}
    <div class="notebook" in:fly={{ y: 8, duration: 200 }}>
      <span class="nb-head">수사 노트 — 맞은 해석은 지식이 되고, 틀린 해석은 줄 그어진 채 남는다</span>
      {#if caseNotes.length === 0}
        <p class="nb-empty">아직 판정된 해석이 없다.</p>
      {:else}
        <ul>
          {#each caseNotes as n, i (n.facetKey + i)}
            <li class:struck={!n.correct}>
              <b>{content.clues[n.cardId].name}</b> — [{n.meaning}] {n.line}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  <div class="hand-wrap">
    {#if selectedClue}
      <span class="row-note selected-note">
        선택됨: {selectedClue.name} → 슬롯을 클릭해 <b>얼굴을 고른다</b>
        (아는 얼굴 {selectedClue.facets.filter((f) => game.knownFacets.includes(f.key)).length}/{selectedClue.facets.length})
      </span>
    {/if}

    {#if guestHand.length > 0}
      <div class="hand-section guest-section">
        <span class="section-head guest-head">
          <b>빌린 단서 (게스트)</b>
          <i>카드뿐 아니라 <em>얼굴</em>도 빌려준다 · 사건을 해결하면 영구 획득</i>
        </span>
        <div class="hand">
          {#each guestHand as h (h.id)}
            <div class="hand-item" in:receive={{ key: h.id }} out:send={{ key: h.id }} animate:flip={{ duration: 250 }}>
              <CardChip card={content.clues[h.id]} guest verified={game.verified.includes(h.id)}
                selected={selectedCard === h.id} onclick={() => clickCard(h.id)} />
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="hand-section">
      <span class="section-head">
        <b>내 단서</b>
        <i>어휘 게이트 — 보유해도 <em>아는 얼굴</em>만 쓸 수 있다 (아는 얼굴 {game.knownFacets.length})</i>
      </span>
      <div class="hand">
        {#each ownedHand as h (h.id)}
          <div class="hand-item" in:receive={{ key: h.id }} out:send={{ key: h.id }} animate:flip={{ duration: 250 }}>
            <CardChip card={content.clues[h.id]} verified={game.verified.includes(h.id)}
              selected={selectedCard === h.id} onclick={() => clickCard(h.id)} />
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  /* v10 신규 요소만 — 나머지는 app.css */
  .lockmode-bar {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    margin: 10px 0; padding: 8px 12px;
    border: 1px dashed #8a6d3b; border-radius: 6px; background: #1e1b16;
  }
  .lockmode-title { font-size: 12px; color: #c9b78f; font-weight: 700; }
  .lockmode-title i { font-weight: 400; opacity: .65; }
  .lockmode-btn {
    display: flex; flex-direction: column; align-items: flex-start;
    padding: 4px 10px; font-size: 12px; border-radius: 4px;
    border: 1px solid #4a4238; background: #26221c; color: #cfc6b5; cursor: pointer;
  }
  .lockmode-btn.active { border-color: #d9a441; background: #3a2f1c; color: #f4e3bd; }
  .lockmode-origin { font-size: 10px; opacity: .55; font-style: normal; }
  .lockmode-desc { font-size: 11px; color: #9c9384; flex: 1 1 100%; }

  .facet-tag { display: block; font-size: 10px; font-style: normal; opacity: .8; }
  .facet-tag.locked { color: #d9a441; }
  .slot.locked { border-style: solid; border-color: #d9a441; }
  .slot.choosing { outline: 2px solid #7fb3d5; }
  .slot-frame { font-size: 9px; opacity: .5; margin-left: 4px; font-style: normal; }
  .undo-btn, .commit-btn {
    font-size: 10px; padding: 1px 5px; margin: 0 2px; border-radius: 3px;
    border: 1px solid #5a4a2f; background: #2a241a; color: #c9b78f; cursor: pointer;
  }
  .commit-btn { border-color: #7fb3d5; color: #cfe6f5; }

  .facet-picker {
    margin: 10px 0; padding: 10px 12px; border: 1px solid #4a5f72;
    border-radius: 6px; background: #161c22;
  }
  .facet-head { font-size: 13px; color: #dfe7ee; margin-bottom: 6px; }
  .fp-slot { color: #9fd3f5; }
  .fp-cancel {
    float: right; font-size: 11px; padding: 2px 8px; border-radius: 3px;
    border: 1px solid #4a4238; background: #24211c; color: #b9b0a0; cursor: pointer;
  }
  .space-strip { font-size: 11px; color: #8fa3b3; margin-bottom: 8px; }
  .space-label { opacity: .6; margin-right: 4px; }
  .space-strip b { color: #cfe6f5; margin-right: 10px; }
  .sp { font-style: normal; padding: 1px 5px; margin-right: 3px; border-radius: 3px; font-size: 10px; }
  .sp.open { background: #1f3a2a; color: #9fe6b8; }
  .sp.closed { background: #3a1f1f; color: #e69f9f; opacity: .6; text-decoration: line-through; }
  .facet-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
  .facet-btn {
    width: 100%; text-align: left; padding: 6px 9px; border-radius: 4px; cursor: pointer;
    border: 1px solid #3a4450; background: #1c232a; color: #cfd8e0;
  }
  .facet-btn:disabled { opacity: .45; cursor: not-allowed; }
  .facet.fits .facet-btn:not(:disabled) { border-color: #d9a441; }
  .facet-meaning { font-weight: 700; margin-right: 6px; }
  .facet-frame { font-size: 10px; opacity: .6; margin-right: 6px; }
  .facet-tagchip {
    font-size: 10px; font-style: normal; padding: 0 4px; margin-right: 3px;
    border-radius: 2px; background: #2c3540; color: #a9bccd;
  }
  .facet-fit, .facet-block { display: block; font-size: 10px; margin-top: 2px; opacity: .8; }
  .facet-block { color: #e69f9f; }

  .lock-note {
    margin: 8px 0; padding: 7px 11px; border-left: 3px solid #6b5a3a;
    background: #1c1913; font-size: 12px; color: #ddd2ba;
  }
  .lock-note.strong { border-left-color: #d9a441; background: #241f14; }
  .lock-mark { margin-right: 6px; color: #d9a441; }
  .lock-meta, .lock-discover, .lock-opened { display: block; font-size: 11px; opacity: .75; margin-top: 3px; }
  .lock-discover { color: #9fe6b8; opacity: 1; }

  .node-face { display: block; font-size: 9px; font-style: normal; opacity: .6; }
  .no-penalty { font-style: normal; font-size: 11px; opacity: .6; }
  .reaction-face { font-style: normal; font-size: 10px; opacity: .7; margin-left: 4px; }
  .notebook-btn {
    font-size: 12px; padding: 3px 10px; border-radius: 4px;
    border: 1px solid #4a4238; background: #24211c; color: #c9b78f; cursor: pointer;
  }
  .undo-count { font-style: normal; font-size: 10px; color: #e69f9f; margin-left: 4px; }
  .notebook {
    margin: 8px 0; padding: 10px 12px; border: 1px solid #4a4238;
    border-radius: 6px; background: #1a1713; font-size: 12px;
  }
  .nb-head { font-size: 11px; color: #9c9384; display: block; margin-bottom: 6px; }
  .nb-empty { opacity: .5; }
  .notebook ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .notebook li { color: #ddd2ba; }
  .notebook li.struck { text-decoration: line-through; opacity: .6; color: #c9a6a6; }
</style>
