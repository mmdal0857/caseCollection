<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';

  let { heat, trust, badHeat = 8 }: { heat: number; trust: number; badHeat?: number } = $props();

  const heatT = tweened(heat, { duration: 500, easing: cubicOut });
  const trustT = tweened(trust, { duration: 500, easing: cubicOut });
  $effect(() => { heatT.set(heat); });
  $effect(() => { trustT.set(trust); });
</script>

<div class="meters">
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
</div>
