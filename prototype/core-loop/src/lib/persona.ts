// PROTOTYPE — "캐릭터에 달라붙는 유머" (사용자 방향).
// 반응이 익명 내레이션이 아니라 '레이든이 반응하는 것'으로 느껴지게 하는 페르소나 층.
// 레이든: 38세, 지쳐 있고 건조하며 능청스러운 탐정. 어이없는 추리엔 몸짓으로 대꾸한다.
// (프로토용 페르소나 — 정식은 OUT 위키 raiden.md의 speech_style·personality_tags 반영 예정.)

export const RAIDEN = '레이든';

// 어이없음의 강도에 따라 붙는 레이든의 반응 비트. 결정론적으로 골라 리렌더 안정.
const ASIDES_MILD = [
  '레이든은 안경을 고쳐 썼다.',
  '레이든은 수첩 모서리를 접었다.',
  '레이든은 잠시 창밖을 봤다.',
  '레이든은 커피가 식은 걸 알아챘다.',
];
const ASIDES_HARSH = [
  '레이든은 파이프에 불을 붙였다. 긴 하루가 되겠군.',
  '레이든은 한숨을 삼키고 다음 카드를 기다렸다.',
  '레이든은 수첩을 덮었다가, 다시 폈다.',
  '레이든은 관자놀이를 눌렀다. 이런 조수는 처음이었다.',
  '레이든은 아무 말 없이 그 카드를 도로 밀어놨다.',
];

function pick(pool: string[], seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

/** 어이없는 배치에 레이든의 몸짓 한 줄을 덧붙인다. harsh=심한 비약/범주오류. */
export function raidenAside(seed: string, harsh: boolean): string {
  return pick(harsh ? ASIDES_HARSH : ASIDES_MILD, seed);
}
