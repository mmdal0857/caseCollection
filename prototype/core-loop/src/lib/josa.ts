// PROTOTYPE — 한국어 조사 자동 선택. 생성 텍스트가 받침에 맞는 조사를 붙이게 한다.
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
