<script lang="ts">
  import { untrack } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';

  import type { AxisDef } from '../engine';

  let { heat, trust, badHeat = 8, axis, axisDef }: {
    heat: number; trust: number; badHeat?: number;
    /** v10(12 §5): case별 가변축. 없는 case면 표시하지 않는다. */
    axis?: number; axisDef?: AxisDef;
  } = $props();

  const heatT = tweened(untrack(() => heat), { duration: 500, easing: cubicOut });
  const trustT = tweened(untrack(() => trust), { duration: 500, easing: cubicOut });
  $effect(() => { heatT.set(heat); });
  $effect(() => { trustT.set(trust); });
  const elevated = $derived(heat >= badHeat - 2 || trust <= 2);
</script>

<div class="meters instrument-strip" class:elevated>
  <!-- 주목 트랙 = 은밀 ◁▷ 공개 영역 다수결. 5 넘으면 공개 우세 → 판정 규칙 전환. -->
  <div class="meter heat" class:hot={heat >= 5} class:critical={heat >= badHeat}>
    <span class="meter-label">주목</span>
    <i class="pole low" class:ahead={heat < 5}>은밀</i>
    <div class="meter-bar">
      <div class="meter-fill" style="width:{$heatT * 10}%"></div>
      <i class="tick major" style="left:50%" title="주목 5+: 공개 우세 — 문맥 규칙 전환"></i>
      <i class="tick bad" style="left:{badHeat * 10}%" title="인터루드에서 BAD"></i>
    </div>
    <i class="pole high" class:ahead={heat >= 5}>공개</i>
    {#key heat}<span class="meter-num" in:scale={{ start: 1.7, duration: 260 }}>{heat}</span>{/key}
  </div>
  <!-- 신뢰 트랙 = 강압 ◁▷ 신중. -->
  <div class="meter trust" class:low={trust < 2}>
    <span class="meter-label">신뢰</span>
    <i class="pole low" class:ahead={trust < 5}>강압</i>
    <div class="meter-bar">
      <div class="meter-fill" style="width:{$trustT * 10}%"></div>
      <i class="tick" style="left:60%" title="신뢰 6+: 좋은 일이 생긴다"></i>
    </div>
    <i class="pole high" class:ahead={trust >= 5}>신중</i>
    {#key trust}<span class="meter-num" in:scale={{ start: 1.7, duration: 260 }}>{trust}</span>{/key}
  </div>
  <!-- v10: case별 가변축(12 §5) — 재사용 풀에서 하나. 측면을 게이트한다. -->
  {#if axisDef && axis !== undefined}
    <div class="meter axis" title={axisDef.hint}>
      <span class="meter-label">{axisDef.label}</span>
      <i class="pole low">{axisDef.low}</i>
      <div class="meter-bar"><div class="meter-fill" style="width:{axis * 10}%"></div></div>
      <i class="pole high">{axisDef.high}</i>
      {#key axis}<span class="meter-num" in:scale={{ start: 1.7, duration: 260 }}>{axis}</span>{/key}
    </div>
  {/if}
</div>

<style>
  .instrument-strip {
    min-height: 48px;
    max-height: 48px;
    overflow: hidden;
    padding: 8px 14px;
    transition: max-height 240ms ease, min-height 240ms ease, background 240ms ease;
  }
  .instrument-strip.elevated {
    min-height: 72px;
    max-height: 96px;
    background: rgb(42 29 21 / 94%);
  }
  .meter.axis .meter-fill { background: linear-gradient(90deg, #4a6b7a, #7fb3d5); }
  .meter.axis .meter-label { color: #9fd3f5; }
</style>
