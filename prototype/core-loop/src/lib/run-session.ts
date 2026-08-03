import type { GameState, Screen } from './engine';

export const RUN_SNAPSHOT_KEY = 'case-collection.run-snapshot.v1';
export const RUN_SNAPSHOT_FORMAT = 'case-collection-run';
export const RUN_SNAPSHOT_VERSION = 1;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RunSnapshotV1 {
  format: typeof RUN_SNAPSHOT_FORMAT;
  version: typeof RUN_SNAPSHOT_VERSION;
  savedAt: string;
  actionSeq: number;
  game: GameState;
}

export type SnapshotIssueCode =
  | 'CORRUPT_JSON'
  | 'FUTURE_VERSION'
  | 'INCOMPATIBLE_FORMAT'
  | 'STATE_INVALID';

export interface SnapshotIssue {
  code: SnapshotIssueCode;
  message: string;
}

export interface SnapshotLoadResult {
  snapshot: RunSnapshotV1 | null;
  issue: SnapshotIssue | null;
  /** 진단·사용자 복구를 위해 절대 자동 삭제하지 않는 원문. */
  raw: string | null;
}

const SCREENS = new Set<Screen>([
  'briefing',
  'case',
  'clear',
  'interlude',
  'end',
  'summary',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  if (typeof value.screen !== 'string' || !SCREENS.has(value.screen as Screen)) {
    return false;
  }
  if (
    !Number.isInteger(value.seq) ||
    !Number.isInteger(value.caseIndex) ||
    typeof value.heat !== 'number' ||
    typeof value.trust !== 'number'
  ) {
    return false;
  }
  if (
    (value.casePhase !== 'compose' && value.casePhase !== 'review') ||
    !isStringArray(value.ownedClues) ||
    !isStringArray(value.ownedPatterns) ||
    !isStringArray(value.knownFacets) ||
    !isStringArray(value.borrowedFacetKeys) ||
    !isStringArray(value.riskWarnings) ||
    !Array.isArray(value.notebook) ||
    !Array.isArray(value.history)
  ) {
    return false;
  }
  if (value.interlude !== null) {
    if (
      !isRecord(value.interlude) ||
      typeof value.interlude.eventId !== 'string' ||
      typeof value.interlude.ap !== 'number' ||
      !isStringArray(value.interlude.results) ||
      !isStringArray(value.interlude.borrowedFacetKeys) ||
      !isStringArray(value.interlude.usedActions)
    ) {
      return false;
    }
  }
  return true;
}

function issue(
  code: SnapshotIssueCode,
  message: string,
  raw: string,
): SnapshotLoadResult {
  return { snapshot: null, issue: { code, message }, raw };
}

export function loadRunSnapshot(
  storage: KeyValueStorage,
): SnapshotLoadResult {
  const raw = storage.getItem(RUN_SNAPSHOT_KEY);
  if (raw === null) return { snapshot: null, issue: null, raw: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return issue('CORRUPT_JSON', '저장 데이터가 손상되었습니다.', raw);
  }
  if (!isRecord(parsed)) {
    return issue('STATE_INVALID', '저장된 수사 상태가 유효하지 않습니다.', raw);
  }
  if (
    typeof parsed.version === 'number' &&
    parsed.version > RUN_SNAPSHOT_VERSION
  ) {
    return issue(
      'FUTURE_VERSION',
      '현재 버전에서 읽을 수 없는 저장 데이터입니다.',
      raw,
    );
  }
  if (
    parsed.format !== RUN_SNAPSHOT_FORMAT ||
    parsed.version !== RUN_SNAPSHOT_VERSION
  ) {
    return issue(
      'INCOMPATIBLE_FORMAT',
      '호환되지 않는 저장 데이터 형식입니다.',
      raw,
    );
  }
  if (
    typeof parsed.savedAt !== 'string' ||
    !Number.isInteger(parsed.actionSeq) ||
    !validGameState(parsed.game) ||
    parsed.actionSeq !== parsed.game.seq
  ) {
    return issue(
      'STATE_INVALID',
      '저장된 수사 상태가 유효하지 않습니다.',
      raw,
    );
  }
  return {
    snapshot: parsed as unknown as RunSnapshotV1,
    issue: null,
    raw,
  };
}

export function saveRunSnapshot(
  storage: KeyValueStorage,
  game: GameState,
  now: () => string = () => new Date().toISOString(),
): RunSnapshotV1 {
  const snapshot: RunSnapshotV1 = {
    format: RUN_SNAPSHOT_FORMAT,
    version: RUN_SNAPSHOT_VERSION,
    savedAt: now(),
    actionSeq: game.seq,
    game: structuredClone(game),
  };
  const serialized = JSON.stringify(snapshot);
  storage.setItem(RUN_SNAPSHOT_KEY, serialized);
  return snapshot;
}

export function clearRunSnapshot(storage: KeyValueStorage): void {
  storage.removeItem(RUN_SNAPSHOT_KEY);
}
