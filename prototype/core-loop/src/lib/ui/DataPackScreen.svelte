<script lang="ts">
  import { onMount } from 'svelte';
  import {
    loadPacks,
    type GameDataPack,
    type LoadResult,
  } from '../datapack';
  import {
    createIndexedDbPackStore,
    loadPackManifest,
    resolveManifest,
    savePackManifest,
    type PackStorageIssue,
  } from '../pack-storage';

  interface Candidate {
    fileName: string;
    json: unknown;
  }

  let { basePack }: { basePack: GameDataPack } = $props();
  let candidates = $state<Candidate[]>([]);
  let result = $state<LoadResult | null>(null);
  let storageIssues = $state<PackStorageIssue[]>([]);
  let busy = $state(false);
  let persistError = $state('');
  let saved = $state(false);
  const store = createIndexedDbPackStore(indexedDB);

  function recompute(): void {
    result = loadPacks(
      basePack,
      candidates.map((item) => item.json),
    );
    persistError = '';
    saved = false;
  }

  onMount(async () => {
    const loaded = loadPackManifest(localStorage);
    const resolved = await resolveManifest(store, loaded.manifest);
    storageIssues = [...loaded.issues, ...resolved.issues];
    candidates = resolved.packs.map((pack) => ({
      fileName: `${pack.id}.json`,
      json: pack.json,
    }));
    recompute();
  });

  async function choose(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const next: Candidate[] = [];
    for (const file of Array.from(input.files ?? [])) {
      try {
        next.push({
          fileName: file.name,
          json: JSON.parse(await file.text()),
        });
      } catch {
        next.push({
          fileName: file.name,
          json: {
            __parseError: `JSON 해석 실패: ${file.name}`,
          },
        });
      }
    }
    candidates = next;
    recompute();
  }

  function removeCandidate(index: number): void {
    candidates = candidates.filter((_, itemIndex) => itemIndex !== index);
    recompute();
  }

  function removeMissingPack(id: string): void {
    const loaded = loadPackManifest(localStorage);
    savePackManifest(localStorage, {
      version: 1,
      activePackIds: loaded.manifest.activePackIds.filter(
        (packId) => packId !== id,
      ),
    });
    storageIssues = storageIssues.filter((issue) => issue.id !== id);
  }

  async function confirmPacks(): Promise<void> {
    if (result?.ok !== true) return;
    busy = true;
    persistError = '';
    saved = false;
    try {
      const packs = candidates.map((item) => item.json as GameDataPack);
      for (const pack of packs) {
        await store.put({
          id: pack.id,
          json: pack,
          importedAt: Date.now(),
        });
      }
      savePackManifest(localStorage, {
        version: 1,
        activePackIds: packs.map((pack) => pack.id),
      });
      storageIssues = [];
      saved = true;
    } catch (error) {
      persistError = error instanceof Error ? error.message : String(error);
    } finally {
      busy = false;
    }
  }
</script>

<main class="pack-screen">
  <header>
    <p class="eyebrow">개발자 도구</p>
    <h1>데이터 팩</h1>
    <p>
      선택한 순서대로 기본 팩 뒤에 검증합니다. 오류가 있는 팩은 활성화되지
      않습니다.
    </p>
  </header>

  <label class="pack-picker">
    JSON 팩 선택
    <input
      type="file"
      accept=".json,application/json"
      multiple
      onchange={choose}
    />
  </label>

  {#if storageIssues.length > 0}
    <section aria-labelledby="storage-issue-title">
      <h2 id="storage-issue-title">저장소 문제</h2>
      <ul>
        {#each storageIssues as issue}
          <li class="error">
            <code>{issue.code}</code> — {issue.message}
            {#if issue.id}
              <button type="button" onclick={() => removeMissingPack(issue.id!)}>
                활성 목록에서 비활성화
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if candidates.length > 0}
    <section aria-labelledby="candidate-title">
      <h2 id="candidate-title">선택 순서</h2>
      <ol>
        {#each candidates as candidate, index}
          <li>
            <span>{index + 1}. {candidate.fileName}</span>
            <button type="button" onclick={() => removeCandidate(index)}>
              제외
            </button>
          </li>
        {/each}
      </ol>
    </section>
  {/if}

  {#if result}
    <section aria-live="polite">
      <h2>{result.ok ? '적용 가능' : '적용할 수 없음'}</h2>
      <p>
        추가 {result.preflight?.additions.length ?? 0} ·
        상쇄 {result.preflight?.overrides.length ?? 0} ·
        문제 {result.issues.length}
      </p>
      {#if result.issues.length > 0}
        <ul>
          {#each result.issues as issue}
            <li class:error={issue.severity === 'error'}>
              <code>{issue.code}</code>
              {issue.path || '$'} — {issue.msg}
            </li>
          {/each}
        </ul>
      {/if}
      <button
        type="button"
        disabled={!result.ok || busy}
        onclick={confirmPacks}
      >
        {busy ? '저장 중…' : '검증된 팩 적용'}
      </button>
      {#if saved}
        <p class="success">활성 순서를 저장했습니다.</p>
      {/if}
      {#if persistError}
        <p role="alert" class="error">{persistError}</p>
      {/if}
    </section>
  {/if}
</main>
