import {
  createIndexedDbPackStore,
  createMemoryPackStore,
  loadPackManifest,
  resolveManifest,
  savePackManifest,
  type ManifestStorage,
  type PackManifest,
} from './src/lib/pack-storage';

let failures = 0;
function check(label: string, ok: boolean): void {
  if (!ok) failures++;
  console.log(`[${label}] ${ok ? 'PASS' : 'FAIL'}`);
}

const manifest: PackManifest = {
  version: 1,
  activePackIds: ['mod.b', 'mod.a'],
};
const store = createMemoryPackStore();
await store.put({ id: 'mod.a', json: { id: 'mod.a' }, importedAt: 1 });
await store.put({ id: 'mod.b', json: { id: 'mod.b' }, importedAt: 2 });
const ordered = await resolveManifest(store, manifest);
check(
  'S1 manifest 순서',
  ordered.packs.map((pack) => pack.id).join(',') === 'mod.b,mod.a',
);
check(
  'S2 없는 manifest id 경고',
  (await resolveManifest(store, {
    version: 1,
    activePackIds: ['mod.missing'],
  })).issues.some((issue) => issue.code === 'PACK_BODY_MISSING'),
);

const values = new Map<string, string>();
const storage: ManifestStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => { values.set(key, value); },
};
savePackManifest(storage, manifest);
check(
  'S3 manifest 왕복',
  loadPackManifest(storage).manifest.activePackIds.join(',') === 'mod.b,mod.a',
);
storage.setItem('case-collection.pack-manifest.v1', '{broken');
const corrupt = loadPackManifest(storage);
check(
  'S4 손상 manifest 보존·경고',
  corrupt.issues.some((issue) => issue.code === 'MANIFEST_CORRUPT') &&
    storage.getItem('case-collection.pack-manifest.v1') === '{broken',
);

let capturedPack: unknown;
function cloneCheckingFactory(): IDBFactory {
  const database = {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      const transaction: {
        error: DOMException | null;
        oncomplete?: () => void;
        onerror?: () => void;
        onabort?: () => void;
        objectStore: () => { put: (value: unknown) => IDBRequest<IDBValidKey> };
      } = {
        error: null,
        objectStore: () => ({
          put: (value: unknown) => {
            capturedPack = structuredClone(value);
            const request = {
              result: (capturedPack as { id: string }).id,
              error: null,
            } as unknown as IDBRequest<IDBValidKey>;
            queueMicrotask(() => {
              request.onsuccess?.(new Event('success'));
              transaction.oncomplete?.();
            });
            return request;
          },
        }),
      };
      return transaction as unknown as IDBTransaction;
    },
    close: () => undefined,
  };
  return {
    open: () => {
      const request = {
        result: database,
        error: null,
      } as unknown as IDBOpenDBRequest;
      queueMicrotask(() => request.onsuccess?.(new Event('success')));
      return request;
    },
  } as unknown as IDBFactory;
}

const reactiveJson = new Proxy({ id: 'mod.proxy' }, {});
let reactivePutSucceeded = true;
try {
  await createIndexedDbPackStore(cloneCheckingFactory()).put({
    id: 'mod.proxy',
    json: reactiveJson,
    importedAt: 3,
  });
} catch {
  reactivePutSucceeded = false;
}
check(
  'S5 반응형 JSON 저장 경계 정규화',
  reactivePutSucceeded &&
    (capturedPack as { json?: { id?: string } } | undefined)?.json?.id === 'mod.proxy',
);

console.log(
  `\n[pack-storage] ${failures === 0 ? 'PASS' : `FAIL — ${failures}건`}`,
);
process.exit(failures === 0 ? 0 : 1);
