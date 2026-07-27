// PROTOTYPE — 한국어 조사 자동 선택. 생성 텍스트가 받침에 맞는 조사를 붙이게 한다.
// ticket 19(조사 누출 중립화)의 P0 렌더러 — 유니코드 16.0 §3.12 한글 음절 조합 정본 기반.
// 외부 조사 라이브러리(josa.js, i18next-korean-postposition-processor)는 (으)로의 ㄹ 받침
// 예외를 틀리게 구현하므로 채택하지 않는다(리서치: docs/research/2026-07-23-josa-neutralization.md).
function jong(word: string): number {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return -1; // 한글 음절이 아니면 받침 없음 취급
  return (c - 0xac00) % 28;
}
export const ga = (w: string): string => (jong(w) > 0 ? '이' : '가');
export const eun = (w: string): string => (jong(w) > 0 ? '은' : '는');
export const eul = (w: string): string => (jong(w) > 0 ? '을' : '를');
/** 로/으로 — 받침 없음 또는 ㄹ(8)은 '로', 그 외 받침은 '으로'. */
export const ro = (w: string): string => { const j = jong(w); return j <= 0 || j === 8 ? '로' : '으로'; };
/** 와/과 — 받침 없음은 '와', 받침 있으면 '과'. */
export const gwa = (w: string): string => (jong(w) > 0 ? '과' : '와');
/** 이다/다 — 서술격 조사(추리문 마지막 슬롯이 문장을 맺을 때). 받침 있으면 '이다', 없으면 '다'. */
export const ida = (w: string): string => (jong(w) > 0 ? '이다' : '다');

export type JosaKind = '이가' | '은는' | '을를' | '으로' | '와과' | '이다';
const JOSA_FN: Record<JosaKind, (w: string) => string> = {
  이가: ga, 은는: eun, 을를: eul, 으로: ro, 와과: gwa, 이다: ida,
};
/** 채워진 정답 텍스트로 조사를 계산 — 슬롯 렌더가 이걸로 배치된 카드 기준 조사를 결정한다. */
export function resolveJosa(kind: JosaKind, word: string): string {
  return JOSA_FN[kind](word);
}
/** 빈 슬롯(아직 채워지지 않음)의 조사 병기형 — 규범 근거가 가장 강한 빗금(한글 맞춤법 문장부호 해설). */
const JOSA_PLACEHOLDER: Record<JosaKind, string> = {
  이가: '이/가', 은는: '은/는', 을를: '을/를', 으로: '(으)로', 와과: '와/과', 이다: '(이)다',
};
export function josaPlaceholder(kind: JosaKind): string {
  return JOSA_PLACEHOLDER[kind];
}
