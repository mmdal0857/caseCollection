import { CONTENT } from './src/lib/content';
import { initGame, type GameState } from './src/lib/engine';
import {
  COLLECTION_KEY,
  cardFacetSlots,
  collectionProgress,
  createCollectionState,
  loadCollectionState,
  mergeGameProgress,
  recordRejected,
  saveCollectionState,
  type CollectionStorage,
  type RejectedInterpretation,
} from './src/lib/collection';

function expect(ok: boolean, label: string): void {
  if (!ok) throw new Error(`[collection] FAIL — ${label}`);
  console.log(`[collection] PASS — ${label}`);
}

function memoryStorage(): CollectionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const initialGame = initGame(CONTENT);
const initial = createCollectionState(initialGame);
const collectionStore = memoryStorage();
saveCollectionState(collectionStore, initial);
expect(
  loadCollectionState(collectionStore).state?.ownedCardIds.length ===
    initial.ownedCardIds.length,
  '영구 컬렉션이 v1 envelope로 왕복한다',
);
collectionStore.setItem(COLLECTION_KEY, '{broken');
const brokenCollection = loadCollectionState(collectionStore);
expect(
  brokenCollection.state === null &&
    brokenCollection.issue === 'CORRUPT_JSON' &&
    brokenCollection.raw === '{broken',
  '손상 컬렉션 원문을 보존하고 자동 덮어쓰지 않는다',
);
const progress = collectionProgress(initial, CONTENT);
expect(
  progress.ownedCards.value === CONTENT.starterClues.length &&
    progress.ownedCards.total === Object.keys(CONTENT.clues).length &&
    initial.ownedPatternIds.join(',') === CONTENT.starterPatterns.join(','),
  '보유 카드 진행도는 현재 팩에서 동적으로 계산된다',
);
expect(
  progress.knownOwnedFacets.value === initial.knownFacetKeys.length &&
    progress.knownOwnedFacets.total === CONTENT.starterClues
      .flatMap((id) => CONTENT.clues[id].facets).length &&
    progress.knownAllFacets.total === Object.values(CONTENT.clues)
      .flatMap((card) => card.facets).length,
  '아는/보유 측면과 아는/전체 측면의 분모가 분리된다',
);

const ownedCard = CONTENT.clues[CONTENT.starterClues[0]];
const slots = cardFacetSlots(initial, ownedCard.id, CONTENT);
const unknown = slots.find((slot) => !slot.known);
expect(
  unknown !== undefined &&
    !('meaning' in unknown) &&
    slots.length === ownedCard.facets.length,
  '미해금 측면은 자리 수만 보이고 의미는 누출하지 않는다',
);

const rejected: RejectedInterpretation = {
  caseId: 'c1',
  slotId: 'entry',
  cardId: ownedCard.id,
  facetKey: ownedCard.facets[0].key,
  reaction: '그 해석은 문 앞에서 무너졌다.',
  firstSeenAt: '2026-07-28T00:00:00.000Z',
};
const once = recordRejected(initial, rejected);
const twice = recordRejected(once, {
  ...rejected,
  reaction: '반복 제출은 새 수집물이 아니다.',
  firstSeenAt: '2026-07-29T00:00:00.000Z',
});
expect(
  twice.rejectedInterpretations.length === 1 &&
    twice.rejectedInterpretations[0].reaction === rejected.reaction,
  '같은 case·slot·card·facet 오답은 최초 반응 하나만 보존한다',
);

const withGuest: GameState = structuredClone(initialGame);
withGuest.ownedClues.push(CONTENT.cases[0].guestClues[0]);
if (CONTENT.cases[0].guestPattern !== undefined) {
  withGuest.ownedPatterns.push(CONTENT.cases[0].guestPattern);
}
withGuest.knownFacets.push(
  CONTENT.clues[CONTENT.cases[0].guestClues[0]].facets[0].key,
);
withGuest.borrowedFacetKeys = [
  CONTENT.cases[1].guestFacets?.[0] ??
    CONTENT.clues[CONTENT.cases[1].guestClues[0]].facets[0].key,
];
const merged = mergeGameProgress(
  initial,
  initialGame,
  withGuest,
  CONTENT,
  () => '2026-07-28T00:00:00.000Z',
);
expect(
  merged.ownedCardIds.includes(CONTENT.cases[0].guestClues[0]) &&
    (CONTENT.cases[0].guestPattern === undefined ||
      merged.ownedPatternIds.includes(CONTENT.cases[0].guestPattern)) &&
    !merged.knownFacetKeys.includes(withGuest.borrowedFacetKeys[0]),
  '게스트 보유는 영구화되고 run 한정 대여 측면은 섞이지 않는다',
);

const withWrongNote: GameState = structuredClone(withGuest);
withWrongNote.notebook.push({
  caseId: 'c1',
  slotId: 'entry',
  cardId: ownedCard.id,
  facetKey: ownedCard.facets[0].key,
  meaning: ownedCard.facets[0].meaning,
  line: '틀린 해석에 대한 레이든의 반응',
  correct: false,
});
const withRecordedNote = mergeGameProgress(
  merged,
  withGuest,
  withWrongNote,
  CONTENT,
  () => '2026-07-28T00:00:00.000Z',
);
expect(
  withRecordedNote.rejectedInterpretations.some(
    (item) =>
      item.caseId === 'c1' &&
      item.slotId === 'entry' &&
      item.reaction === '틀린 해석에 대한 레이든의 반응',
  ),
  '판정된 오답 노트가 영구 rejected interpretation으로 승격된다',
);

const badEndingState: GameState = structuredClone(withGuest);
badEndingState.ownedClues = [];
badEndingState.knownFacets = [];
badEndingState.ending = {
  kind: 'BAD',
  title: 'BAD',
  desc: '실패해도 이미 얻은 수집물은 남는다.',
};
const afterBad = mergeGameProgress(
  withRecordedNote,
  withGuest,
  badEndingState,
  CONTENT,
  () => '2026-07-28T00:00:01.000Z',
);
expect(
  afterBad.ownedCardIds.includes(CONTENT.cases[0].guestClues[0]) &&
    afterBad.knownFacetKeys.length >= withRecordedNote.knownFacetKeys.length,
  'BAD ending merge는 기존 영구 컬렉션을 삭제하지 않는다',
);

console.log('[collection] ALL PASS');
