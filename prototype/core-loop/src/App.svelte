<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import audioSpec from '../audio/audio-spec.json';
  import {
    createBrowserAudioPort,
    createSilentAudioPort,
    validateAudioManifest,
    type AudioManifest,
    type AudioPort,
    type SfxCue,
  } from './lib/audio';
  import { publicAssetUrl, rebaseAudioManifest } from './lib/public-assets';
  import { CONTENT } from './lib/content';
  import {
    createCollectionState,
    loadCollectionState,
    mergeGameProgress,
    saveCollectionState,
    type CollectionStateV1,
  } from './lib/collection';
  import { packFromContent } from './lib/datapack';
  import { initGame, reduce, type Action, type GameState } from './lib/engine';
  import {
    clearRunSnapshot,
    loadRunSnapshot,
    saveRunSnapshot,
  } from './lib/run-session';
  import BriefingScreen from './lib/ui/BriefingScreen.svelte';
  import CaseScreen from './lib/ui/CaseScreen.svelte';
  import InterludeScreen from './lib/ui/InterludeScreen.svelte';
  import EndScreen from './lib/ui/EndScreen.svelte';
  import DataPackScreen from './lib/ui/DataPackScreen.svelte';
  import ClearFeedbackScreen from './lib/ui/ClearFeedbackScreen.svelte';
  import CollectionScreen from './lib/ui/CollectionScreen.svelte';
  import HomeScreen from './lib/ui/HomeScreen.svelte';
  import RunSummaryScreen from './lib/ui/RunSummaryScreen.svelte';
  import AudioSettings from './lib/ui/AudioSettings.svelte';

  const showDataPacks =
    new URLSearchParams(window.location.search).get('data-packs') === '1';
  type AppView = 'home' | 'run' | 'collection';

  const initialGame = initGame(CONTENT);
  const initialSnapshotLoad = loadRunSnapshot(localStorage);
  let snapshotLoad = $state(initialSnapshotLoad);
  const initialCollectionLoad = loadCollectionState(localStorage);
  let collectionIssue = $state(initialCollectionLoad.issue);
  let collectionWritable = $state(initialCollectionLoad.issue === null);
  let collection = $state<CollectionStateV1>(
    initialCollectionLoad.state ?? createCollectionState(initialGame),
  );
  let game = $state(
    initialSnapshotLoad.snapshot?.game ?? hydrateFromCollection(initialGame),
  );
  let view = $state<AppView>('home');
  let collectionReturn = $state<'home' | 'run' | 'summary'>('home');
  let audio = $state<AudioPort>(createSilentAudioPort());

  onMount(() => {
    let disposed = false;
    const unlock = () => void audio.unlock();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    void fetch(publicAssetUrl('audio/audio-manifest.json', import.meta.env.BASE_URL))
      .then(async (response) => {
        if (!response.ok) return null;
        const manifest = await response.json() as AudioManifest;
        return validateAudioManifest(manifest, audioSpec).ok
          ? rebaseAudioManifest(manifest, import.meta.env.BASE_URL)
          : null;
      })
      .then((manifest) => {
        if (disposed) return;
        const next = createBrowserAudioPort(manifest);
        audio.dispose();
        audio = next;
        void audio.unlock();
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      audio.dispose();
    };
  });

  $effect(() => {
    audio.setMusic(view === 'run' && game.screen !== 'summary' ? 'case' : 'title');
  });

  function hydrateFromCollection(base: GameState): GameState {
    const next = structuredClone(base);
    next.ownedClues = [...new Set([...next.ownedClues, ...collection.ownedCardIds])];
    next.ownedPatterns = [
      ...new Set([...next.ownedPatterns, ...collection.ownedPatternIds]),
    ];
    next.knownFacets = [
      ...new Set([...next.knownFacets, ...collection.knownFacetKeys]),
    ];
    return next;
  }

  function beginNewRun(): void {
    const replacingSnapshot = snapshotLoad.raw !== null;
    const replacingCollection = collectionIssue !== null;
    if (
      (replacingSnapshot || replacingCollection) &&
      !window.confirm(
        replacingCollection
          ? '기존 수사 기록과 읽을 수 없는 컬렉션 원문을 보존 종료하고 새 수사 상태로 교체할까요?'
          : '기존 수사 기록을 끝내고 새 수사를 시작할까요?',
      )
    ) {
      return;
    }
    if (replacingCollection) {
      collection = createCollectionState(initialGame);
      collectionIssue = null;
      collectionWritable = true;
      saveCollectionState(localStorage, collection);
    }
    game = hydrateFromCollection(initGame(CONTENT));
    saveRunSnapshot(localStorage, $state.snapshot(game) as GameState);
    snapshotLoad = loadRunSnapshot(localStorage);
    view = 'run';
  }

  function continueRun(): void {
    if (snapshotLoad.snapshot === null) return;
    game = structuredClone(
      $state.snapshot(snapshotLoad.snapshot.game) as GameState,
    );
    view = 'run';
  }

  function openCollection(from: 'home' | 'run' | 'summary'): void {
    collectionReturn = from;
    view = 'collection';
  }

  function closeCollection(): void {
    view = collectionReturn === 'home' ? 'home' : 'run';
  }

  function finishToHome(): void {
    clearRunSnapshot(localStorage);
    snapshotLoad = loadRunSnapshot(localStorage);
    game = hydrateFromCollection(initGame(CONTENT));
    view = 'home';
  }

  const dispatch = (a: Action) => {
    const before = $state.snapshot(game) as GameState;
    const next = reduce(before, a, CONTENT);
    if (next.seq === before.seq) return;
    playActionSfx(a, before, next);
    collection = mergeGameProgress(
      $state.snapshot(collection) as CollectionStateV1,
      before,
      next,
      CONTENT,
    );
    if (collectionWritable) saveCollectionState(localStorage, collection);
    game = next;
    saveRunSnapshot(localStorage, next);
    snapshotLoad = loadRunSnapshot(localStorage);
  };

  function playActionSfx(
    action: Action,
    before: GameState,
    next: GameState,
  ): void {
    let cue: SfxCue | null = null;
    if (
      action.type === 'PLACE' &&
      before.confirmed[action.slotId] === undefined &&
      next.confirmed[action.slotId] !== undefined
    ) {
      cue = 'facet_lock';
    } else if (
      action.type === 'CLEAR_SLOT' &&
      next.undos > before.undos
    ) {
      cue = 'chain_release';
    } else if (action.type === 'REQUEST_REVIEW') {
      cue = next.review?.kind === 'sound' ? 'review_pass' : 'review_fail';
    } else if (action.type === 'INTERLUDE_ACTION') {
      cue = 'interlude_action';
    }
    if (cue !== null) audio.playSfx(cue);
  }
</script>

{#if showDataPacks}
  <AudioSettings {audio} />
  <DataPackScreen basePack={packFromContent('base', CONTENT)} />
{:else if view === 'home'}
  <AudioSettings {audio} />
  <HomeScreen
    canContinue={snapshotLoad.snapshot !== null}
    snapshotIssue={snapshotLoad.issue}
    collectionIssue={collectionIssue}
    onnew={beginNewRun}
    oncontinue={continueRun}
    oncollection={() => openCollection('home')}
  />
{:else if view === 'collection'}
  <AudioSettings {audio} />
  <CollectionScreen {collection} content={CONTENT} onback={closeCollection} />
{:else}
<div class="shell">
  <header class="topbar">
    <span class="proto-mark">단서수집가</span>
    <span class="run-progress">사건 {Math.min(game.caseIndex + 1, CONTENT.cases.length)}/{CONTENT.cases.length}</span>
    <AudioSettings {audio} />
    <button class="topbar-action" onclick={() => openCollection(game.screen === 'summary' ? 'summary' : 'run')}>
      컬렉션
    </button>
  </header>

  {#key `${game.screen}:${game.caseIndex}`}
    <div class="screen-holder" in:fly={{ y: 14, duration: 320 }}>
      {#if game.screen === 'briefing'}
        <BriefingScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'case'}
        <CaseScreen
          {game}
          content={CONTENT}
          {collection}
          {dispatch}
          playSfx={(cue) => audio.playSfx(cue)}
        />
      {:else if game.screen === 'clear'}
        <ClearFeedbackScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'interlude'}
        <InterludeScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'end'}
        <EndScreen {game} content={CONTENT} {dispatch} />
      {:else if game.screen === 'summary'}
        <RunSummaryScreen
          {game}
          content={CONTENT}
          {collection}
          onhome={finishToHome}
          oncollection={() => openCollection('summary')}
        />
      {/if}
    </div>
  {/key}
</div>
{/if}
