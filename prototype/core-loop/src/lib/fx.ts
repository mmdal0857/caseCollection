// PROTOTYPE — 손↔슬롯 카드 이동용 crossfade (Svelte 내장만 사용 — juice 검증 항목 ④).
import { crossfade } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

export const [send, receive] = crossfade({
  duration: 260,
  easing: cubicOut,
  fallback(node) {
    void node;
    return {
      duration: 200,
      easing: cubicOut,
      css: (t) => `opacity: ${t}; transform: scale(${0.85 + 0.15 * t});`,
    };
  },
});
