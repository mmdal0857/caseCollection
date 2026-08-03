import { CONTENT } from './src/lib/content';
import { initGame, reduce, type GameState } from './src/lib/engine';
import {
  RUN_SNAPSHOT_KEY,
  loadRunSnapshot,
  saveRunSnapshot,
  type KeyValueStorage,
  type SnapshotIssueCode,
} from './src/lib/run-session';

function expect(ok: boolean, label: string): void {
  if (!ok) throw new Error(`[run-session] FAIL — ${label}`);
  console.log(`[run-session] PASS — ${label}`);
}

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const expectedMessage = {
  CORRUPT_JSON: '저장 데이터가 손상되었습니다.',
  FUTURE_VERSION: '현재 버전에서 읽을 수 없는 저장 데이터입니다.',
  INCOMPATIBLE_FORMAT: '호환되지 않는 저장 데이터 형식입니다.',
  STATE_INVALID: '저장된 수사 상태가 유효하지 않습니다.',
} satisfies Record<SnapshotIssueCode, string>;

const store = memoryStorage();
let game: GameState = reduce(initGame(CONTENT), { type: 'START' }, CONTENT);
const saved = saveRunSnapshot(
  store,
  game,
  () => '2026-07-28T00:00:00.000Z',
);
const loaded = loadRunSnapshot(store);
expect(
  loaded.snapshot?.actionSeq === game.seq &&
    loaded.snapshot.game.screen === 'case' &&
    saved.savedAt === '2026-07-28T00:00:00.000Z',
  'RunSnapshot@1이 화면과 actionSeq를 왕복한다',
);

store.setItem(RUN_SNAPSHOT_KEY, '{"format":"case-collection-run","version":2}');
const future = loadRunSnapshot(store);
expect(
  future.snapshot === null &&
    future.issue?.code === 'FUTURE_VERSION' &&
    future.issue.message === expectedMessage.FUTURE_VERSION &&
    future.raw?.includes('"version":2') === true,
  '미래 버전 원문을 보존하고 복구를 거부한다',
);

store.setItem(RUN_SNAPSHOT_KEY, '{broken');
const corrupt = loadRunSnapshot(store);
expect(
  corrupt.snapshot === null &&
    corrupt.issue?.code === 'CORRUPT_JSON' &&
    corrupt.issue.message === expectedMessage.CORRUPT_JSON &&
    corrupt.raw === '{broken',
  '손상 JSON 원문을 덮어쓰지 않는다',
);

store.setItem(
  RUN_SNAPSHOT_KEY,
  JSON.stringify({ format: 'other-run-format', version: 1 }),
);
const incompatible = loadRunSnapshot(store);
expect(
  incompatible.snapshot === null &&
    incompatible.issue?.code === 'INCOMPATIBLE_FORMAT' &&
    incompatible.issue.message === expectedMessage.INCOMPATIBLE_FORMAT,
  '호환되지 않는 저장 형식은 사용자용 한국어 설명을 반환한다',
);

store.setItem(
  RUN_SNAPSHOT_KEY,
  JSON.stringify({
    format: 'case-collection-run',
    version: 1,
    savedAt: '2026-07-28T00:00:00.000Z',
    actionSeq: game.seq + 1,
    game,
  }),
);
const mismatch = loadRunSnapshot(store);
expect(
  mismatch.snapshot === null &&
    mismatch.issue?.code === 'STATE_INVALID' &&
    mismatch.issue.message === expectedMessage.STATE_INVALID,
  'envelope actionSeq와 GameState seq가 다르면 복구하지 않는다',
);

game = structuredClone(game);
game.screen = 'interlude';
game.interlude = {
  eventId: 'tip-letter',
  results: [],
  borrowedFacetKeys: [],
  ap: 2,
  usedActions: [],
};
game = reduce(game, { type: 'INTERLUDE_ACTION', kind: 'recon' }, CONTENT);
saveRunSnapshot(store, game, () => '2026-07-28T00:00:01.000Z');
const resumed = loadRunSnapshot(store).snapshot!.game;
const replayed = reduce(resumed, { type: 'INTERLUDE_ACTION', kind: 'recon' }, CONTENT);
expect(
  replayed.interlude?.ap === 1 &&
    replayed.interlude.usedActions.join(',') === 'recon' &&
    replayed.interlude.results.length === 1 &&
    replayed.seq === resumed.seq,
  '새로고침 뒤 같은 irreversible action이 중복 적용되거나 checkpoint를 만들지 않는다',
);

console.log('[run-session] ALL PASS');
