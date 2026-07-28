import fixture from './fixtures/narrative/c1-c2.public-input.json';
import expectedInterlude from './fixtures/narrative/c1-c2.expected-interlude.json';
import { CONTENT } from './src/lib/content';
import {
  BASE_ENDINGS,
  BASE_INTERLUDES,
  buildInterludeDefinition,
  canonicalNarrativeJson,
  validateNarrativeInput,
} from './src/lib/narrative-content';
import {
  initGame,
  reduce,
  type Action,
  type GameState,
  type Slot,
  resolveAnswer,
} from './src/lib/engine';
import {
  checkIntegrity,
  mergePacks,
  packFromContent,
  preflightPacks,
  validatePack,
  type GameDataPack,
} from './src/lib/datapack';

function expect(ok: boolean, label: string): void {
  if (!ok) throw new Error(`[narrative] FAIL — ${label}`);
  console.log(`[narrative] PASS — ${label}`);
}

const inputCheck = validateNarrativeInput(fixture);
expect(inputCheck.ok, '공개 입력 fixture가 NarrativeGenerationInput@1 계약을 통과한다');

const withTruth = {
  ...fixture,
  next: { ...fixture.next, truth: { answer: 'forged_ledger' } },
};
const rejectedInput = validateNarrativeInput(withTruth);
expect(
  !rejectedInput.ok &&
    rejectedInput.issues.some((issue) => issue.path === 'next.truth'),
  '미공개 truth가 입력 경계에서 기계적으로 거부된다',
);

const first = buildInterludeDefinition(fixture);
const second = buildInterludeDefinition(structuredClone(fixture));
expect(
  canonicalNarrativeJson(first) === canonicalNarrativeJson(second),
  '같은 공개 입력과 버전은 byte-identical 인터루드를 만든다',
);
expect(
  canonicalNarrativeJson(first) === canonicalNarrativeJson(expectedInterlude),
  '결정론적 emit이 승인된 expected fixture와 byte-identical이다',
);
expect(
  first.actions.map((action) => action.kind).join(',') ===
    'recon,interview,stabilize' &&
    first.apBudget === 2,
  '인터루드는 AP 2와 정확히 세 행동을 고정한다',
);
expect(
  first.actions.find((action) => action.kind === 'recon')?.resultText ===
    fixture.next.foreshadowAllowlist[0],
  '정찰 결과는 다음 사건 foreshadow allowlist에서만 온다',
);

expect(
  BASE_INTERLUDES.length === CONTENT.cases.length - 1 &&
    BASE_ENDINGS.map((ending) => ending.triggerRuleId).join(',') ===
      'bad-press,bad-collapse',
  '모든 사건 사이 인터루드와 두 도달 가능한 BAD 엔딩이 정의된다',
);

const base = packFromContent('base', CONTENT);
const valid = validatePack(base);
expect(valid.ok, '인터루드·엔딩을 포함한 base pack이 v2 schema를 통과한다');
expect(
  checkIntegrity(CONTENT).length === 0,
  'case·게스트 측면·복선·경고/트리거 참조가 모두 유효하다',
);

const alongside: GameDataPack = {
  ...base,
  id: 'night',
  mergeMode: 'alongside',
  clues: undefined,
  patterns: undefined,
  hintDefs: undefined,
  cases: undefined,
  run: undefined,
  interludes: [{
    ...first,
    id: 'night.interlude.c1-c2',
  }],
  endings: [],
};
expect(
  preflightPacks([base, alongside]).ok,
  'namespaced 인터루드는 base와 alongside 병합된다',
);
const alongsideMerged = mergePacks([base, alongside]);
expect(
  alongsideMerged.content.interludes.some(
    (definition) => definition.id === 'night.interlude.c1-c2',
  ),
  'alongside 인터루드가 런 콘텐츠에 보존된다',
);

const promoted: GameDataPack = {
  ...alongside,
  id: 'reviewed',
  mergeMode: 'promotion',
  promotionTargets: [{
    kind: 'interlude',
    id: 'base.interlude.c1-c2',
    expectedSourcePack: 'base',
  }],
  interludes: [{
    ...first,
    presentation: '검토된 부두 전환',
  }],
};
expect(
  preflightPacks([base, promoted]).ok,
  '명시적 promotion만 기존 인터루드를 상쇄한다',
);
const promotedMerged = mergePacks([base, promoted]);
expect(
  promotedMerged.report.overrides.some(
    (item) =>
      item.kind === 'interlude' &&
      item.id === 'base.interlude.c1-c2' &&
      item.by === 'reviewed',
  ),
  '인터루드 상쇄 provenance가 merge report에 남는다',
);

function step(game: GameState, action: Action): GameState {
  return reduce(game, action, CONTENT);
}

function fillCorrect(game: GameState): GameState {
  const definition = CONTENT.cases[game.caseIndex];
  let next = game;
  for (const pattern of definition.patterns) {
    next = step(next, { type: 'DECLARE', pattern });
  }
  for (const slot of definition.slots) {
    const cardId = resolveAnswer(slot as Slot, next);
    const facet = CONTENT.clues[cardId].facets.find(
      (item) => slot.role === undefined || item.frame === slot.role.frame,
    );
    if (facet === undefined) throw new Error(`정답 측면 없음: ${slot.id}`);
    next = step(next, {
      type: 'PLACE',
      slotId: slot.id,
      cardId,
      facetKey: facet.key,
    });
  }
  return next;
}

let game = step(initGame(CONTENT), { type: 'START' });
game = step(fillCorrect(game), { type: 'REQUEST_REVIEW' });
game = step(game, { type: 'FINAL_SUBMIT' });
game = step(game, { type: 'ADVANCE' });
expect(
  game.screen === 'interlude' &&
    game.interlude?.definitionId === 'base.interlude.c1-c2',
  'Clear 다음에 해당 pack 인터루드가 선택된다',
);
game = step(game, { type: 'INTERLUDE_ACTION', kind: 'recon' });
game = step(game, { type: 'INTERLUDE_ACTION', kind: 'interview' });
expect(
  game.interlude?.usedActions.length === 2 &&
    game.interlude.ap === 0 &&
    game.interlude.results[0] === fixture.next.foreshadowAllowlist[0] &&
    game.interlude.borrowedFacetKeys.join(',') === 'forged_ledger:motive',
  '런 화면 계약에서 세 행동 중 둘만 실행하고 공개 복선·allowlist 측면만 얻는다',
);
game = step(game, { type: 'CONTINUE' });
expect(
  game.screen === 'briefing' && game.caseIndex === 1,
  '티켓 22 화면 그래프대로 인터루드 뒤 다음 Briefing으로 간다',
);

const pressProbe = initGame(CONTENT);
pressProbe.heat = CONTENT.badHeat;
pressProbe.awaitingAdvance = true;
const noWarningEnd = step(pressProbe, { type: 'ADVANCE' });
expect(
  noWarningEnd.ending === null,
  '실제 경고 이력 없이 BAD 엔딩을 임의 발명하지 않는다',
);
pressProbe.riskWarnings.push('press');
const warnedEnd = step(pressProbe, { type: 'ADVANCE' });
expect(
  warnedEnd.ending?.kind === 'BAD' &&
    warnedEnd.ending.desc ===
      BASE_ENDINGS.find((ending) => ending.triggerRuleId === 'bad-press')
        ?.presentation,
  '도달한 실패 상태와 선행 경고가 함께 있을 때 pack BAD 엔딩을 재생한다',
);

console.log('[narrative] ALL PASS');
