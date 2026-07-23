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

export { SUITS };
export const TAGS = ['공개', '은밀', '강압', '신중', '논리'] as const;
export const KINDS = ['사람', '사물', '행위', '기록', '현상'] as const;
export const FRAMES = [
  'route', 'means', 'trace', 'action', 'motive', 'record', 'omission', 'scene', 'identity',
] as const;

export const PACK_FORMAT = 'game-data-pack';
export const PACK_FORMAT_VERSION = 1;
/** 팩 네임스페이스 id 규약 — base 팩은 'base', mod 팩은 'mod.<이름>' 관례. */
const PACK_ID_RE = /^[a-z][a-z0-9_.-]*$/;

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

export interface GameDataPack {
  format: typeof PACK_FORMAT;
  formatVersion: typeof PACK_FORMAT_VERSION;
  id: string;
  name?: string;
  version?: string;
  clues?: Record<string, ClueCard>;
  patterns?: Record<string, PatternCard>;
  hintDefs?: Record<string, HintDef>;
  cases?: CaseDef[];
  run?: Partial<RunTuning>;
}

export interface PackIssue {
  /** 문제 위치 — `clues.thread_fiber.facets[0].key` 꼴. */
  path: string;
  msg: string;
}
export interface PackValidation {
  ok: boolean;
  issues: PackIssue[];
}

// ── ① 형태 검증 ──────────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const inEnum = (v: unknown, all: readonly string[]): boolean => isStr(v) && all.includes(v);
const enumArr = (v: unknown, all: readonly string[]): boolean =>
  Array.isArray(v) && v.every((x) => inEnum(x, all));

class Issues {
  list: PackIssue[] = [];
  add(path: string, msg: string): void {
    this.list.push({ path, msg });
  }
  /** 조건이 거짓이면 issue — 검증 본문을 선언형으로 유지한다. */
  need(ok: boolean, path: string, msg: string): boolean {
    if (!ok) this.add(path, msg);
    return ok;
  }
}

function validateFacet(f: unknown, cardId: string, path: string, out: Issues): void {
  if (!out.need(isObj(f), path, '얼굴이 객체가 아니다')) return;
  if (out.need(inEnum(f.frame, FRAMES), `${path}.frame`, `frame은 ${FRAMES.join('|')} 중 하나여야 한다`)) {
    out.need(f.key === `${cardId}:${f.frame}`, `${path}.key`, `facet key는 "${cardId}:${f.frame}"이어야 한다 (실제: ${JSON.stringify(f.key)})`);
  }
  out.need(isStr(f.meaning), `${path}.meaning`, 'meaning은 문자열이어야 한다');
  out.need(isStr(f.note), `${path}.note`, 'note는 문자열이어야 한다');
  out.need(enumArr(f.tags, TAGS), `${path}.tags`, `tags는 ${TAGS.join('|')}의 배열이어야 한다`);
  if (f.line !== undefined) out.need(isStr(f.line), `${path}.line`, 'line은 문자열이어야 한다');
  if (f.needsPrev !== undefined) {
    out.need(enumArr(f.needsPrev, FRAMES), `${path}.needsPrev`, 'needsPrev는 frame의 배열이어야 한다');
  }
  if (f.gate !== undefined) {
    const g = f.gate;
    if (out.need(isObj(g), `${path}.gate`, 'gate는 객체여야 한다')) {
      out.need(inEnum(g.stat, ['heat', 'trust', 'axis']), `${path}.gate.stat`, 'gate.stat은 heat|trust|axis');
      out.need(isStr(g.why), `${path}.gate.why`, 'gate.why(막힌 이유)는 필수 문자열');
      if (g.gte !== undefined) out.need(isNum(g.gte), `${path}.gate.gte`, 'gte는 숫자');
      if (g.lt !== undefined) out.need(isNum(g.lt), `${path}.gate.lt`, 'lt는 숫자');
    }
  }
}

function validateClue(c: unknown, key: string, path: string, out: Issues): void {
  if (!out.need(isObj(c), path, '단서가 객체가 아니다')) return;
  out.need(c.id === key, `${path}.id`, `record 키와 id가 다르다 (키 "${key}" vs id ${JSON.stringify(c.id)})`);
  out.need(isStr(c.name), `${path}.name`, 'name은 문자열이어야 한다');
  out.need(inEnum(c.suit, SUITS), `${path}.suit`, `suit는 ${SUITS.join('|')} 중 하나여야 한다`);
  out.need(inEnum(c.kind, KINDS), `${path}.kind`, `kind는 ${KINDS.join('|')} 중 하나여야 한다`);
  out.need(enumArr(c.tags, TAGS), `${path}.tags`, `tags는 ${TAGS.join('|')}의 배열이어야 한다`);
  out.need(isStr(c.text), `${path}.text`, 'text는 문자열이어야 한다');
  if (!out.need(Array.isArray(c.facets) && c.facets.length > 0, `${path}.facets`, '얼굴이 최소 1개 필요하다(facets[0] = 획득 시 아는 얼굴)')) return;
  const seen = new Set<string>();
  (c.facets as unknown[]).forEach((f, i) => {
    validateFacet(f, key, `${path}.facets[${i}]`, out);
    if (isObj(f) && isStr(f.frame)) {
      out.need(!seen.has(f.frame), `${path}.facets[${i}].frame`, `frame "${f.frame}" 중복 — 한 카드의 얼굴 frame은 유일해야 한다`);
      seen.add(f.frame);
    }
  });
}

function validateSlot(sl: unknown, path: string, out: Issues): void {
  if (!out.need(isObj(sl), path, '슬롯이 객체가 아니다')) return;
  out.need(isStr(sl.id), `${path}.id`, 'id는 문자열이어야 한다');
  out.need(isStr(sl.label), `${path}.label`, 'label은 문자열이어야 한다');
  const a = sl.answer;
  if (!isStr(a)) {
    if (out.need(isObj(a), `${path}.answer`, 'answer는 카드 id 또는 조건부 정답 객체여야 한다')) {
      out.need(inEnum(a.stat, ['heat', 'trust']), `${path}.answer.stat`, '조건부 정답의 stat은 heat|trust');
      out.need(isNum(a.gte), `${path}.answer.gte`, 'gte는 숫자');
      out.need(isStr(a.then) && isStr(a.else), `${path}.answer`, 'then/else는 카드 id 문자열이어야 한다');
    }
  }
  if (sl.hit !== undefined) out.need(isStr(sl.hit), `${path}.hit`, 'hit은 문자열이어야 한다');
  if (sl.role !== undefined) {
    const r = sl.role;
    if (out.need(isObj(r), `${path}.role`, 'role은 객체여야 한다')) {
      out.need(inEnum(r.frame, FRAMES), `${path}.role.frame`, `role.frame은 ${FRAMES.join('|')} 중 하나여야 한다`);
      if (r.noun !== undefined) out.need(isStr(r.noun), `${path}.role.noun`, 'noun은 문자열');
      if (r.quality !== undefined) out.need(isStr(r.quality), `${path}.role.quality`, 'quality는 문자열');
      if (r.avoidTags !== undefined) out.need(enumArr(r.avoidTags, TAGS), `${path}.role.avoidTags`, 'avoidTags는 tag의 배열');
      if (r.accepts !== undefined) out.need(enumArr(r.accepts, KINDS), `${path}.role.accepts`, 'accepts는 kind의 배열');
    }
  }
}

const FACET_KEY_RE = /^[^:]+:[^:]+$/;

function validateCase(k: unknown, path: string, out: Issues): void {
  if (!out.need(isObj(k), path, 'case가 객체가 아니다')) return;
  out.need(isStr(k.id), `${path}.id`, 'id는 문자열이어야 한다');
  out.need(isStr(k.title), `${path}.title`, 'title은 문자열이어야 한다');
  out.need(isStr(k.intro), `${path}.intro`, 'intro는 문자열이어야 한다');
  for (const opt of ['teaser', 'contextHint', 'guestPattern'] as const) {
    if (k[opt] !== undefined) out.need(isStr(k[opt]), `${path}.${opt}`, `${opt}은 문자열이어야 한다`);
  }
  const slots = Array.isArray(k.slots) ? (k.slots as unknown[]) : null;
  if (out.need(slots !== null && slots.length > 0, `${path}.slots`, '슬롯이 최소 1개 필요하다')) {
    const seen = new Set<string>();
    slots!.forEach((sl, i) => {
      validateSlot(sl, `${path}.slots[${i}]`, out);
      if (isObj(sl) && isStr(sl.id)) {
        out.need(!seen.has(sl.id), `${path}.slots[${i}].id`, `슬롯 id "${sl.id}" 중복`);
        seen.add(sl.id);
      }
    });
    out.need(
      isStrArr(k.pieces) && k.pieces.length === slots!.length + 1,
      `${path}.pieces`,
      `pieces는 slots + 1개(${slots!.length + 1})의 문자열이어야 한다 — 조각 사이에 슬롯이 낀다`,
    );
  }
  out.need(isStrArr(k.patterns) && (k.patterns as string[]).length > 0, `${path}.patterns`, 'patterns는 골격 id 배열(최소 1)이어야 한다');
  out.need(isStrArr(k.guestClues), `${path}.guestClues`, 'guestClues는 카드 id 배열이어야 한다');
  out.need(isStrArr(k.packPool), `${path}.packPool`, 'packPool은 카드 id 배열이어야 한다');
  if (k.guestFacets !== undefined) {
    out.need(
      isStrArr(k.guestFacets) && (k.guestFacets as string[]).every((s) => FACET_KEY_RE.test(s)),
      `${path}.guestFacets`,
      'guestFacets는 "<cardId>:<frame>" 배열이어야 한다',
    );
  }
  if (k.axis !== undefined) {
    const ax = k.axis;
    if (out.need(isObj(ax), `${path}.axis`, 'axis는 객체여야 한다')) {
      for (const f of ['id', 'label', 'low', 'high', 'hint'] as const) {
        out.need(isStr(ax[f]), `${path}.axis.${f}`, `${f}는 문자열이어야 한다`);
      }
      out.need(isNum(ax.init), `${path}.axis.init`, 'init은 숫자여야 한다');
      out.need(inEnum(ax.drivenBy, TAGS), `${path}.axis.drivenBy`, `drivenBy는 ${TAGS.join('|')} 중 하나여야 한다`);
    }
  }
  if (k.misfits !== undefined) {
    const ok =
      isObj(k.misfits) &&
      Object.values(k.misfits).every((m) => isObj(m) && Object.values(m).every(isStr));
    out.need(ok, `${path}.misfits`, 'misfits는 { slotId: { cardId: 반응문 } } 꼴이어야 한다');
  }
}

function validateRun(run: unknown, out: Issues): void {
  if (!out.need(isObj(run), 'run', 'run은 객체여야 한다')) return;
  for (const key of Object.keys(run)) {
    out.need((RUN_KEYS as string[]).includes(key), `run.${key}`, '알 수 없는 run 필드');
  }
  // 프로토 단계: 인터루드 구조는 느슨히(객체 배열만) — TODO(16): 계약 확정 시 조인다.
  if (run.interludeEvents !== undefined) {
    out.need(Array.isArray(run.interludeEvents) && run.interludeEvents.every(isObj), 'run.interludeEvents', '객체 배열이어야 한다');
  }
  if (run.interludeActions !== undefined) {
    out.need(Array.isArray(run.interludeActions) && run.interludeActions.every(isObj), 'run.interludeActions', '객체 배열이어야 한다');
  }
  if (run.interludeAP !== undefined) out.need(isNum(run.interludeAP), 'run.interludeAP', '숫자여야 한다');
  if (run.badHeat !== undefined) out.need(isNum(run.badHeat), 'run.badHeat', '숫자여야 한다');
  for (const f of ['starterClues', 'starterPatterns', 'starterHints'] as const) {
    if (run[f] !== undefined) out.need(isStrArr(run[f]), `run.${f}`, 'id 문자열 배열이어야 한다');
  }
  if (run.initial !== undefined) {
    const ini = run.initial;
    out.need(isObj(ini) && isNum(ini.heat) && isNum(ini.trust), 'run.initial', '{ heat, trust } 숫자 쌍이어야 한다');
  }
  if (run.tagDeltas !== undefined) {
    const td = run.tagDeltas;
    const ok =
      isObj(td) &&
      Object.entries(td).every(
        ([tag, d]) => inEnum(tag, TAGS) && isObj(d) && isNum(d.heat) && isNum(d.trust),
      );
    out.need(ok, 'run.tagDeltas', `{ ${TAGS.join('|')}: { heat, trust } } 꼴이어야 한다`);
  }
}

/** 팩 한 개의 형태 검증 — schema/game-data-pack.json과 같은 규칙 + 교차 필드 불변식. */
export function validatePack(json: unknown): PackValidation {
  const out = new Issues();
  if (!out.need(isObj(json), '', '팩이 JSON 객체가 아니다')) return { ok: false, issues: out.list };
  out.need(json.format === PACK_FORMAT, 'format', `format은 "${PACK_FORMAT}"이어야 한다 (실제: ${JSON.stringify(json.format)})`);
  out.need(
    json.formatVersion === PACK_FORMAT_VERSION,
    'formatVersion',
    `지원하는 formatVersion은 ${PACK_FORMAT_VERSION}뿐이다 (실제: ${JSON.stringify(json.formatVersion)}) — 버전 스큐`,
  );
  out.need(isStr(json.id) && PACK_ID_RE.test(json.id), 'id', '팩 id는 소문자로 시작하는 [a-z0-9_.-] 문자열이어야 한다');
  for (const [field, fn] of [['clues', validateClue], ['patterns', null], ['hintDefs', null]] as const) {
    const rec = json[field];
    if (rec === undefined) continue;
    if (!out.need(isObj(rec), field, 'id → 항목의 record여야 한다')) continue;
    for (const [key, item] of Object.entries(rec)) {
      if (fn) {
        fn(item, key, `${field}.${key}`, out);
      } else if (out.need(isObj(item), `${field}.${key}`, '항목이 객체가 아니다')) {
        out.need(item.id === key, `${field}.${key}.id`, `record 키와 id가 다르다`);
        out.need(isStr(item.name), `${field}.${key}.name`, 'name은 문자열이어야 한다');
        const textField = field === 'patterns' ? 'text' : 'desc';
        out.need(isStr(item[textField]), `${field}.${key}.${textField}`, `${textField}는 문자열이어야 한다`);
        if (field === 'hintDefs') out.need(isNum(item.heatCost), `${field}.${key}.heatCost`, 'heatCost는 숫자여야 한다');
      }
    }
  }
  if (json.cases !== undefined) {
    if (out.need(Array.isArray(json.cases), 'cases', '배열이어야 한다')) {
      const seen = new Set<string>();
      (json.cases as unknown[]).forEach((k, i) => {
        validateCase(k, `cases[${i}]`, out);
        if (isObj(k) && isStr(k.id)) {
          out.need(!seen.has(k.id), `cases[${i}].id`, `case id "${k.id}" 중복`);
          seen.add(k.id);
        }
      });
    }
  }
  if (json.run !== undefined) validateRun(json.run, out);
  return { ok: out.list.length === 0, issues: out.list };
}

/** 핸드오프 명세의 진입점 — 상세가 필요하면 validatePack을 쓴다. */
export function validateGameDataPack(json: unknown): boolean {
  return validatePack(json).ok;
}

// ── ② 병합 — base→mod 순서, 같은 id는 뒤가 상쇄 ─────────────────────────────

export interface MergeReport {
  /** 상쇄 이력 — 로드 UX가 "이 mod가 공식 카드 N장을 덮어썼다"를 보여줄 근거. */
  overrides: { kind: 'clue' | 'pattern' | 'hint' | 'case' | 'run'; id: string; from: string; by: string }[];
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
    clues: c.clues, patterns: c.patterns, hintDefs: c.hintDefs, cases: c.cases,
    run: {
      interludeEvents: c.interludeEvents, interludeAP: c.interludeAP, interludeActions: c.interludeActions,
      starterClues: c.starterClues, starterPatterns: c.starterPatterns, starterHints: c.starterHints,
      initial: c.initial, tagDeltas: c.tagDeltas, badHeat: c.badHeat,
    },
  };
}

// ── ③ 병합 후 참조 무결성 ────────────────────────────────────────────────────

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
        // 정답 카드는 슬롯 역할 frame의 얼굴을 실제로 가져야 한다 — 없으면 그 case는 풀 수 없다.
        if (sl.role) {
          out.need(
            content.clues[id].facets.some((f) => f.frame === sl.role!.frame),
            `${sp}.answer`,
            `정답 카드 "${id}"에 [${sl.role.frame}] 얼굴이 없다 — 풀 수 없는 슬롯`,
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
          `얼굴 "${key}"가 카드에 없다`,
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
  return out.list;
}

// ── 단일 진입점 ──────────────────────────────────────────────────────────────

export interface LoadResult {
  ok: boolean;
  content?: RunContent;
  report?: MergeReport;
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
      issues.push(...v.issues.map((x) => ({ path: `${label}:${x.path}`, msg: x.msg })));
    }
  });
  if (issues.length > 0) return { ok: false, issues };
  const { content, report } = mergePacks(packs);
  const integrity = checkIntegrity(content);
  return { ok: integrity.length === 0, content, report, issues: integrity };
}
