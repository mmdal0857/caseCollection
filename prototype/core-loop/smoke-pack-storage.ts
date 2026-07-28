import {
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

console.log(
  `\n[pack-storage] ${failures === 0 ? 'PASS' : `FAIL — ${failures}건`}`,
);
process.exit(failures === 0 ? 0 : 1);
