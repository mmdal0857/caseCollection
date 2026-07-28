// PROTOTYPE — 게임 데이터 팩 포맷·로더 (티켓 16: 외부 데이터 팩 로드의 프로토 자산).
// 계약(07·16): base 팩 = 레포에 커밋된 공식 아티팩트, mod 팩 = 외부 로드, **동일 포맷**.
// 팩은 변환 완료된 산출물이다 — 카드 재작성(04)·문맥 태그 추출(14)·case 생성이 끝난 것.
// 런타임 LLM·서버 0이므로 로더는 순수 구조 검증만 한다.
//
// 세 층으로 나뉜다:
//   ① validatePack   — 팩 한 개의 형태 불변식(envelope·clue·case). schema/game-data-pack.json과 쌍.
//   ② mergePacks     — base→mod 순서 병합. 같은 id는 뒤가 상쇄(override), 새 id는 추가.
//                      무엇이 어디서 왔는지(프로버넌스)와 상쇄 이력을 리포트로 남긴다.
//   ③ checkIntegrity — 병합 *후* 참조 무결성(슬롯 정답·게스트·스타터가 실제로 존재하는가).
//                      mod 팩은 base의 id를 참조할 수 있으므로 교차 참조는 병합 후에만 판정 가능.
// loadPacks가 ①→②→③을 묶은 단일 진입점이다.
// 기계 검증: smoke-datapack.ts (esbuild+node, smoke.ts와 같은 방식).

import type {
  CaseDef, ClueCard, HintDef, PatternCard, RunContent, Tag,
} from './engine';
import { SUITS } from './engine';
import validatePackShape from './generated/game-data-pack-v2-validator.js';
import {
  validateNarrativeDefinitions,
  type EndingDefinition,
  type InterludeDefinition,
} from './narrative-content';

export { SUITS };
export const TAGS = ['공개', '은밀', '강압', '신중', '논리'] as const;
export const KINDS = ['사람', '사물', '행위', '기록', '현상'] as const;
export const FRAMES = [
  'route', 'means', 'trace', 'action', 'motive', 'record', 'omission', 'scene', 'identity',
] as const;
/** src/lib/josa.ts의 JosaKind와 동기화 — 티켓 19: 슬롯 직후 조사는 리터럴이 아니라 이 마커로 방출된다. */
export const JOSA_KINDS = ['이가', '은는', '을를', '으로', '와과', '이다'] as const;

export const PACK_FORMAT = 'game-data-pack';
export const PACK_FORMAT_VERSION = 2;
/** run 전역 설정 — base 팩은 전부 채워야 하고, mod 팩은 바꿀 필드만 싣는다(필드 단위 상쇄). */
export type RunTuning = Pick<
  RunContent,
  | 'interludeEvents' | 'interludeAP' | 'interludeActions'
  | 'starterClues' | 'starterPatterns' | 'starterHints'
  | 'initial' | 'tagDeltas' | 'badHeat'
>;
const RUN_KEYS: (keyof RunTuning)[] = [
  'interludeEvents', 'interludeAP', 'interludeActions',
  'starterClues', 'starterPatterns', 'starterHints', 'initial', 'tagDeltas', 'badHeat',
];

export type MergeMode = 'base' | 'alongside' | 'promotion';
export type PackItemKind =
  | 'clue' | 'pattern' | 'hint' | 'case' | 'run'
  | 'interlude' | 'ending';

export interface PromotionTarget {
  kind: PackItemKind;
  id: string;
  expectedSourcePack: string;
}

export interface PackProvenance {
  sourceSnapshotIds: string[];
  inputSha256: string;
  modelId?: string;
  promptVersion?: string;
  seed?: number;
  rawResponseSha256?: string;
  validatorVersion: string;
  outputSha256: string;
}

export interface GameDataPack {
  format: typeof PACK_FORMAT;
  formatVersion: typeof PACK_FORMAT_VERSION;
  id: string;
  name?: string;
  version?: string;
  mergeMode: MergeMode;
  promotionTargets?: PromotionTarget[];
  provenance: PackProvenance;
  clues?: Record<string, ClueCard>;
  patterns?: Record<string, PatternCard>;
  hintDefs?: Record<string, HintDef>;
  cases?: CaseDef[];
  run?: Partial<RunTuning>;
  interludes?: InterludeDefinition[];
  endings?: EndingDefinition[];
}

export type PackIssueCode =
  | 'SCHEMA_INVALID'
  | 'LEGACY_PACK_REQUIRES_MIGRATION'
  | 'MERGE_POLICY_INVALID'
  | 'REFERENCE_INVALID'
  | 'ART_MISSING';

export interface PackIssue {
  code: PackIssueCode;
  /** 문제 위치 — `clues.thread_fiber.facets[0].key` 꼴. */
  path: string;
  msg: string;
  packId?: string;
  severity: 'error' | 'warning';
}
export interface PackValidation {
  ok: boolean;
  issues: PackIssue[];
}

// ── ① 형태 검증 ──────────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

class Issues {
  list: PackIssue[] = [];
  add(
    path: string,
    msg: string,
    code: PackIssueCode = 'REFERENCE_INVALID',
  ): void {
    this.list.push({ code, path, msg, severity: 'error' });
  }
  /** 조건이 거짓이면 issue — 검증 본문을 선언형으로 유지한다. */
  need(ok: boolean, path: string, msg: string): boolean {
    if (!ok) this.add(path, msg);
    return ok;
  }
}

/** 완성형 한글 음절 범위(가~힣, U+AC00~U+D7A3) — 티켓 19: 받침 판정이 성립하려면 카드명은 여기로 끝나야 한다. */
function isHangulSyllable(ch: string): boolean {
  const cp = ch.charCodeAt(0);
  return cp >= 0xac00 && cp <= 0xd7a3;
}

/** smoke.ts 섹션 F와 동일 규칙(정본은 그쪽) — 조사 뒤 한글이 바로 이어지면 다른 낱말(예: '이유')일 수 있어 제외. */
const JOSA_LEAD_RE = /^(이|가|은|는|을|를|로|으로|과|와|이다|다)(?![가-힣])/;

function schemaIssues(json: unknown): PackIssue[] {
  if (validatePackShape(json)) return [];
  const packId = isObj(json) && isStr(json.id) ? json.id : undefined;
  return (validatePackShape.errors ?? []).map((error) => {
    const path = error.instancePath
      .replace(/^\//, '')
      .replaceAll('/', '.');
    return {
      code: 'SCHEMA_INVALID',
      path,
      msg: `${path || '$'}: ${error.message ?? error.keyword}`,
      packId,
      severity: 'error',
    };
  });
}

function crossFieldIssues(pack: GameDataPack): PackIssue[] {
  const out = new Issues();
  for (const [id, clue] of Object.entries(pack.clues ?? {})) {
    out.need(
      clue.id === id,
      `clues.${id}.id`,
      `record 키와 id가 다르다 (키 "${id}" vs id "${clue.id}")`,
    );
    out.need(
      clue.name.length > 0 &&
        isHangulSyllable(clue.name[clue.name.length - 1]),
      `clues.${id}.name`,
      `카드명은 완성형 한글로 끝나야 한다 — "${clue.name}"`,
    );
    const frames = new Set<string>();
    clue.facets.forEach((facet, index) => {
      out.need(
        facet.key === `${id}:${facet.frame}`,
        `clues.${id}.facets[${index}].key`,
        `facet key는 "${id}:${facet.frame}"이어야 한다`,
      );
      out.need(
        !frames.has(facet.frame),
        `clues.${id}.facets[${index}].frame`,
        `frame "${facet.frame}" 중복`,
      );
      frames.add(facet.frame);
    });
  }
  for (const [id, pattern] of Object.entries(pack.patterns ?? {})) {
    out.need(
      pattern.id === id,
      `patterns.${id}.id`,
      'record 키와 id가 다르다',
    );
  }
  for (const [id, hint] of Object.entries(pack.hintDefs ?? {})) {
    out.need(
      hint.id === id,
      `hintDefs.${id}.id`,
      'record 키와 id가 다르다',
    );
  }
  const caseIds = new Set<string>();
  (pack.cases ?? []).forEach((caseDef, caseIndex) => {
    const path = `cases[${caseIndex}]`;
    out.need(
      !caseIds.has(caseDef.id),
      `${path}.id`,
      `case id "${caseDef.id}" 중복`,
    );
    caseIds.add(caseDef.id);
    out.need(
      caseDef.pieces.length === caseDef.slots.length + 1,
      `${path}.pieces`,
      `pieces는 slots + 1개(${caseDef.slots.length + 1})여야 한다`,
    );
    const slotIds = new Set<string>();
    caseDef.slots.forEach((slot, slotIndex) => {
      out.need(
        !slotIds.has(slot.id),
        `${path}.slots[${slotIndex}].id`,
        `슬롯 id "${slot.id}" 중복`,
      );
      slotIds.add(slot.id);
      const nextPiece = (caseDef.pieces[slotIndex + 1] ?? '')
        .replace(/^\s+/, '');
      if (JOSA_LEAD_RE.test(nextPiece) && slot.josaAfter === undefined) {
        out.add(
          `${path}.pieces[${slotIndex + 1}]`,
          `조각 "${caseDef.pieces[slotIndex + 1]}"이 조사로 시작하는데 슬롯 "${slot.id}"에 josaAfter 미지정`,
        );
      }
    });
  });
  const interludeIds = new Set<string>();
  (pack.interludes ?? []).forEach((definition, index) => {
    const path = `interludes[${index}]`;
    out.need(
      !interludeIds.has(definition.id),
      `${path}.id`,
      `interlude id "${definition.id}" 중복`,
    );
    interludeIds.add(definition.id);
    const kinds = definition.actions.map((action) => action.kind);
    out.need(
      definition.apBudget === 2 &&
        kinds.length === 3 &&
        new Set(kinds).size === 3 &&
        ['recon', 'interview', 'stabilize'].every((kind) =>
          kinds.includes(kind as typeof kinds[number])
        ),
      `${path}.actions`,
      'AP 2와 recon/interview/stabilize 각 1개가 필요하다',
    );
    definition.actions.forEach((action, actionIndex) => {
      if (action.kind === 'recon') {
        out.need(
          action.resultText === action.revealValue,
          `${path}.actions[${actionIndex}].resultText`,
          'recon 결과는 승인된 revealValue와 byte-identical이어야 한다',
        );
      }
      if (action.kind === 'stabilize') {
        out.need(
          (action.stat === 'heat' && action.delta < 0) ||
            (action.stat === 'trust' && action.delta > 0),
          `${path}.actions[${actionIndex}].delta`,
          'stabilize는 heat를 낮추거나 trust를 높여야 한다',
        );
      }
    });
  });
  const endingIds = new Set<string>();
  (pack.endings ?? []).forEach((ending, index) => {
    const path = `endings[${index}]`;
    out.need(
      !endingIds.has(ending.id),
      `${path}.id`,
      `ending id "${ending.id}" 중복`,
    );
    endingIds.add(ending.id);
    out.need(
      (ending.triggerRuleId === 'bad-press' && ending.warningRuleId === 'press') ||
        (ending.triggerRuleId === 'bad-collapse' && ending.warningRuleId === 'collapse'),
      path,
      'BAD trigger와 선행 warning 규칙이 맞지 않는다',
    );
  });
  return out.list;
}

/** 팩 한 개의 형태 검증 — generated v2 schema + 교차 필드 불변식. */
export function validatePack(json: unknown): PackValidation {
  const out = new Issues();
  if (!isObj(json)) {
    out.add('', '팩이 JSON 객체가 아니다', 'SCHEMA_INVALID');
    return { ok: false, issues: out.list };
  }
  if (json.formatVersion === 1) {
    out.add(
      'formatVersion',
      'v1 팩은 명시적 migration이 필요하다',
      'LEGACY_PACK_REQUIRES_MIGRATION',
    );
    return { ok: false, issues: out.list };
  }
  const shape = schemaIssues(json);
  if (shape.length > 0) return { ok: false, issues: shape };
  const cross = crossFieldIssues(json as unknown as GameDataPack);
  return { ok: cross.length === 0, issues: cross };
}

/** 핸드오프 명세의 진입점 — 상세가 필요하면 validatePack을 쓴다. */
export function validateGameDataPack(json: unknown): boolean {
  return validatePack(json).ok;
}

export interface MigrationResult {
  ok: boolean;
  pack?: GameDataPack;
  issues: PackIssue[];
}

export function canonicalJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item !== null && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, nested]) => [key, normalize(nested)]),
      );
    }
    return item;
  };
  return `${JSON.stringify(normalize(value))}\n`;
}

async function sha256Hex(value: unknown): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalJson(value)),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function migrateV1BasePack(
  data: unknown,
): Promise<MigrationResult> {
  if (!isObj(data) || data.formatVersion !== 1 || data.id !== 'base') {
    return {
      ok: false,
      issues: [{
        code: 'LEGACY_PACK_REQUIRES_MIGRATION',
        path: 'formatVersion',
        msg: 'v1 migration은 base pack에만 허용된다',
        severity: 'error',
      }],
    };
  }
  const inputSha256 = await sha256Hex(data);
  const pack = {
    ...data,
    formatVersion: 2,
    mergeMode: 'base',
    provenance: {
      sourceSnapshotIds: ['migration:v1-base'],
      inputSha256,
      validatorVersion: 'pack-v2',
      outputSha256: '0'.repeat(64),
    },
  };
  pack.provenance.outputSha256 = await sha256Hex(pack);
  const validation = validatePack(pack);
  return validation.ok
    ? { ok: true, pack: pack as GameDataPack, issues: [] }
    : { ok: false, issues: validation.issues };
}

// ── ② 병합 정책 — base→external 순서, 충돌은 명시적 promotion만 허용 ───────

export interface PackAddition {
  kind: PackItemKind;
  id: string;
  by: string;
}

export interface PackPreflight {
  ok: boolean;
  issues: PackIssue[];
  additions: PackAddition[];
  overrides: MergeReport['overrides'];
  orderedPackIds: string[];
}

interface PackItemRef {
  kind: PackItemKind;
  id: string;
}

function policyIssue(
  packId: string,
  path: string,
  msg: string,
): PackIssue {
  return {
    code: 'MERGE_POLICY_INVALID',
    path,
    msg,
    packId,
    severity: 'error',
  };
}

function visitPackItems(
  pack: GameDataPack,
  visit: (item: PackItemRef) => void,
): void {
  Object.keys(pack.clues ?? {}).forEach((id) => visit({ kind: 'clue', id }));
  Object.keys(pack.patterns ?? {}).forEach((id) => visit({ kind: 'pattern', id }));
  Object.keys(pack.hintDefs ?? {}).forEach((id) => visit({ kind: 'hint', id }));
  (pack.cases ?? []).forEach(({ id }) => visit({ kind: 'case', id }));
  (pack.interludes ?? []).forEach(({ id }) => visit({ kind: 'interlude', id }));
  (pack.endings ?? []).forEach(({ id }) => visit({ kind: 'ending', id }));
  for (const id of RUN_KEYS) {
    if (pack.run?.[id] !== undefined) visit({ kind: 'run', id });
  }
}

export function preflightPacks(packs: GameDataPack[]): PackPreflight {
  const issues: PackIssue[] = [];
  const additions: PackAddition[] = [];
  const provenance: Record<string, string> = {};
  const overrides: MergeReport['overrides'] = [];
  const seenPackIds = new Set<string>();

  packs.forEach((pack, index) => {
    if (seenPackIds.has(pack.id)) {
      issues.push(policyIssue(pack.id, 'id', 'pack ID가 중복됐다'));
    }
    seenPackIds.add(pack.id);
    if (index === 0 && (pack.id !== 'base' || pack.mergeMode !== 'base')) {
      issues.push(policyIssue(
        pack.id,
        'mergeMode',
        '첫 팩은 id와 mergeMode가 모두 base여야 한다',
      ));
    }
    if (index > 0 && pack.mergeMode === 'base') {
      issues.push(policyIssue(
        pack.id,
        'mergeMode',
        'base는 첫 팩 하나뿐이다',
      ));
    }

    visitPackItems(pack, ({ kind, id }) => {
      const key = `${kind}:${id}`;
      const from = provenance[key];
      if (from === undefined) {
        if (
          index > 0 &&
          kind !== 'run' &&
          !id.startsWith(`${pack.id}.`)
        ) {
          issues.push(policyIssue(
            pack.id,
            `${kind}.${id}`,
            `새 콘텐츠 ID는 "${pack.id}."로 시작해야 한다`,
          ));
        }
        additions.push({ kind, id, by: pack.id });
        provenance[key] = pack.id;
        return;
      }

      const target = pack.promotionTargets?.find(
        (item) => item.kind === kind && item.id === id,
      );
      if (
        pack.mergeMode !== 'promotion' ||
        target?.expectedSourcePack !== from
      ) {
        issues.push(policyIssue(
          pack.id,
          `${kind}.${id}`,
          `상쇄 대상 ${kind}:${id}의 현재 소유자는 ${from}이다`,
        ));
        return;
      }
      overrides.push({ kind, id, from, by: pack.id });
      provenance[key] = pack.id;
    });

    for (const target of pack.promotionTargets ?? []) {
      const used = overrides.some(
        (item) =>
          item.by === pack.id &&
          item.kind === target.kind &&
          item.id === target.id,
      );
      if (!used) {
        issues.push(policyIssue(
          pack.id,
          `promotionTargets.${target.kind}.${target.id}`,
          '선언한 상쇄 대상에 대응하는 payload가 없다',
        ));
      }
    }
  });

  return {
    ok: issues.every((issue) => issue.severity !== 'error'),
    issues,
    additions,
    overrides,
    orderedPackIds: packs.map((pack) => pack.id),
  };
}

// ── ③ 병합 — preflight를 통과한 팩에만 호출한다 ─────────────────────────────

export interface MergeReport {
  /** 상쇄 이력 — 로드 UX가 "이 mod가 공식 카드 N장을 덮어썼다"를 보여줄 근거. */
  overrides: { kind: PackItemKind; id: string; from: string; by: string }[];
  /** `${kind}:${id}` → 최종 소유 팩 id. */
  provenance: Record<string, string>;
}

export function mergePacks(packs: GameDataPack[]): { content: RunContent; report: MergeReport } {
  const report: MergeReport = { overrides: [], provenance: {} };
  const clues: Record<string, ClueCard> = {};
  const patterns: Record<string, PatternCard> = {};
  const hintDefs: Record<string, HintDef> = {};
  const cases: CaseDef[] = [];
  const caseIdx = new Map<string, number>();
  const interludes: InterludeDefinition[] = [];
  const interludeIdx = new Map<string, number>();
  const endings: EndingDefinition[] = [];
  const endingIdx = new Map<string, number>();
  const run: Partial<RunTuning> = {};

  const put = <T>(target: Record<string, T>, kind: MergeReport['overrides'][0]['kind'], id: string, item: T, by: string) => {
    const pkey = `${kind}:${id}`;
    const prev = report.provenance[pkey];
    if (prev !== undefined) report.overrides.push({ kind, id, from: prev, by });
    report.provenance[pkey] = by;
    target[id] = item;
  };

  for (const p of packs) {
    for (const [id, c] of Object.entries(p.clues ?? {})) put(clues, 'clue', id, c, p.id);
    for (const [id, pt] of Object.entries(p.patterns ?? {})) put(patterns, 'pattern', id, pt, p.id);
    for (const [id, h] of Object.entries(p.hintDefs ?? {})) put(hintDefs, 'hint', id, h, p.id);
    for (const k of p.cases ?? []) {
      const pkey = `case:${k.id}`;
      const prev = report.provenance[pkey];
      if (prev !== undefined) {
        report.overrides.push({ kind: 'case', id: k.id, from: prev, by: p.id });
        cases[caseIdx.get(k.id)!] = k; // 같은 id는 base의 자리에서 교체 — run 진행 순서를 보존한다
      } else {
        caseIdx.set(k.id, cases.length);
        cases.push(k);
      }
      report.provenance[pkey] = p.id;
    }
    for (const definition of p.interludes ?? []) {
      const pkey = `interlude:${definition.id}`;
      const prev = report.provenance[pkey];
      if (prev !== undefined) {
        report.overrides.push({
          kind: 'interlude',
          id: definition.id,
          from: prev,
          by: p.id,
        });
        interludes[interludeIdx.get(definition.id)!] = definition;
      } else {
        interludeIdx.set(definition.id, interludes.length);
        interludes.push(definition);
      }
      report.provenance[pkey] = p.id;
    }
    for (const definition of p.endings ?? []) {
      const pkey = `ending:${definition.id}`;
      const prev = report.provenance[pkey];
      if (prev !== undefined) {
        report.overrides.push({
          kind: 'ending',
          id: definition.id,
          from: prev,
          by: p.id,
        });
        endings[endingIdx.get(definition.id)!] = definition;
      } else {
        endingIdx.set(definition.id, endings.length);
        endings.push(definition);
      }
      report.provenance[pkey] = p.id;
    }
    for (const key of RUN_KEYS) {
      const v = p.run?.[key];
      if (v === undefined) continue;
      const pkey = `run:${key}`;
      const prev = report.provenance[pkey];
      if (prev !== undefined) report.overrides.push({ kind: 'run', id: key, from: prev, by: p.id });
      report.provenance[pkey] = p.id;
      (run as Record<string, unknown>)[key] = v;
    }
  }

  // run 필수 필드는 checkIntegrity가 집행 — 여기서는 조립만 한다.
  const content = {
    clues, patterns, hintDefs, cases,
    interludeEvents: run.interludeEvents ?? [],
    interludeAP: run.interludeAP ?? 0,
    interludeActions: run.interludeActions ?? [],
    interludes,
    endings,
    starterClues: run.starterClues ?? [],
    starterPatterns: run.starterPatterns ?? [],
    starterHints: run.starterHints ?? [],
    initial: run.initial ?? { heat: 0, trust: 0 },
    tagDeltas: run.tagDeltas ?? ({} as RunContent['tagDeltas']),
    badHeat: run.badHeat ?? 0,
  } as RunContent;
  return { content, report };
}

/** 레포에 커밋된 CONTENT를 base 팩으로 감싼다 — "base와 mod는 동일 포맷"의 증명이자 익스포트 경로. */
export function packFromContent(id: string, c: RunContent): GameDataPack {
  return {
    format: PACK_FORMAT, formatVersion: PACK_FORMAT_VERSION, id,
    mergeMode: 'base',
    provenance: {
      sourceSnapshotIds: ['repo:CONTENT'],
      inputSha256: '0'.repeat(64),
      validatorVersion: 'pack-v2',
      outputSha256: '0'.repeat(64),
    },
    clues: c.clues, patterns: c.patterns, hintDefs: c.hintDefs, cases: c.cases,
    interludes: c.interludes,
    endings: c.endings,
    run: {
      interludeEvents: c.interludeEvents, interludeAP: c.interludeAP, interludeActions: c.interludeActions,
      starterClues: c.starterClues, starterPatterns: c.starterPatterns, starterHints: c.starterHints,
      initial: c.initial, tagDeltas: c.tagDeltas, badHeat: c.badHeat,
    },
  };
}

// ── ④ 병합 후 참조 무결성 ────────────────────────────────────────────────────

export function checkIntegrity(content: RunContent): PackIssue[] {
  const out = new Issues();
  const clue = (id: string, path: string) =>
    out.need(content.clues[id] !== undefined, path, `카드 "${id}"가 병합된 팩에 없다`);
  const pattern = (id: string, path: string) =>
    out.need(content.patterns[id] !== undefined, path, `패턴 "${id}"가 병합된 팩에 없다`);

  content.cases.forEach((k, ci) => {
    const path = `cases[${ci}](${k.id})`;
    for (const p of k.patterns) pattern(p, `${path}.patterns`);
    if (k.guestPattern) pattern(k.guestPattern, `${path}.guestPattern`);
    for (const id of k.guestClues) clue(id, `${path}.guestClues`);
    for (const id of k.packPool) clue(id, `${path}.packPool`);
    const slotIds = new Set(k.slots.map((sl) => sl.id));
    k.slots.forEach((sl, si) => {
      const sp = `${path}.slots[${si}]`;
      const answers = typeof sl.answer === 'string' ? [sl.answer] : [sl.answer.then, sl.answer.else];
      for (const id of answers) {
        if (!clue(id, `${sp}.answer`)) continue;
        // 정답 카드는 슬롯 역할 frame의 측면을 실제로 가져야 한다 — 없으면 그 case는 풀 수 없다.
        if (sl.role) {
          out.need(
            content.clues[id].facets.some((f) => f.frame === sl.role!.frame),
            `${sp}.answer`,
            `정답 카드 "${id}"에 [${sl.role.frame}] 측면이 없다 — 풀 수 없는 슬롯`,
          );
        }
      }
    });
    for (const key of k.guestFacets ?? []) {
      const [cardId] = key.split(':');
      if (clue(cardId, `${path}.guestFacets`)) {
        out.need(
          content.clues[cardId].facets.some((f) => f.key === key),
          `${path}.guestFacets`,
          `측면 "${key}"가 카드에 없다`,
        );
      }
    }
    for (const [slotId, m] of Object.entries(k.misfits ?? {})) {
      out.need(slotIds.has(slotId), `${path}.misfits.${slotId}`, `misfit이 없는 슬롯 "${slotId}"를 가리킨다`);
      for (const cardId of Object.keys(m)) clue(cardId, `${path}.misfits.${slotId}`);
    }
  });

  for (const id of content.starterClues) clue(id, 'run.starterClues');
  for (const id of content.starterPatterns) pattern(id, 'run.starterPatterns');
  for (const id of content.starterHints) {
    out.need(content.hintDefs[id] !== undefined, 'run.starterHints', `힌트 "${id}"가 병합된 팩에 없다`);
  }
  // 인터루드의 gainHint 참조도 실제 힌트여야 한다.
  const gains = [
    ...content.interludeActions.map((a) => a.effects.gainHint),
    ...content.interludeEvents.flatMap((e) => (e.choices ?? []).map((c) => c.effects.gainHint)),
  ];
  for (const id of gains) {
    if (id !== undefined) {
      out.need(content.hintDefs[id] !== undefined, 'run.interlude*.gainHint', `힌트 "${id}"가 병합된 팩에 없다`);
    }
  }
  // 플레이 가능한 run의 최소 조건 — base 팩 없이 mod만 병합한 경우를 잡는다.
  out.need(content.cases.length > 0, 'cases', 'case가 하나도 없다 — base 팩이 빠졌는가');
  out.need(content.starterClues.length > 0, 'run.starterClues', '스타터 카드가 없다 — base 팩이 빠졌는가');
  out.need(
    TAGS.every((t) => content.tagDeltas[t as Tag] !== undefined),
    'run.tagDeltas',
    `tagDeltas는 ${TAGS.join('·')} 전부를 정의해야 한다`,
  );
  for (const issue of validateNarrativeDefinitions(content)) {
    out.add(issue.path, issue.msg);
  }
  return out.list;
}

// ── 단일 진입점 ──────────────────────────────────────────────────────────────

export interface LoadResult {
  ok: boolean;
  content?: RunContent;
  report?: MergeReport;
  preflight?: PackPreflight;
  issues: PackIssue[];
}

/** base 팩 + mod 팩들을 검증→병합→무결성 순으로 로드한다. issue의 path에 팩 id가 접두된다. */
export function loadPacks(baseJson: unknown, modJsons: unknown[] = []): LoadResult {
  const issues: PackIssue[] = [];
  const packs: GameDataPack[] = [];
  [baseJson, ...modJsons].forEach((json, i) => {
    const v = validatePack(json);
    const label = isObj(json) && isStr(json.id) ? json.id : `pack[${i}]`;
    if (v.ok) {
      packs.push(json as unknown as GameDataPack);
    } else {
      issues.push(...v.issues.map((x) => ({
        ...x,
        path: `${label}:${x.path}`,
        packId: label,
      })));
    }
  });
  if (issues.length > 0) return { ok: false, issues };
  const preflight = preflightPacks(packs);
  if (!preflight.ok) {
    return {
      ok: false,
      preflight,
      issues: preflight.issues,
    };
  }
  const { content, report } = mergePacks(packs);
  const integrity = checkIntegrity(content);
  return {
    ok: integrity.length === 0,
    content,
    report,
    preflight,
    issues: integrity,
  };
}
