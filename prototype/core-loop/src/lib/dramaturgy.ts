// PROTOTYPE — 오답 코미디의 "드라마투르기 패턴화".
// 손으로 개그를 하나씩 쓰는 대신, 오답이 "왜 틀렸나"의 구조(카드 kind × 슬롯 frame의 부조화)를
// 코믹 패턴으로 분류하고 템플릿으로 반응을 생성한다. 모든 조합이 구조화된 코미디로 커버됨.
// 이것이 문맥 태그 의미론(티켓 12)이 규칙으로 반응을 만드는 방식의 프로토.
import type { ClueCard, Slot } from './engine';
import { SUIT_LABEL } from './engine';
import { eun, ga, ro } from './josa';
import { raidenAside } from './persona';

export interface ComicHit {
  line: string;
  pattern: string; // 드라마투르기 패턴명 (표시용)
  special: boolean; // 구조화된 코믹 패턴(true) vs 슈트 폴백(false)
}

interface Ctx {
  card: ClueCard; // 놓인(틀린) 카드
  slot: Slot; // 대상 슬롯
  correct: ClueCard; // 이 슬롯의 정답 카드(현재 상태 기준)
}

const P = (pattern: string, line: string): ComicHit => ({ line, pattern, special: true });

/** ① 정반대 — 슬롯이 배격하는 태그를 가진 카드. 최우선. */
function opposition(ctx: Ctx): ComicHit | null {
  const avoid = ctx.slot.role?.avoidTags;
  if (!avoid) return null;
  const hit = avoid.find((t) => ctx.card.tags.includes(t));
  if (!hit) return null;
  return P('정반대', `${ctx.card.name}? ‘${hit}’은 ${ctx.slot.role?.quality ?? '이 자리가 원하는 것'}의 정반대일세.`);
}

/** ② frame × kind 부조화 — 구조화된 코미디의 본체. */
function byFrame(ctx: Ctx): ComicHit | null {
  const { card, slot } = ctx;
  const k = card.kind;
  const n = card.name;
  const noun = slot.role?.noun;
  switch (slot.role?.frame) {
    case 'route':
      if (k === '사물' || k === '현상') return P('행위자 오귀속', `${n}${ga(n)} 제 발로 드나들었다는 건가? 그건 통로가 아닐세.`);
      if (k === '기록') return P('엉뚱한 매체', `종이 한 장이 어떻게 사람을 들이고 낸단 말인가.`);
      if (k === '사람') return P('범주 오류', `사람이 길이 될 수는 없지 — 통로를 가져오게.`);
      if (k === '행위') return P('범주 오류', `${n}은 행동이지, 드나든 길이 아닐세.`);
      break;
    case 'means':
      if (k === '기록') return P('문자적 과장', `종이로 사람을 죽였다? 베기라도 했다는 건가.`);
      if (k === '사물' || k === '현상') return P('문자적 과장', `${n}${ro(n)} 사람을 죽였다 — 흉기치고는 상상력이 필요하군.`);
      if (k === '사람') return P('범주 오류', `사람은 용의자지 흉기가 아닐세.`);
      if (k === '행위') return P('범주 오류', `${n}은 행동일 뿐, 손에 쥐는 흉기가 아니네.`);
      break;
    case 'trace':
      if (k === '사람') return P('범주 오류', `그건 ${noun ?? '흔적'}이 아니라 사람일세. 손에 쥘 걸 가져오게.`);
      if (k === '행위') return P('범주 오류', `행동은 자국을 남기지 않아. 남은 걸 가져오게.`);
      if (k === '기록') return P('엉뚱한 매체', `문서는 ${noun ?? '흔적'}이라기엔 너무 말끔하군.`);
      break;
    case 'action':
      if (k === '사물' || k === '현상') return P('행위자 오귀속', `물건은 스스로 움직이지 않아 — 누가 무엇을 했는지를 보게.`);
      if (k === '사람') return P('범주 오류', `사람만으론 부족해. 그가 ‘무엇을 했는지’가 단서일세.`);
      if (k === '기록') return P('엉뚱한 매체', `장부에 행동이 적혀 있진 않네.`);
      break;
    case 'motive':
      if (k === '사물' || k === '현상') return P('범주 오류', `${n}${ga(n)} 사람을 움직일 동기가 되나?`);
      if (k === '사람') return P('범주 오류', `동기는 마음에 있지, 사람 자체가 아닐세.`);
      break;
    case 'record':
      if (k === '사물' || k === '현상' || k === '행위') return P('규모 부조화', `${n}${ro(n)} 마지막 못을 박기엔 좀 약하다.`);
      if (k === '사람') return P('범주 오류', `사람을 증서처럼 들이밀 순 없네.`);
      break;
    case 'omission':
      if (k === '사물' || k === '기록') return P('범주 오류', `물건에 구멍이 난 게 아니라, 증언에 구멍이 난 걸세.`);
      if (k === '행위') return P('범주 오류', `누가 ‘보이지 않았는지’를 묻고 있네.`);
      break;
    case 'scene':
      if (k === '사람') return P('범주 오류', `현장은 물건들이 꾸미지, 사람이 아닐세.`);
      if (k === '현상' || k === '기록') return P('규모 부조화', `${n}${ga(n)} 무대를 꾸몄다기엔 초라하군.`);
      break;
    case 'identity':
      if (k === '사물' || k === '기록') return P('범주 오류', `물건은 사람을 숨겨주지 않아.`);
      if (k === '행위') return P('엇갈린 결', `${n}${eun(n)} 눈에 띄는 행동일세. 숨는 것과는 정반대야.`);
      break;
  }
  return null;
}

/** ③ 슈트 폴백 — frame이 없거나 매칭 안 될 때. 구조는 없지만 방향은 준다. */
function suitFallback(ctx: Ctx): ComicHit {
  if (ctx.card.suit === ctx.correct.suit) {
    return { line: `${ctx.card.name}… 결은 비슷한데 마지막 이가 안 맞는다.`, pattern: '근접', special: false };
  }
  return {
    line: `${ctx.card.name}? ${SUIT_LABEL[ctx.card.suit]} 자료를 ${SUIT_LABEL[ctx.correct.suit]} 자리에 끼운 격이다.`,
    pattern: '엇갈린 결',
    special: false,
  };
}

// 가장 어이없는 패턴엔 레이든의 몸짓(harsh)을, 나머지 구조 패턴엔 붙이지 않는다.
const HARSH = new Set(['범주 오류', '행위자 오귀속', '문자적 과장']);

/** 오답 카드에 대한 코믹 반응 — 정반대 > frame×kind > 슈트 폴백. 레이든 페르소나 비트 부착. */
export function comicReaction(card: ClueCard, slot: Slot, correct: ClueCard): ComicHit {
  const hit = opposition({ card, slot, correct }) ?? byFrame({ card, slot, correct }) ?? suitFallback({ card, slot, correct });
  if (HARSH.has(hit.pattern)) {
    hit.line += `  ${raidenAside(card.id + slot.id, true)}`;
  }
  return hit;
}
