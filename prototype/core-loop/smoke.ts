// PROTOTYPE smoke — v10(티켓 17). 두 가지를 본다:
//   A) 게임이 여전히 완주 가능한가 (잠금 모드 3종 각각에서 — 즉시 잠금이 소프트락을 만들지 않는가)
//   B) **엔진이 콘텐츠 검증기로 쓸 만한가** — 티켓 17의 부수 확인이자 12 §8·14·07이 딛고 선 가정.
//      기계가 case를 "①아는 얼굴만으로 풀 수 있음 + ②정답이 이야기로 성립함"으로 판정할 수 있어야 한다.
// 실행: npx esbuild smoke.ts --bundle --format=esm --platform=node --outfile=smoke.mjs && node smoke.mjs
import { CONTENT } from './src/lib/content';
import {
  cardFitsSlot, facetCtxFor, initGame, reduce, resolveAnswer,
  type Action, type CaseDef, type GameState, type Slot,
} from './src/lib/engine';
import { facetStatus, type LockMode } from './src/lib/facets';

function step(g: GameState, a: Action): GameState { return reduce(g, a, CONTENT); }

/** 이 슬롯의 정답 카드를, 슬롯 역할에 맞는 얼굴로. (v10: 정답 = 맞는 카드 + 맞는 얼굴) */
function answerMove(sl: Slot, g: GameState): { cardId: string; facetKey: string } | null {
  const cardId = resolveAnswer(sl, g);
  const card = CONTENT.clues[cardId];
  const f = card?.facets.find((x) => !sl.role || x.frame === sl.role.frame);
  return f ? { cardId, facetKey: f.key } : null;
}

function solveCase(g: GameState): GameState {
  const def = CONTENT.cases[g.caseIndex];
  for (const p of def.patterns) g = step(g, { type: 'DECLARE', pattern: p });
  let guard = 0;
  while (g.screen === 'case' && guard++ < 30) {
    for (const sl of def.slots.filter((s) => !g.confirmed[s.id])) {
      const mv = answerMove(sl, g);
      if (mv) g = step(g, { type: 'PLACE', slotId: sl.id, cardId: mv.cardId, facetKey: mv.facetKey });
    }
    g = step(g, { type: 'SUBMIT' });
    if (g.awaitingAdvance) { g = step(g, { type: 'ADVANCE' }); break; }
  }
  return g;
}

function advance(g: GameState): GameState {
  if (g.screen === 'reward') g = step(g, { type: 'PICK_REWARD', cardId: g.packOffer[0] });
  if (g.screen === 'interlude') {
    const ev = CONTENT.interludeEvents.find((e) => e.id === g.interlude!.eventId)!;
    const ch = (ev.choices ?? []).find((c) =>
      !c.requires || g.verified.filter((id) => CONTENT.clues[id]?.tags.includes(c.requires!.tag)).length >= c.requires!.count,
    )!;
    g = step(g, { type: 'INTERLUDE_CHOICE', choiceId: ch.id });
    g = step(g, { type: 'CONTINUE' });
  }
  return g;
}

function playRun(mode: LockMode): GameState {
  let g = initGame(CONTENT);
  g.lockMode = mode;
  g = step(g, { type: 'START' });
  let guard = 0;
  while (g.screen !== 'end' && guard++ < 20) {
    g = g.screen === 'case' ? solveCase(g) : advance(g);
  }
  return g;
}

console.log('=== A. 잠금 모드 3종 완주 (즉시 잠금이 소프트락을 만드는가) ===');
for (const mode of ['immediate', 'commit', 'submit'] as LockMode[]) {
  const g = playRun(mode);
  const ok = g.ending?.kind === 'GOOD' && g.history.length === CONTENT.cases.length;
  console.log(
    `[${mode}] ${ok ? 'PASS' : 'FAIL'} — 해결 ${g.history.length}/${CONTENT.cases.length}`,
    `| 제출 ${g.history.reduce((n, h) => n + h.submits, 0)}회 | 주목 ${g.heat} 신뢰 ${g.trust}`,
    `| 아는 얼굴 ${g.knownFacets.length} | 노트 ${g.notebook.length}줄`,
    `| 엔딩 ${g.ending?.kind ?? '-'} ${g.ending?.title ?? ''}`,
  );
}

console.log('\n=== B. 콘텐츠 검증기 — 기계가 case를 판정할 수 있는가 (12 §8 파이프라인의 전제) ===');

/**
 * ① 풀 수 있음 — 슬롯 순서대로, **그 시점에 아는/빌린 얼굴만으로** 정답을 놓을 수 있는가.
 * 배치가 트랙을 밀어 뒤 슬롯의 게이트·조건부 정답을 바꾸므로, 실제로 두어보며 확인해야 한다.
 */
function checkSolvable(def: CaseDef, start: GameState): { ok: boolean; problems: string[] } {
  let g: GameState = { ...start, caseIndex: CONTENT.cases.indexOf(def) };
  g = step(g, { type: 'START' });
  const problems: string[] = [];
  for (let i = 0; i < def.slots.length; i++) {
    const sl = def.slots[i];
    const mv = answerMove(sl, g);
    if (!mv) { problems.push(`${sl.label}: 정답 카드에 [${sl.role?.frame}] 얼굴이 없다`); continue; }
    const ctx = facetCtxFor(g, CONTENT, i);
    const f = CONTENT.clues[mv.cardId].facets.find((x) => x.key === mv.facetKey)!;
    const v = facetStatus(f, sl.role?.frame ?? null, ctx);
    if (!v.usable) problems.push(`${sl.label}: [${f.meaning}]을 못 쓴다 — ${v.block}: ${v.why}`);
    g = step(g, { type: 'PLACE', slotId: sl.id, cardId: mv.cardId, facetKey: mv.facetKey });
  }
  // 배치 도중 트랙이 밀려 조건부 정답이 바뀌었는가 — v10 신규 위험(잠금이 상태를 즉시 바꾼다).
  for (const sl of def.slots) {
    const p = g.placed[sl.id];
    if (p && p.cardId !== resolveAnswer(sl, g)) {
      problems.push(`${sl.label}: 배치 도중 문맥이 뒤집혀 정답이 ${resolveAnswer(sl, g)}로 바뀌었다`);
    }
  }
  return { ok: problems.length === 0, problems };
}

/** ② 이야기로 성립함 — 정답 배열의 서사 응집이 full인가(정답 = 응집 full, 티켓 03 재개정). */
function checkCoherent(def: CaseDef, start: GameState): { ok: boolean; cohesion: string } {
  let g: GameState = { ...start, caseIndex: CONTENT.cases.indexOf(def) };
  g = step(g, { type: 'START' });
  for (const sl of def.slots) {
    const mv = answerMove(sl, g);
    if (mv) g = step(g, { type: 'PLACE', slotId: sl.id, cardId: mv.cardId, facetKey: mv.facetKey });
  }
  let coherent = 0, total = 0;
  for (let i = 1; i < def.slots.length; i++) {
    const a = g.placed[def.slots[i - 1].id], b = g.placed[def.slots[i].id];
    if (!a || !b) continue;
    total++;
    if (cardFitsSlot(CONTENT.clues[a.cardId], def.slots[i - 1]) &&
        cardFitsSlot(CONTENT.clues[b.cardId], def.slots[i])) coherent++;
  }
  return { ok: total > 0 && coherent === total, cohesion: `${coherent}/${total}` };
}

// 검증은 "진행 상태"에 의존한다(뒤 case는 앞 case의 보상으로 얼굴이 늘어난 상태로 풀린다).
// 실제 run을 돌려 각 case 진입 시점의 상태를 뜬 뒤 검증한다.
const snapshots: Record<string, GameState> = {};
{
  let g = initGame(CONTENT);
  g = step(g, { type: 'START' });
  let guard = 0;
  while (g.screen !== 'end' && guard++ < 20) {
    if (g.screen === 'case') { snapshots[CONTENT.cases[g.caseIndex].id] = g; g = solveCase(g); }
    else g = advance(g);
  }
}

let allOk = true;
for (const def of CONTENT.cases) {
  const snap = snapshots[def.id];
  if (!snap) { console.log(`[${def.id}] SKIP — run이 여기까지 오지 못했다`); allOk = false; continue; }
  const s = checkSolvable(def, snap);
  const c = checkCoherent(def, snap);
  const ok = s.ok && c.ok;
  allOk &&= ok;
  console.log(`[${def.id}] ${ok ? 'PASS' : 'FAIL'} — ①풀 수 있음 ${s.ok ? '○' : '✕'} / ②이야기로 성립 ${c.ok ? '○' : '✕'} (응집 ${c.cohesion})`);
  for (const p of s.problems) console.log(`        ⚠ ${p}`);
}
console.log(`\n[검증기] 이중 제약 기계 판정: ${allOk ? 'PASS — 엔진이 콘텐츠 검증기로 성립' : 'FAIL — 위 문제부터'}`);

console.log('\n=== C. 실패 방향 둘 (12 §7 등급형) ===');
{
  // 공개 과다 → 언론 재판
  let c = initGame(CONTENT);
  c.heat = 10;
  c = step(c, { type: 'START' });
  c = solveCase(c);
  if (c.screen === 'reward') c = step(c, { type: 'PICK_REWARD', cardId: c.packOffer[0] });
  console.log(`[언론 재판] ${c.ending?.kind === 'BAD' ? 'PASS' : 'FAIL'} — 주목 ${c.heat} | ${c.ending?.title ?? c.screen}`);

  // 강압 과다 → 수사반 붕괴. 정직한 프로브: 신뢰를 낮게 시작한 뒤 **강압 얼굴을 골라** 놓는다
  // (12 §6 "오답조차 세계를 미는 수"가 실제로 죽는 방향이 되는지).
  let d = initGame(CONTENT);
  d.lockMode = 'immediate';
  d.trust = 2;
  d = step(d, { type: 'START' });
  const def0 = CONTENT.cases[0];
  for (const sl of def0.slots) {
    // 이 슬롯에 놓을 수 있는 것 중 강압 태그가 붙은 얼굴을 우선한다.
    const harsh = d.ownedClues
      .flatMap((id) => CONTENT.clues[id].facets.map((f) => ({ id, f })))
      .find((x) => x.f.tags.includes('강압') && d.knownFacets.includes(x.f.key));
    const mv = harsh ? { cardId: harsh.id, facetKey: harsh.f.key } : answerMove(sl, d)!;
    d = step(d, { type: 'PLACE', slotId: sl.id, cardId: mv.cardId, facetKey: mv.facetKey });
  }
  const reachable = d.trust === 0;
  console.log(
    `[수사반 붕괴] ${reachable ? 'PASS — 강압 얼굴만으로 신뢰 0 도달' : 'FAIL — 강압 경로로 신뢰가 0까지 안 내려간다'}`,
    `| 신뢰 2 → ${d.trust}`,
  );
  if (!reachable) {
    const harshAll = Object.values(CONTENT.clues).flatMap((cd) => cd.facets.filter((f) => f.tags.includes('강압')));
    const harshKnown = harshAll.filter((f) => d.knownFacets.includes(f.key));
    console.log(`        ⚠ 원인: 강압 얼굴 ${harshAll.length}개 중 지금 아는 것 ${harshKnown.length}개.`);
    console.log('          강압 얼굴이 전부 facets[1+]에 있어 학습기에는 **고를 수조차 없다** →');
    console.log('          12 §7의 "죽는 방향 둘"이 초반에는 사실상 하나다(어휘 게이트와 실패 설계의 충돌).');
  }
}

console.log('\n=== E. 이웃이 의미를 만든다 (12 §2) — 앞을 잠그면 뒤의 해석이 열리는가 ===');
{
  // 설계된 시연: c3 "신분 위장"(rehearsed_story:identity)은 앞 슬롯이 [연출된 현장]으로
  // 잠겨야 열린다. 잠그기 전엔 prev로 막히고, 잠근 뒤엔 쓸 수 있어야 한다.
  const snap = snapshots['c3'];
  if (!snap) {
    console.log('[전파] SKIP — c3 스냅샷 없음');
  } else {
    let g: GameState = { ...snap, caseIndex: 2 };
    g = step(g, { type: 'START' });
    const def = CONTENT.cases[2];
    const target = CONTENT.clues['rehearsed_story'].facets.find((f) => f.frame === 'identity')!;
    const before = facetStatus(target, 'identity', facetCtxFor(g, CONTENT, 1));
    const mv = answerMove(def.slots[0], g)!; // c3s1 = 연출된 현장(scene)
    g = step(g, { type: 'PLACE', slotId: def.slots[0].id, cardId: mv.cardId, facetKey: mv.facetKey });
    const after = facetStatus(target, 'identity', facetCtxFor(g, CONTENT, 1));
    const ok = !before.usable && before.block === 'prev' && after.usable;
    console.log(`[전파] ${ok ? 'PASS' : 'FAIL'} — 잠그기 전: ${before.usable ? '열림' : `막힘(${before.block})`} → 잠근 뒤: ${after.usable ? '열림' : `막힘(${after.block})`}`);
    if (!ok) console.log(`        ⚠ 기대: 앞이 [현장]으로 잠기기 전엔 prev로 막히고, 잠근 뒤 열려야 한다`);
  }
}

console.log('\n=== D. 되돌리기 연쇄 해제 (12 §3) ===');
{
  let g = initGame(CONTENT);
  g.lockMode = 'immediate';
  g = step(g, { type: 'START' });
  const def = CONTENT.cases[0];
  for (const sl of def.slots.slice(0, 3)) {
    const mv = answerMove(sl, g)!;
    g = step(g, { type: 'PLACE', slotId: sl.id, cardId: mv.cardId, facetKey: mv.facetKey });
  }
  const lockedBefore = Object.values(g.placed).filter((p) => p?.locked).length;
  const heatBefore = g.heat;
  g = step(g, { type: 'CLEAR_SLOT', slotId: def.slots[0].id }); // 맨 앞을 되돌린다
  const lockedAfter = Object.values(g.placed).filter((p) => p?.locked).length;
  console.log(`[연쇄] 잠긴 수 ${lockedBefore} → ${lockedAfter} | 주목 ${heatBefore} → ${g.heat} (되돌리기 대가)`);
  console.log(`[연쇄] ${lockedAfter === 0 && g.heat > heatBefore ? 'PASS — 뒤가 전부 풀리고 대가를 치렀다' : 'FAIL'}`);
}
