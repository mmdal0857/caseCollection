<script lang="ts">
  import type { CollectionLoadResult } from '../collection';
  import type { SnapshotIssue } from '../run-session';

  const collectionIssueCopy = {
    CORRUPT_JSON: '컬렉션 저장 데이터가 손상되었습니다.',
    FUTURE_VERSION: '현재 버전에서 읽을 수 없는 컬렉션 저장 데이터입니다.',
    INCOMPATIBLE_FORMAT: '호환되지 않는 컬렉션 저장 데이터 형식입니다.',
    STATE_INVALID: '저장된 컬렉션 상태가 유효하지 않습니다.',
  } satisfies Record<NonNullable<CollectionLoadResult['issue']>, string>;

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
    collectionIssue: CollectionLoadResult['issue'];
    onnew: () => void;
    oncontinue: () => void;
    oncollection: () => void;
  } = $props();
</script>

<main class="home-screen">
  <p class="eyebrow">단서수집가</p>
  <h1>사건은 끝나도<br />수사 노트는 남는다.</h1>
  <p class="home-lede">
    카드를 집고, 측면을 고르고, 빈칸에 놓아 하나의 이론을 만드십시오.
  </p>

  {#if snapshotIssue}
    <aside class="storage-warning" role="alert">
      <b>저장된 수사 기록을 복구하지 못했습니다.</b>
      <span>{snapshotIssue.message}</span>
      <span>원문은 보존했습니다. 새 수사를 선택하면 확인 후 교체합니다.</span>
    </aside>
  {/if}
  {#if collectionIssue}
    <aside class="storage-warning" role="alert">
      <b>컬렉션 저장을 읽지 못했습니다.</b>
      <span>{collectionIssueCopy[collectionIssue]}</span>
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
