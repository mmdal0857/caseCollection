import { CONTENT } from './src/lib/content';
import {
  humanizeInterludeResult,
  initGame,
  reduce,
  resolveAnswer,
  type Action,
  type GameState,
  type Slot,
} from './src/lib/engine';

function expect(ok: boolean, label: string): void {
  if (!ok) throw new Error(`[run-flow] FAIL — ${label}`);
  console.log(`[run-flow] PASS — ${label}`);
}

function step(game: GameState, action: Action): GameState {
  return reduce(game, action, CONTENT);
}

expect(
  humanizeInterludeResult(
    '다음 사건에서 [forged_ledger:motive] 측면을 빌린다.',
    CONTENT,
  ) === '다음 사건에서 위조 장부의 ‘금전 동기’ 측면을 빌린다.',
  '이전 snapshot의 내부 측면 키도 표시 직전에 사람이 읽는 이름으로 바뀐다',
);

function answerMove(
  game: GameState,
  slot: Slot,
): { cardId: string; facetKey: string } {
  const cardId = resolveAnswer(slot, game);
  const facet = CONTENT.clues[cardId].facets.find(
    (item) => slot.role === undefined || item.frame === slot.role.frame,
  );
  if (facet === undefined) throw new Error(`정답 측면 없음: ${slot.id}`);
  return { cardId, facetKey: facet.key };
}

function fillCorrect(game: GameState): GameState {
  const definition = CONTENT.cases[game.caseIndex];
  let next = game;
  for (const pattern of definition.patterns) {
    next = step(next, { type: 'DECLARE', pattern });
  }
  for (const slot of definition.slots) {
    const move = answerMove(next, slot);
    next = step(next, { type: 'PLACE', slotId: slot.id, ...move });
  }
  return next;
}

let game = step(initGame(CONTENT), { type: 'START' });
expect(game.screen === 'case' && game.casePhase === 'compose', 'case는 compose로 시작한다');

game = fillCorrect(game);
const beforeReview = game;
game = step(game, { type: 'REQUEST_REVIEW' });
expect(
  game.screen === 'case' &&
    game.casePhase === 'review' &&
    game.review?.kind === 'sound' &&
    game.submits === 0,
  '검토는 제출과 분리된 sound 상태다',
);
const reviewLocked = step(game, {
  type: 'CLEAR_SLOT',
  slotId: CONTENT.cases[0].slots[0].id,
});
expect(
  reviewLocked.seq === game.seq &&
    reviewLocked.casePhase === 'review' &&
    reviewLocked.review?.kind === 'sound',
  'review 상태에서는 배치를 바꾸지 못한다',
);

game = step(game, { type: 'RETURN_TO_COMPOSE' });
expect(
  game.casePhase === 'compose' && game.review === null && game.submits === 0,
  '검토에서 수정으로 돌아가도 제출 횟수가 늘지 않는다',
);

game = step(game, { type: 'REQUEST_REVIEW' });
game = step(game, { type: 'FINAL_SUBMIT' });
expect(
  game.screen === 'clear' && game.submits === 1 && game.awaitingAdvance,
  '최종 제출만 clear feedback과 제출 횟수를 확정한다',
);
for (const guestId of CONTENT.cases[0].guestClues) {
  expect(game.ownedClues.includes(guestId), `클리어 즉시 게스트 카드 ${guestId}를 영구 보유한다`);
}

game = step(game, { type: 'ADVANCE' });
expect(
  game.screen === 'interlude' && game.interlude?.ap === 2,
  '인터루드는 이월되지 않는 AP 2로 시작한다',
);
expect(
  !('packOffer' in game) && game.screen === 'interlude',
  '사건 클리어 뒤 pack 보상·shop 화면을 거치지 않는다',
);

game = step(game, { type: 'INTERLUDE_ACTION', kind: 'recon' });
expect(
  game.interlude?.usedActions.join(',') === 'recon' && game.interlude.ap === 1,
  'recon은 공개 허용 정보만 밝히고 AP 1을 쓴다',
);

game = step(game, { type: 'INTERLUDE_ACTION', kind: 'interview' });
expect(
  game.interlude?.usedActions.join(',') === 'recon,interview' &&
    game.interlude.ap === 0 &&
    game.interlude.borrowedFacetKeys.length === 1,
  'interview는 다음 case allowlist 측면 하나만 빌린다',
);
expect(
  game.interlude?.results.some(
    (result) =>
      result.includes('위조 장부') &&
      result.includes('금전 동기') &&
      !result.includes('forged_ledger:motive'),
  ) === true,
  'interview 결과는 내부 키 대신 사람이 읽는 카드·측면 이름을 보여준다',
);

const afterTwoActions = game;
game = step(game, { type: 'INTERLUDE_ACTION', kind: 'stabilize' });
expect(
  game.interlude?.usedActions.length === 2 &&
    game.interlude.ap === 0 &&
    game.heat === afterTwoActions.heat &&
    game.trust === afterTwoActions.trust,
  '세 번째 행동은 상태를 바꾸지 않는다',
);

game = step(game, { type: 'CONTINUE' });
expect(
  game.screen === 'briefing' && game.caseIndex === 1 && game.interlude === null,
  '인터루드 다음은 다음 사건 briefing이다',
);

const wrongFinal = step(fillCorrect(step(game, { type: 'START' })), { type: 'FINAL_SUBMIT' });
expect(
  wrongFinal.submits === 0 && wrongFinal.screen === 'case',
  'review를 거치지 않은 FINAL_SUBMIT은 무시된다',
);

const warningProbe = structuredClone(beforeReview);
warningProbe.heat = CONTENT.badHeat - 1;
const warned = step(warningProbe, { type: 'SET_LOCK_MODE', mode: warningProbe.lockMode });
expect(
  warned.riskWarnings.includes('press'),
  'BAD 임계 한 단계 전 상태는 press 경고를 기록한다',
);

const ended = structuredClone(warned);
ended.screen = 'end';
ended.ending = {
  kind: 'BAD',
  title: 'BAD',
  desc: '수집물은 보존된다.',
};
const summarized = step(ended, { type: 'SHOW_SUMMARY' });
expect(
  summarized.screen === 'summary',
  'ending은 run summary를 거쳐서만 Home으로 돌아간다',
);

console.log('[run-flow] ALL PASS');
