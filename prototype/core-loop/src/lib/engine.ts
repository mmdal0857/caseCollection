// PROTOTYPE — throwaway (ticket 11: 코어 루프 프로토타입).
// 질문: 코어 루프 확정(03)의 루프 — 어휘 게이트 + 근접도 + 3개 단위 확정,
// 문맥 태그(배경 상태), 미니 런(case 3건+보스), 가설 선언, 수사 노트 해금 —
// 이 실제로 재미있는가.
// 이 모듈은 순수 로직(리듀서)이며 UI에 의존하지 않는다. 검증되면 실제 코드로 승격 가능.
// 여기 박힌 상수·조합식은 전부 프로토용 임시 규칙 — 정식 설계는 티켓 12.

import { comicReaction } from './dramaturgy';

export type Suit = 'physical' | 'behavioral' | 'documentary' | 'forensic';
export type Tag = '공개' | '은밀' | '강압' | '신중' | '논리';
/** 카드의 존재 범주 — 드라마투르기(오답 코미디)와 슬롯 부조화 판정의 축. */
export type Kind = '사람' | '사물' | '행위' | '기록' | '현상';
/** 슬롯이 요구하는 추리적 역할 — kind와의 부조화가 코믹 패턴을 낳는다. */
export type SlotFrame =
  | 'route' // 침입·이동 경로
  | 'means' // 살해 수단
  | 'trace' // 물리적 흔적
  | 'action' // 행동 단서
  | 'motive' // 동기
  | 'record' // 결정적 문서
  | 'omission' // 목격의 공백
  | 'scene' // 연출된 현장
  | 'identity'; // 사회적 정체/투명성
export type PatternId =
  | 'locked-room'
  | 'false-alibi'
  | 'invisible-man'
  | 'staged-disappearance';

export const SUITS: Suit[] = ['physical', 'behavioral', 'documentary', 'forensic'];
export const SUIT_LABEL: Record<Suit, string> = {
  physical: '물리',
  behavioral: '행동',
  documentary: '문서',
  forensic: '감식',
};
// 자리표시자 시각 정체성 — 실제 카드 아트는 티켓 13 소관.
export const SUIT_ICON: Record<Suit, string> = {
  physical: '🔍',
  behavioral: '👣',
  documentary: '📄',
  forensic: '🧪',
};

export interface ClueCard {
  id: string;
  name: string;
  suit: Suit;
  tags: Tag[];
  /** 존재 범주 — 드라마투르기 패턴이 슬롯 frame과 대조. */
  kind: Kind;
  /** 의미 텍스트 — 수사 노트. 검증 전에는 비공개. */
  text: string;
}

export interface PatternCard {
  id: PatternId;
  name: string;
  text: string;
}

export interface HintDef {
  id: string;
  name: string;
  desc: string;
  heatCost: number;
}

/** 배경 상태 조건부 정답 — 같은 슬롯도 상태에 따라 답이 달라진다. */
export interface CondAnswer {
  stat: 'heat' | 'trust';
  gte: number;
  then: string;
  else: string;
}

/** 슬롯의 추리적 역할 — 드라마투르기 패턴이 참조. */
export interface SlotRole {
  frame: SlotFrame;
  /** 범주 오류 반응용 명사(예: "흔적", "동기"). */
  noun?: string;
  /** 이 슬롯이 배격하는 태그 — 정반대 패턴을 발동(예: identity는 공개를 배격). */
  avoidTags?: Tag[];
  /** 정반대 패턴의 품질어(예: "투명함"). */
  quality?: string;
  /** 서사적으로 이 역할에 '맞는' 카드 kind. 생략 시 frame 기본값. 정답 kind는 반드시 포함. */
  accepts?: Kind[];
}

// frame별 서사 적합 kind 기본값 — 정답 카드는 자기 역할에 맞으므로 '정답=코히런트'가 성립.
export const FRAME_ACCEPTS: Record<SlotFrame, Kind[]> = {
  route: ['사물', '현상', '기록'], // 통로(환기구)·현상·이동 증빙(기차표)
  means: ['사물', '현상'],
  trace: ['사물', '현상'],
  action: ['행위'],
  motive: ['기록', '행위'],
  record: ['기록', '현상'],
  omission: ['사람', '현상'],
  scene: ['사물', '기록'],
  identity: ['행위'],
};

/** 카드가 슬롯 역할에 서사적으로 맞는가. 역할이 없으면 제약 없음(항상 맞음). */
export function cardFitsSlot(card: ClueCard, slot: Slot): boolean {
  if (!slot.role) return true;
  return (slot.role.accepts ?? FRAME_ACCEPTS[slot.role.frame]).includes(card.kind);
}

// 태그 = 영역 다수결(Tigris 오마쥬): 카드 태그가 배경 상태 트랙에 영향력을 놓는다.
// 주목 트랙 = 은밀(-) ↔ 공개(+), 신뢰 트랙 = 강압(-) ↔ 신중(+). 다수 극이 판정 규칙을 쥔다.
export const TRACK_POLES = {
  heat: { low: '은밀' as Tag, high: '공개' as Tag, label: '주목' },
  trust: { low: '강압' as Tag, high: '신중' as Tag, label: '신뢰' },
};

/** 카드 집합의 태그가 트랙에 미친 순영향 + 태그별 기여 — 줄다리기 가시화용. */
export function influenceOf(
  cardIds: string[],
  c: RunContent,
): { heat: number; trust: number; tags: { tag: Tag; count: number }[] } {
  const counts = new Map<Tag, number>();
  let heat = 0;
  let trust = 0;
  for (const id of cardIds) {
    for (const t of c.clues[id]?.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
      heat += c.tagDeltas[t].heat;
      trust += c.tagDeltas[t].trust;
    }
  }
  const tags = [...counts.entries()].map(([tag, count]) => ({ tag, count }));
  return { heat, trust, tags };
}

export interface Slot {
  id: string;
  label: string;
  answer: string | CondAnswer;
  /** 정답을 맞췄을 때의 반응(플레이버). 없으면 제네릭. */
  hit?: string;
  /** 드라마투르기 패턴 생성을 위한 역할. 없으면 슈트 기반 폴백만. */
  role?: SlotRole;
}

export interface CaseDef {
  id: string;
  title: string;
  intro: string;
  /** 인터루드에서 다음 사건으로 노출되는 한 줄 예고. */
  teaser?: string;
  /** 문맥 규칙의 플레이버 힌트(세계가 규칙을 귀띔한다). */
  contextHint?: string;
  /** 추리문 조각 — slots.length + 1개. 조각 사이에 슬롯이 낀다. */
  pieces: string[];
  slots: Slot[];
  /** 정답 골격. 보스는 2개(복합 패턴). */
  patterns: PatternId[];
  guestClues: string[];
  guestPattern?: PatternId;
  /** 클리어 보상 후보 풀 — 미보유 카드 중 앞에서 3장을 제시. 비면 보상 없음. */
  packPool: string[];
  /**
   * 엉뚱한 카드를 슬롯에 넣었을 때의 손수 반응(문맥 태그 의미론의 프로토 대역).
   * misfits[slotId][cardId] = 반응 문장. 없으면 제네릭 반응으로 폴백.
   * "특이 조합" 반응은 여기서 코믹/서사 재미를 준다.
   */
  misfits?: Record<string, Record<string, string>>;
}

export interface InterludeChoice {
  id: string;
  label: string;
  /** 검증된 단서 카드의 태그 수 게이트 — 컬렉션이 선택지를 연다. */
  requires?: { tag: Tag; count: number };
  effects: { heat?: number; trust?: number; gainHint?: string };
  result: string;
}

/** 인터루드 조사 리드 — 클릭해 다음 사건 배경·힌트를 "찾아가는" 미니루프. AP 1 소비. */
export interface InvestigationLead {
  id: string;
  label: string;
  reveal: string;
  /** 이 리드가 다음 case에 대한 실질적 힌트인가(단순 배경 vs 유용한 정보). */
  isHint?: boolean;
}

/**
 * 인터루드 행동(템포·행동 경제 — Dune: Imperium 오마쥬).
 * 한정된 AP를 조사·트랙 조작·힌트 확보에 배분한다. 전부는 못 한다 = 기회비용.
 */
export interface InterludeAction {
  id: string;
  label: string;
  desc: string;
  cost: number;
  effects: { heat?: number; trust?: number; gainHint?: string };
  /** 인터루드당 1회. */
  once?: boolean;
}

export interface InterludeEvent {
  id: string;
  cond: { heatGte?: number; trustGte?: number; trustLt?: number } | 'default';
  title: string;
  desc: string;
  /** 선택 전 조사 단계 — 리드를 눌러 배경·힌트를 발견. 선택은 조사와 무관하게 진행 가능. */
  investigation?: InvestigationLead[];
  /** BAD 엔딩 이벤트 — 선택지 없이 run이 끝난다. */
  bad?: { title: string; desc: string };
  choices?: InterludeChoice[];
}

export interface RunContent {
  clues: Record<string, ClueCard>;
  patterns: Record<string, PatternCard>;
  hintDefs: Record<string, HintDef>;
  cases: CaseDef[];
  /** 순서대로 평가해 첫 매칭 이벤트 발동. */
  interludeEvents: InterludeEvent[];
  /** 인터루드마다 주어지는 행동력(AP) — 전부 쓸 수 없게 짜여 기회비용을 만든다. */
  interludeAP: number;
  /** 모든 인터루드에서 공통으로 열리는 행동들. */
  interludeActions: InterludeAction[];
  starterClues: string[];
  starterPatterns: PatternId[];
  starterHints: string[];
  initial: { heat: number; trust: number };
  /** 확정된 카드의 태그가 배경 상태에 주는 변화(임시 조합식). */
  tagDeltas: Record<Tag, { heat: number; trust: number }>;
  /** 인터루드에서 이 값 이상이면 BAD. */
  badHeat: number;
}

/** 제출 시 각 슬롯이 받은 반응 — 이진 정오를 대체하는 텍스처. */
export interface SlotReaction {
  slotId: string;
  cardId: string;
  correct: boolean;
  line: string;
  /** 손수 misfit(특이 조합) 반응인가 — UI에서 강조. */
  special: boolean;
  /** 이 반응을 낳은 드라마투르기 패턴명(오답 시). UI 태그로 노출. */
  pattern?: string;
}

export interface SubmitResult {
  seq: number;
  kind: 'wrong' | 'confirm' | 'clear';
  /** 미확정 슬롯 중 맞은 개수 / 전체. */
  total: number;
  outOf: number;
  /** 가설 적중 시에만 채워지는 근접도 상세(슈트별). */
  perSuit: { suit: Suit; right: number; placed: number }[] | null;
  confirmedNow: string[];
  /** 이번 제출에서 판정된 각 슬롯의 반응. */
  reactions: SlotReaction[];
}

export interface HintReveal {
  slotId: string;
  text: string;
}

export type Screen = 'briefing' | 'case' | 'reward' | 'interlude' | 'end';

export interface GameState {
  screen: Screen;
  caseIndex: number;
  heat: number;
  trust: number;
  ownedClues: string[];
  ownedPatterns: PatternId[];
  /** 검증된 카드 id(단서·패턴 공통) — 수사 노트 해금. */
  verified: string[];
  hints: string[];
  // ---- case 로컬 ----
  placed: Record<string, string | null>;
  confirmed: Record<string, string>;
  declared: PatternId[];
  patternJudged: boolean;
  patternHit: boolean | null;
  submits: number;
  lastSubmit: SubmitResult | null;
  reveals: HintReveal[];
  // ---- 흐름 ----
  packOffer: string[];
  /** case를 클리어했으나 아직 다음 국면으로 넘어가지 않음 — 클리어 피드백을 보여주는 동안 true. */
  awaitingAdvance: boolean;
  interlude: {
    eventId: string;
    choiceId: string | null;
    result: string | null;
    revealed: string[]; // 조사로 밝혀낸 리드 id
    ap: number; // 남은 행동력
    usedActions: string[];
  } | null;
  ending: { kind: 'GOOD' | 'BAD'; title: string; desc: string } | null;
  seq: number;
  log: string[];
  history: { caseId: string; submits: number; heatAfter: number }[];
}

export type Action =
  | { type: 'START' }
  | { type: 'PLACE'; slotId: string; cardId: string }
  | { type: 'CLEAR_SLOT'; slotId: string }
  | { type: 'DECLARE'; pattern: PatternId }
  | { type: 'SUBMIT' }
  | { type: 'HINT'; hintId: string; slotId: string }
  | { type: 'PICK_REWARD'; cardId: string }
  | { type: 'INVESTIGATE'; leadId: string }
  | { type: 'INTERLUDE_ACTION'; actionId: string }
  | { type: 'INTERLUDE_CHOICE'; choiceId: string }
  | { type: 'ADVANCE' }
  | { type: 'CONTINUE' }
  | { type: 'RESTART' };

const clamp = (n: number) => Math.max(0, Math.min(10, n));

export function resolveAnswer(slot: Slot, s: { heat: number; trust: number }): string {
  if (typeof slot.answer === 'string') return slot.answer;
  const v = slot.answer.stat === 'heat' ? s.heat : s.trust;
  return v >= slot.answer.gte ? slot.answer.then : slot.answer.else;
}

export function countVerifiedTag(s: GameState, c: RunContent, tag: Tag): number {
  return s.verified.filter((id) => c.clues[id]?.tags.includes(tag)).length;
}

/**
 * 슬롯에 놓인 카드가 받는 반응 — 이진 정오 대신 텍스처를 준다.
 * 우선순위: 손수 misfit(감독판 개그) > 정답 hit > 드라마투르기 패턴 생성 > 슈트 폴백.
 * 오답은 comicReaction이 카드 kind × 슬롯 frame의 부조화를 코믹 패턴으로 분류·생성한다.
 */
export function reactionLine(
  def: CaseDef,
  slot: Slot,
  placedId: string,
  correct: boolean,
  s: GameState,
  c: RunContent,
): { line: string; special: boolean; pattern?: string } {
  const card = c.clues[placedId];
  const authored = def.misfits?.[slot.id]?.[placedId];
  if (authored) return { line: authored, special: true, pattern: '감독판' };
  if (correct) {
    return { line: slot.hit ?? `아귀가 맞물린다 — ${card.name}.`, special: false };
  }
  const correctCard = c.clues[resolveAnswer(slot, s)];
  const comic = comicReaction(card, slot, correctCard);
  return { line: comic.line, special: comic.special, pattern: comic.pattern };
}

function setupCase(s: GameState, c: RunContent): void {
  const def = c.cases[s.caseIndex];
  s.placed = Object.fromEntries(def.slots.map((sl) => [sl.id, null]));
  s.confirmed = {};
  s.declared = [];
  s.patternJudged = false;
  s.patternHit = null;
  s.submits = 0;
  s.lastSubmit = null;
  s.reveals = [];
  s.screen = 'case';
}

function applyTagDeltas(s: GameState, c: RunContent, cardIds: string[]): void {
  for (const id of cardIds) {
    for (const tag of c.clues[id]?.tags ?? []) {
      const d = c.tagDeltas[tag];
      s.heat = clamp(s.heat + d.heat);
      s.trust = clamp(s.trust + d.trust);
    }
  }
}

function addUnique<T>(arr: T[], items: T[]): void {
  for (const it of items) if (!arr.includes(it)) arr.push(it);
}

function pickInterlude(s: GameState, c: RunContent): void {
  for (const ev of c.interludeEvents) {
    const cond = ev.cond;
    const match =
      cond === 'default' ||
      ((cond.heatGte === undefined || s.heat >= cond.heatGte) &&
        (cond.trustGte === undefined || s.trust >= cond.trustGte) &&
        (cond.trustLt === undefined || s.trust < cond.trustLt));
    if (!match) continue;
    if (ev.bad) {
      s.ending = { kind: 'BAD', ...ev.bad };
      s.screen = 'end';
    } else {
      s.interlude = {
        eventId: ev.id, choiceId: null, result: null, revealed: [],
        ap: c.interludeAP, usedActions: [],
      };
      s.screen = 'interlude';
    }
    return;
  }
}

export function initGame(c: RunContent): GameState {
  return {
    screen: 'briefing',
    caseIndex: 0,
    heat: c.initial.heat,
    trust: c.initial.trust,
    ownedClues: [...c.starterClues],
    ownedPatterns: [...c.starterPatterns],
    verified: [],
    hints: [...c.starterHints],
    placed: {},
    confirmed: {},
    declared: [],
    patternJudged: false,
    patternHit: null,
    submits: 0,
    lastSubmit: null,
    reveals: [],
    packOffer: [],
    awaitingAdvance: false,
    interlude: null,
    ending: null,
    seq: 0,
    log: [],
    history: [],
  };
}

export function reduce(prev: GameState, a: Action, c: RunContent): GameState {
  const s: GameState = structuredClone(prev);
  s.seq++;
  const def = c.cases[s.caseIndex];

  switch (a.type) {
    case 'START': {
      setupCase(s, c);
      s.log.push(`run 시작 — ${def.title}`);
      break;
    }

    case 'PLACE': {
      if (s.screen !== 'case' || s.confirmed[a.slotId]) break;
      for (const k of Object.keys(s.placed)) {
        if (s.placed[k] === a.cardId) s.placed[k] = null; // 한 카드는 한 슬롯에만
      }
      s.placed[a.slotId] = a.cardId;
      break;
    }

    case 'CLEAR_SLOT': {
      if (s.screen !== 'case' || s.confirmed[a.slotId]) break;
      s.placed[a.slotId] = null;
      break;
    }

    case 'DECLARE': {
      if (s.screen !== 'case' || s.patternJudged) break;
      if (s.declared.includes(a.pattern)) {
        s.declared = s.declared.filter((p) => p !== a.pattern);
      } else if (s.declared.length < def.patterns.length) {
        s.declared.push(a.pattern);
      }
      break;
    }

    case 'SUBMIT': {
      if (s.screen !== 'case') break;
      const open = def.slots.filter((sl) => !s.confirmed[sl.id]);
      if (open.some((sl) => !s.placed[sl.id])) break;
      s.submits++;

      // 가설 선언 — 첫 제출에서만 판정. 적중 시 근접도 상세화 + 패턴 카드 검증.
      if (!s.patternJudged && s.declared.length > 0) {
        s.patternJudged = true;
        s.patternHit =
          s.declared.length === def.patterns.length &&
          def.patterns.every((p) => s.declared.includes(p));
        if (s.patternHit) {
          addUnique(s.verified, def.patterns);
          s.log.push(`가설 적중: ${def.patterns.join('+')} — 근접도 상세 해금`);
        } else {
          s.log.push('가설 빗나감 — 이 case에서는 재선언 불가');
        }
      }

      const rights = open.filter(
        (sl) => s.placed[sl.id] === resolveAnswer(sl, s),
      );
      // 슬롯별 반응 — 정오 판정과 같은 상태(델타 적용 전)로 계산.
      const reactions: SlotReaction[] = open.map((sl) => {
        const placedId = s.placed[sl.id]!;
        const correct = placedId === resolveAnswer(sl, s);
        const r = reactionLine(def, sl, placedId, correct, s, c);
        return { slotId: sl.id, cardId: placedId, correct, line: r.line, special: r.special, pattern: r.pattern };
      });
      const perSuit = s.patternHit
        ? SUITS.map((suit) => ({
            suit,
            placed: open.filter((sl) => c.clues[s.placed[sl.id]!]?.suit === suit).length,
            right: rights.filter((sl) => c.clues[s.placed[sl.id]!]?.suit === suit).length,
          })).filter((x) => x.placed > 0)
        : null;

      if (rights.length === open.length || rights.length >= 3) {
        const cleared = rights.length === open.length;
        const cardIds = rights.map((sl) => s.placed[sl.id]!);
        for (const sl of rights) {
          s.confirmed[sl.id] = s.placed[sl.id]!;
          s.placed[sl.id] = null;
          s.reveals = s.reveals.filter((r) => r.slotId !== sl.id);
        }
        addUnique(s.verified, cardIds); // 수사 노트 해금
        applyTagDeltas(s, c, cardIds);
        s.lastSubmit = {
          seq: s.seq, kind: cleared ? 'clear' : 'confirm',
          total: rights.length, outOf: open.length, perSuit,
          confirmedNow: cardIds, reactions,
        };
        if (cleared) {
          addUnique(s.ownedClues, def.guestClues);
          if (def.guestPattern) addUnique(s.ownedPatterns, [def.guestPattern]);
          s.history.push({ caseId: def.id, submits: s.submits, heatAfter: s.heat });
          s.log.push(`${def.title} 해결 (${s.submits}회 제출)`);
          // 라우팅은 ADVANCE로 미룬다 — 클리어 순간의 반응·영향력 피드백을 보여주기 위해.
          s.awaitingAdvance = true;
        }
      } else {
        s.heat = clamp(s.heat + 1); // 오답 제출 = 상태 오염
        s.lastSubmit = {
          seq: s.seq, kind: 'wrong',
          total: rights.length, outOf: open.length, perSuit,
          confirmedNow: [], reactions,
        };
      }
      break;
    }

    case 'HINT': {
      if (s.screen !== 'case') break;
      const idx = s.hints.indexOf(a.hintId);
      if (idx < 0 || s.confirmed[a.slotId]) break;
      const slot = def.slots.find((sl) => sl.id === a.slotId);
      if (!slot) break;
      const answer = resolveAnswer(slot, s);
      let text: string;
      if (a.hintId === 'analysis') {
        if (!s.placed[a.slotId]) break;
        text = s.placed[a.slotId] === answer ? '감식 결과: 맞다' : '감식 결과: 아니다';
      } else {
        text = `제보: 정답은 [${SUIT_LABEL[c.clues[answer].suit]}] 슈트`;
      }
      s.hints.splice(idx, 1);
      s.heat = clamp(s.heat + c.hintDefs[a.hintId].heatCost);
      s.reveals = s.reveals.filter((r) => r.slotId !== a.slotId);
      s.reveals.push({ slotId: a.slotId, text: `${text} (현재 상태 기준)` });
      break;
    }

    case 'PICK_REWARD': {
      if (s.screen !== 'reward' || !s.packOffer.includes(a.cardId)) break;
      addUnique(s.ownedClues, [a.cardId]);
      s.log.push(`보상팩: ${c.clues[a.cardId].name} 획득`);
      s.packOffer = [];
      pickInterlude(s, c);
      break;
    }

    case 'ADVANCE': {
      if (!s.awaitingAdvance) break;
      s.awaitingAdvance = false;
      if (s.caseIndex === c.cases.length - 1) {
        s.ending = {
          kind: 'GOOD',
          title: '사건부 완결',
          desc: '보스 case까지 전부 재구성했다. 수사 노트가 두꺼워졌다.',
        };
        s.screen = 'end';
      } else {
        s.packOffer = def.packPool.filter((id) => !s.ownedClues.includes(id)).slice(0, 3);
        s.screen = s.packOffer.length > 0 ? 'reward' : 'interlude';
        if (s.screen === 'interlude') pickInterlude(s, c);
      }
      break;
    }

    case 'INVESTIGATE': {
      if (s.screen !== 'interlude' || !s.interlude) break;
      const ev = c.interludeEvents.find((e) => e.id === s.interlude!.eventId);
      const lead = ev?.investigation?.find((l) => l.id === a.leadId);
      if (!lead || s.interlude.revealed.includes(lead.id)) break;
      if (s.interlude.ap < 1) break; // 행동력 부족 — 기회비용
      s.interlude.ap -= 1;
      s.interlude.revealed.push(lead.id);
      break;
    }

    case 'INTERLUDE_ACTION': {
      if (s.screen !== 'interlude' || !s.interlude) break;
      const act = c.interludeActions.find((x) => x.id === a.actionId);
      if (!act) break;
      if (act.once && s.interlude.usedActions.includes(act.id)) break;
      if (s.interlude.ap < act.cost) break; // 행동력 부족
      s.interlude.ap -= act.cost;
      s.interlude.usedActions.push(act.id);
      s.heat = clamp(s.heat + (act.effects.heat ?? 0));
      s.trust = clamp(s.trust + (act.effects.trust ?? 0));
      if (act.effects.gainHint) s.hints.push(act.effects.gainHint);
      break;
    }

    case 'INTERLUDE_CHOICE': {
      if (s.screen !== 'interlude' || !s.interlude || s.interlude.choiceId) break;
      const ev = c.interludeEvents.find((e) => e.id === s.interlude!.eventId);
      const ch = ev?.choices?.find((x) => x.id === a.choiceId);
      if (!ev || !ch) break;
      if (ch.requires && countVerifiedTag(s, c, ch.requires.tag) < ch.requires.count) break;
      s.heat = clamp(s.heat + (ch.effects.heat ?? 0));
      s.trust = clamp(s.trust + (ch.effects.trust ?? 0));
      if (ch.effects.gainHint) s.hints.push(ch.effects.gainHint);
      s.interlude.choiceId = ch.id;
      s.interlude.result = ch.result;
      break;
    }

    case 'CONTINUE': {
      if (s.screen !== 'interlude' || !s.interlude?.choiceId) break;
      s.interlude = null;
      s.caseIndex++;
      setupCase(s, c);
      s.log.push(`다음 사건 — ${c.cases[s.caseIndex].title}`);
      break;
    }

    case 'RESTART':
      return initGame(c);
  }
  return s;
}
