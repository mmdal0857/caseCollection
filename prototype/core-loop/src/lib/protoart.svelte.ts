// PROTOTYPE — 티켓 13 아트 스타일·프레임 시안 스위처. **THROWAWAY** (스타일 확정 시 삭제).
// 08 §⑦ "스타일 키 우선"에 따라, 두 장의 스트레스 대상 카드에만 시안 아트를 물려
// 실제 카드·실제 손패 밀도 안에서 판단한다(프로토 스킬 UI 서브셰이프 A).
//
// 대상 2장이 스트레스 테스트인 이유:
//   thread_fiber   — 12 §1의 대표 다면 카드(침입도구/접촉증거/신분단서). 아트가 한 얼굴에
//                    시각적으로 커밋해버리면 "다면성 발견"이라는 재미를 아트가 죽인다.
//   omitted_witness — 존재하지 않는 것(증언의 공백)을 그리는 문제. behavioral 6종의 최악 케이스.
//                    이걸 그릴 수 있는 스타일이면 49종을 그릴 수 있다.

export type ArtStyle = 'A' | 'B' | 'C' | 'D' | 'off';
export type ArtFrame = 'band' | 'full' | 'plate';
/**
 * 태그 처리 — 사용자 방향(2026-07-25) "포함하고 있는 태그의 이미지들이 결합되어야".
 *
 * 실측(content.ts): 카드 20종에 얼굴 55개인데 **태그 조합은 7종뿐**이고
 * 그중 5종(논리18·은밀13·공개10·신중7·강압5)이 55개 중 53개를 덮는다.
 * → 태그를 **생성**하면 얼굴 수(≈150)만큼 이미지가 필요하지만,
 *   태그를 **계산**하면 카드 수(49) 이미지 + 처리 5종이면 끝난다.
 * 여기서는 그 "계산된 형용사"가 실제로 읽히는지를 본다(생성본과 나란히 비교).
 */
export type ArtTreat = 'off' | 'stealth' | 'exposed' | 'logic' | 'force' | 'prudence';

export const STYLE_LABEL: Record<ArtStyle, string> = {
  A: '플랫 셀 누아르 (레이든 계승)',
  B: '에칭 도감 플레이트',
  C: '증거 사진',
  D: '실루엣 스팟컬러',
  off: '아트 없음 (현행 이모지)',
};

export const FRAME_LABEL: Record<ArtFrame, string> = {
  band: '밴드 — 상단 띠, 텍스트 우위',
  full: '전면 — 아트가 카드 전체, 텍스트 오버레이',
  plate: '액자 — 표본 플레이트 + 여백',
};

export const TREAT_LABEL: Record<ArtTreat, string> = {
  off: '태그 처리 없음 (사물만)',
  stealth: '은밀 — 삼켜진 어둠 + 찬 림라이트',
  exposed: '공개 — 정면 플래시, 날아간 하이라이트',
  logic: '논리 — 제도 격자 + 계측 눈금',
  force: '강압 — 붉은 압력 + 사선 전단',
  prudence: '신중 — 채도 억제, 정돈된 온기',
};

const SUBJECT: Record<string, string> = {
  thread_fiber: 's1_thread',
  omitted_witness: 's2_absence',
};

function readParam<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const v = new URLSearchParams(window.location.search).get(key) as T | null;
  return v !== null && allowed.includes(v) ? v : fallback;
}

// 사용자 판단(2026-07-25): 스타일 A(플랫 셀 누아르) + 전면 프레임.
export const proto = $state({
  style: readParam<ArtStyle>('artstyle', ['A', 'B', 'C', 'D', 'off'], 'A'),
  frame: readParam<ArtFrame>('frame', ['band', 'full', 'plate'], 'full'),
  treat: readParam<ArtTreat>('treat', ['off', 'stealth', 'exposed', 'logic', 'force', 'prudence'], 'off'),
  /** true면 태그 처리를 **생성본**으로(이미지 교체), false면 **계산본**으로(CSS 오버레이). */
  baked: readParam<'gen' | 'css'>('treatmode', ['gen', 'css'], 'css') === 'gen',
});

export function setProto(style: ArtStyle, frame: ArtFrame, treat = proto.treat, baked = proto.baked): void {
  proto.style = style;
  proto.frame = frame;
  proto.treat = treat;
  proto.baked = baked;
  const q = new URLSearchParams(window.location.search);
  q.set('artstyle', style);
  q.set('frame', frame);
  q.set('treat', treat);
  q.set('treatmode', baked ? 'gen' : 'css');
  history.replaceState(null, '', `${window.location.pathname}?${q}`);
}

/** 태그 처리 **생성본**이 존재하는 조합 — 계산본(CSS)과 나란히 비교하기 위한 대조군. */
const BAKED: Record<string, Partial<Record<ArtTreat, string>>> = {
  thread_fiber: {
    off: 'tag_thread_plain',
    stealth: 'tag_thread_stealth',
    logic: 'tag_thread_logic',
  },
  rope_mark: { force: 'tag_rope_force_logic', logic: 'tag_rope_force_logic' },
  tod_gap: { logic: 'tag_todgap_logic' },
};

/** 이 카드에 물릴 시안 아트 경로. 시안이 없는 카드는 null → 슈트 폴백(04의 폴백 슬롯 검증). */
export function artFor(cardId: string): string | null {
  if (proto.style === 'off') return null;

  // 생성본 모드: 태그까지 구워진 이미지가 있으면 그걸 쓴다.
  if (proto.baked) {
    const baked = BAKED[cardId]?.[proto.treat];
    if (baked !== undefined) return `/protoart/${baked}.png`;
  }
  // 계산본 모드: 태그 무관하게 **중립 사물** 1장을 쓰고 처리는 CSS가 얹는다.
  // 바탕이 흰 종이면 어둡게 깎아도 회색 죽이 된다 — 중립 사물은 **평평한 근-흑색 바탕**에
  // 생성해야 계산된 처리가 먹는다(1차 시도 tag_thread_plain의 실패 원인).
  if (!proto.baked && cardId === 'thread_fiber') return '/protoart/tag_thread_base.png';

  const subject = SUBJECT[cardId];
  if (subject === undefined) return null;
  return `/protoart/style${proto.style}_${subject}.png`;
}

/** 계산본 모드에서 아트 위에 얹을 처리 클래스. 생성본 모드에선 비활성. */
export function treatClass(): string {
  return !proto.baked && proto.treat !== 'off' ? `treat-${proto.treat}` : '';
}
