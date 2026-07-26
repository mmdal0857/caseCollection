<script lang="ts">
  let { trust, heat, scenes }: {
    trust: number;
    heat: number;
    scenes: { low: string; mid: string; high: string };
  } = $props();

  const band = $derived(trust < 4 ? 'low' : trust < 7 ? 'mid' : 'high');
  const scene = $derived(scenes[band]);
  const attention = $derived(Math.max(0, Math.min(1, heat / 10)));
  let failed = $state(false);
  $effect(() => {
    scene;
    failed = false;
  });
</script>

<div
  class="stage-background trust-{band}"
  style:--attention={attention}
  aria-hidden="true"
>
  {#if !failed}
    <img src={scene} alt="" onerror={() => (failed = true)} />
  {/if}
  <span class="stage-grade"></span>
</div>
