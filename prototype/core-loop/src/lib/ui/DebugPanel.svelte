<script lang="ts">
  import type { GameState } from '../engine';
  let { game }: { game: GameState } = $props();
</script>

<details class="debug">
  <summary>state</summary>
  <pre>{JSON.stringify(game, null, 1)}</pre>
</details>
