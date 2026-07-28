<script lang="ts">
  import type { SnapshotIssue } from '../run-session';

  let {
    canContinue,
    snapshotIssue,
    collectionIssue,
    onnew,
    oncontinue,
    oncollection,
  }: {
    canContinue: boolean;
    snapshotIssue: SnapshotIssue | null;
    collectionIssue: string | null;
    onnew: () => void;
    oncontinue: () => void;
    oncollection: () => void;
  } = $props();
</script>

<main class="home-screen">
  <p class="eyebrow">CASE COLLECTION</p>
  <h1>사건은 끝나도<br />수사 노트는 남는다.</h1>
  <p class="home-lede">
    카드를 집고, 측면을 고르고, 빈칸에 놓아 하나의 이론을 만드십시오.
  </p>

  {#if snapshotIssue}
    <aside class="storage-warning" role="alert">
      <b>저장된 run을 복구하지 못했습니다.</b>
      <span>{snapshotIssue.message}</span>
      <span>원문은 보존했습니다. 새 수사를 선택하면 확인 후 교체합니다.</span>
    </aside>
  {/if}
  {#if collectionIssue}
    <aside class="storage-warning" role="alert">
      <b>컬렉션 저장을 읽지 못했습니다.</b>
      <span>{collectionIssue}</span>
    </aside>
  {/if}

  <nav class="home-actions" aria-label="시작 메뉴">
    <button class="primary home-primary" onclick={onnew}>새 수사</button>
    {#if canContinue}
      <button onclick={oncontinue}>이어하기</button>
    {/if}
    <button class="secondary" onclick={oncollection}>컬렉션</button>
  </nav>
</main>
