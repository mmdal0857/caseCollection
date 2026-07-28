import type { ClueCard, GameState, RunContent } from './engine';

export const COLLECTION_FORMAT = 'case-collection';
export const COLLECTION_VERSION = 1;
export const COLLECTION_KEY = 'case-collection.collection.v1';

export interface RejectedInterpretation {
  caseId: string;
  slotId: string;
  cardId: string;
  facetKey: string;
  reaction: string;
  firstSeenAt: string;
}

export interface CollectionStateV1 {
  format: typeof COLLECTION_FORMAT;
  version: typeof COLLECTION_VERSION;
  ownedCardIds: string[];
  ownedPatternIds: string[];
  knownFacetKeys: string[];
  rejectedInterpretations: RejectedInterpretation[];
}

export interface CollectionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CollectionLoadResult {
  state: CollectionStateV1 | null;
  issue:
    | 'CORRUPT_JSON'
    | 'FUTURE_VERSION'
    | 'INCOMPATIBLE_FORMAT'
    | 'STATE_INVALID'
    | null;
  raw: string | null;
}

export interface ProgressAxis {
  value: number;
  total: number;
}

export interface CollectionProgress {
  ownedCards: ProgressAxis;
  knownOwnedFacets: ProgressAxis;
  knownAllFacets: ProgressAxis;
}

export type FacetSlot =
  | { index: number; known: false }
  | { index: number; known: true; key: string; meaning: string };

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validRejected(value: unknown): value is RejectedInterpretation {
  return (
    isRecord(value) &&
    typeof value.caseId === 'string' &&
    typeof value.slotId === 'string' &&
    typeof value.cardId === 'string' &&
    typeof value.facetKey === 'string' &&
    typeof value.reaction === 'string' &&
    typeof value.firstSeenAt === 'string'
  );
}

export function loadCollectionState(
  storage: CollectionStorage,
): CollectionLoadResult {
  const raw = storage.getItem(COLLECTION_KEY);
  if (raw === null) return { state: null, issue: null, raw: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: null, issue: 'CORRUPT_JSON', raw };
  }
  if (!isRecord(parsed)) return { state: null, issue: 'STATE_INVALID', raw };
  if (
    typeof parsed.version === 'number' &&
    parsed.version > COLLECTION_VERSION
  ) {
    return { state: null, issue: 'FUTURE_VERSION', raw };
  }
  if (
    parsed.format !== COLLECTION_FORMAT ||
    parsed.version !== COLLECTION_VERSION
  ) {
    return { state: null, issue: 'INCOMPATIBLE_FORMAT', raw };
  }
  if (
    !isStringArray(parsed.ownedCardIds) ||
    !isStringArray(parsed.ownedPatternIds) ||
    !isStringArray(parsed.knownFacetKeys) ||
    !Array.isArray(parsed.rejectedInterpretations) ||
    !parsed.rejectedInterpretations.every(validRejected)
  ) {
    return { state: null, issue: 'STATE_INVALID', raw };
  }
  return {
    state: {
      format: COLLECTION_FORMAT,
      version: COLLECTION_VERSION,
      ownedCardIds: uniqueSorted(parsed.ownedCardIds),
      ownedPatternIds: uniqueSorted(parsed.ownedPatternIds),
      knownFacetKeys: uniqueSorted(parsed.knownFacetKeys),
      rejectedInterpretations: parsed.rejectedInterpretations,
    },
    issue: null,
    raw,
  };
}

export function saveCollectionState(
  storage: CollectionStorage,
  state: CollectionStateV1,
): void {
  storage.setItem(COLLECTION_KEY, JSON.stringify(state));
}

function rejectionKey(item: RejectedInterpretation): string {
  return `${item.caseId}\u0000${item.slotId}\u0000${item.cardId}\u0000${item.facetKey}`;
}

export function createCollectionState(game: GameState): CollectionStateV1 {
  return {
    format: COLLECTION_FORMAT,
    version: COLLECTION_VERSION,
    ownedCardIds: uniqueSorted(game.ownedClues),
    ownedPatternIds: uniqueSorted(game.ownedPatterns),
    knownFacetKeys: uniqueSorted(
      game.knownFacets.filter((key) => !game.borrowedFacetKeys.includes(key)),
    ),
    rejectedInterpretations: [],
  };
}

export function recordRejected(
  state: CollectionStateV1,
  item: RejectedInterpretation,
): CollectionStateV1 {
  const key = rejectionKey(item);
  if (
    state.rejectedInterpretations.some(
      (existing) => rejectionKey(existing) === key,
    )
  ) {
    return state;
  }
  return {
    ...state,
    rejectedInterpretations: [...state.rejectedInterpretations, item],
  };
}

export function mergeGameProgress(
  state: CollectionStateV1,
  before: GameState,
  after: GameState,
  _content: RunContent,
  now: () => string = () => new Date().toISOString(),
): CollectionStateV1 {
  let next: CollectionStateV1 = {
    ...state,
    ownedCardIds: uniqueSorted([
      ...state.ownedCardIds,
      ...after.ownedClues,
    ]),
    ownedPatternIds: uniqueSorted([
      ...state.ownedPatternIds,
      ...after.ownedPatterns,
    ]),
    knownFacetKeys: uniqueSorted([
      ...state.knownFacetKeys,
      ...after.knownFacets.filter(
        (key) => !after.borrowedFacetKeys.includes(key),
      ),
    ]),
  };
  const previousNotes = new Set(
    before.notebook
      .filter((note) => note.correct === false)
      .map(
        (note) =>
          `${note.caseId}\u0000${note.slotId}\u0000${note.cardId}\u0000${note.facetKey}`,
      ),
  );
  for (const note of after.notebook) {
    if (note.correct !== false) continue;
    const key = `${note.caseId}\u0000${note.slotId}\u0000${note.cardId}\u0000${note.facetKey}`;
    if (previousNotes.has(key)) continue;
    next = recordRejected(next, {
      caseId: note.caseId,
      slotId: note.slotId,
      cardId: note.cardId,
      facetKey: note.facetKey,
      reaction: note.line,
      firstSeenAt: now(),
    });
  }
  return next;
}

export function collectionProgress(
  state: CollectionStateV1,
  content: RunContent,
): CollectionProgress {
  const cards = Object.values(content.clues);
  const owned = new Set(
    state.ownedCardIds.filter((id) => content.clues[id] !== undefined),
  );
  const known = new Set(state.knownFacetKeys);
  const ownedFacets = cards
    .filter((card) => owned.has(card.id))
    .flatMap((card) => card.facets);
  const allFacets = cards.flatMap((card) => card.facets);
  return {
    ownedCards: { value: owned.size, total: cards.length },
    knownOwnedFacets: {
      value: ownedFacets.filter((facet) => known.has(facet.key)).length,
      total: ownedFacets.length,
    },
    knownAllFacets: {
      value: allFacets.filter((facet) => known.has(facet.key)).length,
      total: allFacets.length,
    },
  };
}

export function cardFacetSlots(
  state: CollectionStateV1,
  cardId: string,
  content: RunContent,
): FacetSlot[] {
  const card: ClueCard | undefined = content.clues[cardId];
  if (card === undefined || !state.ownedCardIds.includes(cardId)) return [];
  const known = new Set(state.knownFacetKeys);
  return card.facets.map((facet, index) =>
    known.has(facet.key)
      ? { index, known: true, key: facet.key, meaning: facet.meaning }
      : { index, known: false },
  );
}
