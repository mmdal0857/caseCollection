<script lang="ts">
  import type { CollectionStateV1 } from '../collection';
  import { collectionProgress } from '../collection';
  import type { GameState, RunContent } from '../engine';

  let { game, content, collection, onhome, oncollection }: {
    game: GameState;
    content: RunContent;
    collection: CollectionStateV1;
    onhome: () => void;
    oncollection: () => void;
  } = $props();

  const progress = $derived(collectionProgress(collection, content));
  const submits = $derived(game.history.reduce((sum, item) => sum + item.submits, 0));
</script>

<section class="screen run-summary">
  <p class="eyebrow">RUN SUMMARY</p>
  <h1>{game.ending?.kind === 'GOOD' ? '완주 기록' : '보존된 수사 기록'}</h1>
  <div class="summary-grid">
    <span><b>{game.history.length}</b> / {content.cases.length} 사건</span>
    <span><b>{submits}</b> 최종 제출</span>
    <span><b>{progress.ownedCards.value}</b> / {progress.ownedCards.total} 보유 카드</span>
    <span><b>{progress.knownAllFacets.value}</b> / {progress.knownAllFacets.total} 아는 측면</span>
  </div>
  <p>BAD 엔딩이어도 이미 얻은 카드·측면·오답 기록은 컬렉션에 남았습니다.</p>
  <div class="summary-actions">
    <button class="primary" onclick={onhome}>Home</button>
    <button onclick={oncollection}>컬렉션 보기</button>
  </div>
</section>
