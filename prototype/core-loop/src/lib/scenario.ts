// PROTOTYPE — "위치·인접 시너지가 시나리오 구상이 되는 구조" (사용자 방향).
// 카드를 나란히 배치하면, 인접한 두 카드가 서사 링크를 맺는다.
// 사건의 인과 사슬(범인→범행→흔적/현상→기록)을 따라 흐르면 코히런트(연결어 생성),
// 거꾸로·비약하면 코믹하게 깨진다(파열). 배치의 순서·인접이 곧 시나리오 구상.
// kind(사람·사물·행위·기록·현상)의 사슬 문법 — v3 드라마투르기 어휘의 인접판.
import type { ClueCard, Kind } from './engine';
import { eul, ro } from './josa';
import { raidenAside } from './persona';

// 사건 인과의 등뼈: 행위자(0) → 범행(1) → 흔적·현상(2) → 기록(3).
const RANK: Record<Kind, number> = { 사람: 0, 행위: 1, 현상: 2, 사물: 2, 기록: 3 };
// 역방향이지만 '드러냄'으로 성립하는 예외(문서·공백이 범인을 지목).
const REVEAL = new Set<string>(['기록>사람', '현상>사람']);

// 확장성: 링크는 여러 신호를 합성한다. 지금은 (1) kind 인과 사슬 + (2) 태그 공명.
// 새 신호(슈트 사슬·시간 순서 등)를 추가해도 Link 구조는 그대로 확장 가능.
export interface Link {
  coherent: boolean;
  text: string; // 코히런트=연결어, 파열=코믹 브레이크
  pattern: string; // 링크 유형(표시용)
  resonance: boolean; // 인접 두 카드가 태그를 공유 → 결이 통함(보너스)
  strong: boolean; // 코히런트 + 공명 = 강한 링크
}

/** 두 카드가 공유하는 태그(첫 번째)를 반환 — 없으면 null. */
function sharedTag(a: ClueCard, b: ClueCard): string | null {
  return a.tags.find((t) => b.tags.includes(t)) ?? null;
}

function connectorInto(b: ClueCard): string {
  switch (b.kind) {
    case '행위': return `— ${b.name}${eul(b.name)} 저질렀고,`;
    case '사물': return `— 그 자리에 ${b.name}${eul(b.name)} 남겼으며,`;
    case '현상': return `— 그로 인해 ${b.name}${ro(b.name)} 이어졌고,`;
    case '기록': return `— 그리고 ${b.name}${ro(b.name)} 남았다.`;
    case '사람': return `— ${b.name}${eul(b.name)} 가리켰다.`;
  }
}

function breakText(a: ClueCard, b: ClueCard): string {
  let base: string;
  if (a.kind === '기록') base = `${b.name}? 종이 쪼가리가 사람을 부린 겐가.`;
  else if (a.kind === '사물' && b.kind === '사람') base = `${b.name}? 물건이 사람을 낳을 순 없지.`;
  else if (a.kind === '행위' && b.kind === '사람') base = `${b.name}? 행동이 사람을 만들진 않아.`;
  else base = `${a.name}에서 ${b.name}${ro(b.name)}? 이야기가 거꾸로 흐른다.`;
  return `${base}  ${raidenAside(a.id + b.id, true)}`; // 캐릭터 밀착: 레이든의 몸짓
}

/** 인접한 두 카드 A→B의 서사 링크. */
export function linkBetween(a: ClueCard, b: ClueCard): Link {
  const key = `${a.kind}>${b.kind}`;
  const resonance = sharedTag(a, b) != null;
  if (REVEAL.has(key)) {
    return { coherent: true, text: `— 그리고 그것이 ${b.name}${eul(b.name)} 가리켰다.`, pattern: '드러냄', resonance, strong: resonance };
  }
  if (RANK[b.kind] >= RANK[a.kind]) {
    const causal = RANK[b.kind] > RANK[a.kind];
    const pattern = resonance ? '강한 인과' : causal ? '인과' : '병렬';
    return { coherent: true, text: connectorInto(b), pattern, resonance, strong: resonance };
  }
  return { coherent: false, text: breakText(a, b), pattern: '비약', resonance: false, strong: false };
}

export interface ScenarioReadout {
  /** 조립된 시나리오 문장(코히런트 구간). */
  lines: { text: string; broken: boolean }[];
  linksTotal: number;
  linksCoherent: number;
}

/** 배치된 카드열을 시나리오로 조립 — 인접 링크를 이어 서사를 만든다. */
export function composeScenario(cards: (ClueCard | null)[]): ScenarioReadout {
  const placed = cards.filter((c): c is ClueCard => c != null);
  const lines: { text: string; broken: boolean }[] = [];
  let total = 0;
  let coherent = 0;
  if (placed.length === 0) return { lines, linksTotal: 0, linksCoherent: 0 };
  lines.push({ text: `${placed[0].name}에서 시작한다.`, broken: false });
  for (let i = 1; i < placed.length; i++) {
    const link = linkBetween(placed[i - 1], placed[i]);
    total++;
    if (link.coherent) coherent++;
    lines.push({ text: link.text, broken: !link.coherent });
  }
  return { lines, linksTotal: total, linksCoherent: coherent };
}

// ── 재확인성 ─────────────────────────────────────────────────────────────
// 사건이 '성립'하려면 밟아야 하는 골격 비트(순서 있는 kind). 조립한 시나리오를
// 이 진실 골격에 재확인(검토)한다 — 세운 이론을 되짚어 검증하는 탐정 루프.
export const CRIME_SKELETON: { kind: Kind; label: string }[] = [
  { kind: '사람', label: '범인' },
  { kind: '행위', label: '범행' },
  { kind: '사물', label: '흔적' }, // 현상도 같은 등급으로 인정
  { kind: '기록', label: '증거' },
];

export interface Verdict {
  verdict: '성립' | '미흡' | '반증';
  coherentLinks: number;
  totalLinks: number;
  /** 첫 파열 링크의 인덱스(placed 기준, 없으면 -1). */
  weakestLink: number;
  beatsHit: number;
  beatsTotal: number;
  notes: string[];
}

/** 조립된 시나리오를 진실 골격에 재확인 — 성립/미흡/반증 판정 + 약한 고리 지목. */
export function verifyScenario(cards: (ClueCard | null)[]): Verdict {
  const placed = cards.filter((c): c is ClueCard => c != null);
  const readout = composeScenario(cards);
  const notes: string[] = [];

  // 첫 파열 링크 지목
  let weakest = -1;
  for (let i = 1; i < placed.length; i++) {
    if (!linkBetween(placed[i - 1], placed[i]).coherent) { weakest = i; break; }
  }

  // 골격 비트를 순서대로(subsequence) 얼마나 밟았나
  let beat = 0;
  for (const c of placed) {
    if (beat >= CRIME_SKELETON.length) break;
    const want = CRIME_SKELETON[beat].kind;
    const ok = c.kind === want || (want === '사물' && c.kind === '현상');
    if (ok) beat++;
  }
  const beatsHit = beat;

  if (placed.length === 0) notes.push('아직 아무것도 놓지 않았다.');
  if (placed.length > 0 && placed[0].kind !== '사람') notes.push('범인(사람)에서 시작하지 않았다.');
  if (placed.length > 0 && placed[placed.length - 1].kind !== '기록') notes.push('증거(기록)로 매듭짓지 않았다.');
  if (weakest >= 0) notes.push(`${placed[weakest - 1].name} → ${placed[weakest].name}에서 이야기가 끊긴다.`);
  if (beatsHit < CRIME_SKELETON.length) {
    const missing = CRIME_SKELETON.slice(beatsHit).map((b) => b.label).join('·');
    notes.push(`아직 못 짚은 골격: ${missing}.`);
  }

  const allCoherent = readout.linksTotal > 0 && readout.linksCoherent === readout.linksTotal;
  let verdict: Verdict['verdict'];
  if (weakest >= 0) verdict = '반증'; // 모순되는 고리가 있으면 반증
  else if (allCoherent && beatsHit === CRIME_SKELETON.length) verdict = '성립';
  else verdict = '미흡';

  return {
    verdict,
    coherentLinks: readout.linksCoherent,
    totalLinks: readout.linksTotal,
    weakestLink: weakest,
    beatsHit,
    beatsTotal: CRIME_SKELETON.length,
    notes,
  };
}
