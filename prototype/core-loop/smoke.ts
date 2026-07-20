// PROTOTYPE smoke — 엔진이 완주 가능한 run을 만드는지 + BAD 도달 가능한지 스크립트로 검증.
// 실행: npx esbuild smoke.ts --bundle --format=esm --platform=node --outfile=smoke.mjs && node smoke.mjs
import { CONTENT } from './src/lib/content';
import { initGame, reduce, resolveAnswer, type Action, type GameState } from './src/lib/engine';

function step(g: GameState, a: Action): GameState { return reduce(g, a, CONTENT); }

// 현재 상태에서 정답대로 슬롯을 채우고, 필요한 패턴을 선언한 뒤, 클리어까지 반복 제출.
function solveCase(g: GameState): GameState {
  const def = CONTENT.cases[g.caseIndex];
  // 가설 선언(정답 패턴 전부)
  for (const p of def.patterns) g = step(g, { type: 'DECLARE', pattern: p });
  let guard = 0;
  while (g.screen === 'case' && guard++ < 30) {
    const open = def.slots.filter((sl) => !g.confirmed[sl.id]);
    for (const sl of open) {
      const ans = resolveAnswer(sl, g); // 현재 heat/trust 기준 정답
      g = step(g, { type: 'PLACE', slotId: sl.id, cardId: ans });
    }
    g = step(g, { type: 'SUBMIT' });
    // 클리어 시 화면이 유지되고 awaitingAdvance가 선다 — 피드백 확인 후 진행.
    if (g.awaitingAdvance) { g = step(g, { type: 'ADVANCE' }); break; }
  }
  return g;
}

function advance(g: GameState): GameState {
  if (g.screen === 'reward') g = step(g, { type: 'PICK_REWARD', cardId: g.packOffer[0] });
  if (g.screen === 'interlude') {
    const ev = CONTENT.interludeEvents.find((e) => e.id === g.interlude!.eventId)!;
    // 가능한 첫 선택지(요구 태그 충족되는 것)
    const ch = (ev.choices ?? []).find((c) =>
      !c.requires || g.verified.filter((id) => CONTENT.clues[id]?.tags.includes(c.requires!.tag)).length >= c.requires!.count,
    )!;
    g = step(g, { type: 'INTERLUDE_CHOICE', choiceId: ch.id });
    g = step(g, { type: 'CONTINUE' });
  }
  return g;
}

// ---- 시나리오 1: 정석 플레이 — 완주 가능한가 ----
let g = initGame(CONTENT);
g = step(g, { type: 'START' });
let guard = 0;
while (g.screen !== 'end' && guard++ < 20) {
  if (g.screen === 'case') g = solveCase(g);
  else g = advance(g);
}
console.log('[정석] 종료 화면:', g.screen, '| 엔딩:', g.ending?.kind, g.ending?.title);
console.log('[정석] 해결:', g.history.length, '/', CONTENT.cases.length, '| 총 제출:', g.history.reduce((n, h) => n + h.submits, 0));
console.log('[정석] 보유 단서:', g.ownedClues.length, '| 검증:', g.verified.filter((id) => CONTENT.clues[id]).length, '| 주목:', g.heat, '신뢰:', g.trust);
const good = g.ending?.kind === 'GOOD' && g.history.length === CONTENT.cases.length;
console.log('[정석] GOOD 완주:', good ? 'PASS' : 'FAIL');

// ---- 시나리오 2: 난동 플레이 — 오답 남발로 BAD 도달하는가 ----
let b = initGame(CONTENT);
b = step(b, { type: 'START' });
// case1에서 오답을 계속 던져 주목을 올린다 (매 오답 +1).
let wrongs = 0;
while (b.heat < CONTENT.badHeat && wrongs++ < 40) {
  const def = CONTENT.cases[b.caseIndex];
  const open = def.slots.filter((sl) => !b.confirmed[sl.id]);
  // 일부러 틀린 배치: 각 슬롯에 '틀린' 카드(정답 아닌 손패)를 넣는다.
  for (const sl of open) {
    const ans = resolveAnswer(sl, b);
    const wrong = b.ownedClues.find((id) => id !== ans && !Object.values(b.placed).includes(id) && !Object.values(b.confirmed).includes(id));
    if (wrong) b = step(b, { type: 'PLACE', slotId: sl.id, cardId: wrong });
    else b = step(b, { type: 'PLACE', slotId: sl.id, cardId: ans });
  }
  b = step(b, { type: 'SUBMIT' });
  if (b.screen !== 'case' || b.awaitingAdvance) break; // 실수로 클리어되면 중단
}
console.log('\n[난동] 주목:', b.heat, '| 화면:', b.screen);
// 주목 최대(10)로 case 클리어 후 인터루드 진입 시 BAD가 뜨는지 별도 확인.
// (case1 정답 은밀 2장이 -2 → 10-2=8, 임계 도달. 9였다면 7로 회피됨 — 깔끔한 해결의 주목 냉각 효과.)
let c = initGame(CONTENT);
c.heat = 10; // 강제로 최대 위험 상태
c = step(c, { type: 'START' });
c = solveCase(c); // case1 클리어 → reward/interlude
if (c.screen === 'reward') c = step(c, { type: 'PICK_REWARD', cardId: c.packOffer[0] });
console.log('[난동] 주목 10에서 case 클리어 후 화면:', c.screen, '| 주목:', c.heat, '| 엔딩:', c.ending?.kind, c.ending?.title);
console.log('[난동] BAD 도달:', c.ending?.kind === 'BAD' ? 'PASS' : 'FAIL');

// ---- 시나리오 3: 문맥 분기 — 주목에 따라 정답이 달라지는가 ----
const c2 = CONTENT.cases[1];
const climax = c2.slots.find((s) => s.id === 'c2s5')!;
const lowHeat = resolveAnswer(climax, { heat: 2, trust: 3 });
const highHeat = resolveAnswer(climax, { heat: 6, trust: 3 });
console.log('\n[문맥] case2 결정적 증거 — 주목 낮음:', lowHeat, '| 주목 높음:', highHeat);
console.log('[문맥] 조건부 정답 분기:', lowHeat !== highHeat ? 'PASS' : 'FAIL');
