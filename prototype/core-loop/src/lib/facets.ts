// PROTOTYPE — throwaway (ticket 17: 문맥 태그 의미론 프로토타입).
// 질문: 티켓 12가 종이 위로 확정한 "측면(facet) 의미론"이 실제로 재미있는가.
//   ① 배치=수(즉시 확정)가 포석의 재미인가, 실험을 막는 답답함인가  ← 1번 질문
//   ② 한 카드가 여러 측면을 갖는 게 발견인가 혼란인가
//   ③ 아는 측면만 쓰는 어휘 게이트가 성장감인가 답답함인가
//   ④ 앞→뒤 단방향 전파 + 되돌리기 연쇄 해제가 긴장인가 좌절인가
//
// 이 모듈은 순수하다 — UI·상태 저장 없음. 측면의 "합법성"만 판정한다.
// 확정 시점(LockMode)은 engine이 쥐고, 이 모듈은 주어진 문맥에서 무엇이 가능한지만 답한다.
// 검증되면 이 모듈이 실제 코드로 승격될 후보(콘텐츠 검증기 겸용 — 12 §8 파이프라인).

import type { SlotFrame, Tag } from './engine';

/** 측면이 열리는 배경 상태 조건 — 12 §2 "배경 상태가 쓸 수 있는 측면을 게이트한다". */
export interface FacetGate {
  stat: 'heat' | 'trust' | 'axis';
  gte?: number;
  lt?: number;
  /** 왜 막혔는지 — 플레이어에게 보여줄 한 줄(보이는 위험은 전략, 안 보이는 위험은 함정). */
  why: string;
}

/**
 * 카드의 한 측면 — `(frame, 의미)` 쌍. 12 §1.
 * 같은 카드가 사건에 따라 다른 것이 된다: 실·섬유가 밀실선 침입 도구, 투명인간선 신분 단서.
 */
export interface Facet {
  /** `<cardId>:<frame>` — 노트 해금·게스트 대여의 식별자. */
  key: string;
  frame: SlotFrame;
  /** 이 측면으로 읽었을 때 카드가 "무엇인가" — 짧은 명사구. */
  meaning: string;
  /** 확정 보상으로 열리는 수사 노트 텍스트. */
  note: string;
  /** ★ 측면마다 태그가 다르다 — 어떤 측면으로 쓰느냐가 트랙을 미는 방향을 바꾼다(12 §6 경로 1). */
  tags: Tag[];
  /** 배경 상태 게이트. */
  gate?: FacetGate;
  /**
   * 이웃이 의미를 만든다(12 §2, 주 경로) — 앞 슬롯에 확정된 측면의 frame이 이 목록에 있어야
   * 이 측면으로 읽힌다. 생략하면 앞 문맥과 무관하게 읽히는 "자명한" 측면.
   * 앞→뒤 단방향이라 순환이 없다.
   */
  needsPrev?: SlotFrame[];
  /** 두루마리에 새겨질 서사 한 줄(12 §3 확정 보상). */
  line?: string;
}

/** 측면을 못 쓰는 이유 — UI가 그대로 보여준다. */
export type FacetBlock = 'unknown' | 'gate' | 'prev';

export interface FacetVerdict {
  facet: Facet;
  usable: boolean;
  block?: FacetBlock;
  why?: string;
  /** 이 슬롯의 역할과 frame이 일치하는가 — 일치해야 정답이 될 수 있다. */
  fitsRole: boolean;
}

/** 측면 합법성 판정에 필요한 문맥 전부. 순수 입력 — 여기 없는 건 판정에 쓰이지 않는다. */
export interface FacetCtx {
  heat: number;
  trust: number;
  axis: number;
  /**
   * 앞 슬롯이 이 슬롯에 물려준 frame. null = "미정"(앞이 비었거나 아직 확정 안 됨) —
   * 결함이 아니라 아직 커밋하지 않았다는 정직한 표시(12 §2). 미정이면 제약 없음.
   */
  prevFrame: SlotFrame | null;
  /** 아는 측면 key — 보유 ≠ 앎(12 §4). */
  known: ReadonlySet<string>;
  /** 게스트가 이 사건에서만 빌려준 측면 key. */
  lent: ReadonlySet<string>;
}

function gateOpen(g: FacetGate, ctx: FacetCtx): boolean {
  const v = g.stat === 'heat' ? ctx.heat : g.stat === 'trust' ? ctx.trust : ctx.axis;
  if (g.gte !== undefined && v < g.gte) return false;
  if (g.lt !== undefined && v >= g.lt) return false;
  return true;
}

/**
 * 이 측면을 지금 이 슬롯에서 쓸 수 있는가.
 * 막는 순서가 곧 우선순위: 모르는 측면 > 상태 게이트 > 이웃 제약.
 */
export function facetStatus(f: Facet, slotFrame: SlotFrame | null, ctx: FacetCtx): FacetVerdict {
  const fitsRole = slotFrame === null || f.frame === slotFrame;
  if (!ctx.known.has(f.key) && !ctx.lent.has(f.key)) {
    return { facet: f, usable: false, block: 'unknown', why: '아직 모르는 측면 — 수사 노트에 없다', fitsRole };
  }
  if (f.gate && !gateOpen(f.gate, ctx)) {
    return { facet: f, usable: false, block: 'gate', why: f.gate.why, fitsRole };
  }
  if (f.needsPrev && (ctx.prevFrame === null || !f.needsPrev.includes(ctx.prevFrame))) {
    return {
      facet: f,
      usable: false,
      block: 'prev',
      why:
        ctx.prevFrame === null
          ? '앞이 미정 — 이 해석은 앞 문맥이 확정되어야 열린다'
          : '앞 문맥이 다른 이야기를 하고 있다',
      fitsRole,
    };
  }
  return { facet: f, usable: true, fitsRole };
}

/** 카드의 모든 측면을 판정 — 쓸 수 있는 것 먼저, 그 중 역할 일치가 먼저. */
export function readFacets(facets: Facet[], slotFrame: SlotFrame | null, ctx: FacetCtx): FacetVerdict[] {
  return facets
    .map((f) => facetStatus(f, slotFrame, ctx))
    .sort((a, b) => Number(b.usable) - Number(a.usable) || Number(b.fitsRole) - Number(a.fitsRole));
}

/**
 * 해석 공간 — 지금 이 슬롯에서 열려 있는 frame 집합(12 §3 "앞으로 전파되어 열고 닫음").
 * 포석이 눈에 보이려면 이게 UI에 떠 있어야 한다.
 */
export function interpretationSpace(
  allFacets: Facet[],
  ctx: FacetCtx,
): { open: SlotFrame[]; closed: { frame: SlotFrame; block: FacetBlock }[] } {
  const open = new Set<SlotFrame>();
  const closed = new Map<SlotFrame, FacetBlock>();
  for (const f of allFacets) {
    const v = facetStatus(f, null, ctx);
    if (v.usable) open.add(f.frame);
    else if (!closed.has(f.frame)) closed.set(f.frame, v.block!);
  }
  for (const fr of open) closed.delete(fr);
  return {
    open: [...open],
    closed: [...closed.entries()].map(([frame, block]) => ({ frame, block })),
  };
}

/**
 * 확정 시점 — 이 프로토의 1번 질문. 런타임 토글로 같은 판에서 비교한다.
 * - immediate: 12의 제안. 놓으면 즉시 확정되고 앞으로 전파. 되돌리기는 대가(주목)+연쇄 해제.
 * - commit:    절충안. 놓는 건 "가늠"(자유), 따로 [확정] 버튼을 눌러야 확정된다. 가늠은 전파하지 않는다.
 * - submit:    11의 판단. 제출 전까지 전부 유동 — 옮길 때마다 의미가 실시간으로 다시 읽힌다.
 */
export type LockMode = 'immediate' | 'commit' | 'submit';

export const LOCK_MODES: { id: LockMode; label: string; desc: string; origin: string }[] = [
  {
    id: 'immediate',
    label: '즉시 확정',
    desc: '놓는 순간 측면이 확정된다. 되돌리면 주목 +1 + 뒤가 연쇄 해제.',
    origin: '티켓 12 §3 (배치=수)',
  },
  {
    id: 'commit',
    label: '가늠 → 확정',
    desc: '놓는 건 자유(가늠). [확정]을 눌러야 확정되고 전파한다. 가늠은 다음 슬롯을 열지 않는다.',
    origin: '절충안 (17이 지목)',
  },
  {
    id: 'submit',
    label: '제출 시 확정',
    desc: '제출 전까지 전부 유동. 카드를 옮길 때마다 앞뒤 의미가 실시간으로 다시 읽힌다.',
    origin: '티켓 11 v6의 판단',
  },
];

/** 가늠(미확정) 배치가 뒤 슬롯의 해석을 규정하는가 — submit 모드에서만 참(실시간 재해석). */
export function provisionalPropagates(mode: LockMode): boolean {
  return mode === 'submit';
}
