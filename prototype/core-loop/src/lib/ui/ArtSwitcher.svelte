<script lang="ts">
  // PROTOTYPE — 티켓 13 시안 스위처. **THROWAWAY** (스타일·프레임 확정 시 이 파일째 삭제).
  import {
    proto, setProto, STYLE_LABEL, FRAME_LABEL, TREAT_LABEL,
    type ArtStyle, type ArtFrame, type ArtTreat,
  } from '../protoart.svelte';

  const STYLES: ArtStyle[] = ['A', 'B', 'C', 'D', 'off'];
  const FRAMES: ArtFrame[] = ['band', 'plate', 'full'];
  const TREATS: ArtTreat[] = ['off', 'stealth', 'exposed', 'logic', 'force', 'prudence'];

  function cycle<T>(list: T[], cur: T, dir: number): T {
    const i = (list.indexOf(cur) + dir + list.length) % list.length;
    return list[i];
  }
  const stepStyle = (d: number) => setProto(cycle(STYLES, proto.style, d), proto.frame);
  const stepFrame = (d: number) => setProto(proto.style, cycle(FRAMES, proto.frame, d));
  const stepTreat = (d: number) => setProto(proto.style, proto.frame, cycle(TREATS, proto.treat, d));
  const toggleMode = () => setProto(proto.style, proto.frame, proto.treat, !proto.baked);

  function onkey(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    if (t !== null && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepStyle(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); stepStyle(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); stepFrame(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepFrame(1); }
    else if (e.key === '[') { e.preventDefault(); stepTreat(-1); }
    else if (e.key === ']') { e.preventDefault(); stepTreat(1); }
    else if (e.key === '\\') { e.preventDefault(); toggleMode(); }
  }
</script>

<svelte:window onkeydown={onkey} />

<div class="art-switcher">
  <div class="row">
    <button onclick={() => stepStyle(-1)} aria-label="이전 스타일">←</button>
    <span class="label"><b>스타일 {proto.style}</b> — {STYLE_LABEL[proto.style]}</span>
    <button onclick={() => stepStyle(1)} aria-label="다음 스타일">→</button>
  </div>
  <div class="row sub">
    <button onclick={() => stepFrame(-1)} aria-label="이전 프레임">↑</button>
    <span class="label">{FRAME_LABEL[proto.frame]}</span>
    <button onclick={() => stepFrame(1)} aria-label="다음 프레임">↓</button>
  </div>
  <div class="row sub">
    <button onclick={() => stepTreat(-1)} aria-label="이전 태그 처리">[</button>
    <span class="label">{TREAT_LABEL[proto.treat]}</span>
    <button onclick={() => stepTreat(1)} aria-label="다음 태그 처리">]</button>
  </div>
  <div class="row sub">
    <button class="wide" onclick={toggleMode}>
      태그 처리 = {proto.baked ? '생성본 (이미지에 구움)' : '계산본 (CSS 오버레이)'} — 눌러서 전환
    </button>
  </div>
  <p class="hint">
    ← → 스타일 · ↑ ↓ 프레임 · <b>[ ]</b> 태그 · <b>\</b> 생성본↔계산본<br />
    태그 비교는 <b>실·섬유 잔재</b>에서 보세요 (무태그 / 은밀 / 논리 생성본 보유)
  </p>
</div>

<style>
  .art-switcher {
    position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 90;
    background: #f4efe2; color: #14120f; border-radius: 12px; padding: 8px 10px;
    box-shadow: 0 8px 26px rgb(0 0 0 / 55%); font-size: 12px; min-width: 330px;
  }
  .row { display: flex; align-items: center; gap: 8px; }
  .row.sub { margin-top: 4px; opacity: 0.82; }
  .label { flex: 1; text-align: center; }
  button {
    border: 1px solid #14120f; background: #14120f; color: #f4efe2;
    border-radius: 6px; width: 26px; height: 24px; cursor: pointer; font-size: 13px; line-height: 1;
  }
  button:hover { background: #3a332a; }
  button.wide { width: 100%; height: auto; padding: 4px 8px; font-size: 11px; }
  .hint { margin: 6px 0 0; text-align: center; font-size: 10px; opacity: 0.6; }
</style>
