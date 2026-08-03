export interface StoredPack {
  id: string;
  json: unknown;
  importedAt: number;
}

export interface PackManifest {
  version: 1;
  activePackIds: string[];
}

export interface PackStorageIssue {
  code: 'PACK_BODY_MISSING' | 'MANIFEST_CORRUPT';
  id?: string;
  message: string;
}

export interface PackStore {
  list(): Promise<StoredPack[]>;
  get(id: string): Promise<StoredPack | undefined>;
  put(pack: StoredPack): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ManifestStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const DB_NAME = 'case-collection';
const DB_VERSION = 1;
const STORE_NAME = 'data-packs';
export const PACK_MANIFEST_KEY = 'case-collection.pack-manifest.v1';

export function createMemoryPackStore(): PackStore {
  const values = new Map<string, StoredPack>();
  return {
    list: async () => [...values.values()],
    get: async (id) => values.get(id),
    put: async (pack) => {
      values.set(pack.id, pack);
    },
    delete: async (id) => {
      values.delete(id);
    },
  };
}

export async function resolveManifest(
  store: PackStore,
  manifest: PackManifest,
): Promise<{ packs: StoredPack[]; issues: PackStorageIssue[] }> {
  const packs: StoredPack[] = [];
  const issues: PackStorageIssue[] = [];
  for (const id of manifest.activePackIds) {
    const pack = await store.get(id);
    if (pack === undefined) {
      issues.push({
        code: 'PACK_BODY_MISSING',
        id,
        message: `활성 팩 내용이 없다: ${id}`,
      });
    } else {
      packs.push(pack);
    }
  }
  return { packs, issues };
}

export function loadPackManifest(
  storage: ManifestStorage,
): { manifest: PackManifest; issues: PackStorageIssue[] } {
  const raw = storage.getItem(PACK_MANIFEST_KEY);
  if (raw === null) {
    return {
      manifest: { version: 1, activePackIds: [] },
      issues: [],
    };
  }
  try {
    const value = JSON.parse(raw) as unknown;
    if (
      typeof value !== 'object' ||
      value === null ||
      (value as PackManifest).version !== 1 ||
      !Array.isArray((value as PackManifest).activePackIds) ||
      !(value as PackManifest).activePackIds.every(
        (id: unknown) => typeof id === 'string' && id.length > 0,
      ) ||
      new Set((value as PackManifest).activePackIds).size !==
        (value as PackManifest).activePackIds.length
    ) {
      throw new Error('invalid manifest shape');
    }
    return { manifest: value as PackManifest, issues: [] };
  } catch (error) {
    return {
      manifest: { version: 1, activePackIds: [] },
      issues: [{
        code: 'MANIFEST_CORRUPT',
        message: error instanceof Error ? error.message : String(error),
      }],
    };
  }
}

export function savePackManifest(
  storage: ManifestStorage,
  manifest: PackManifest,
): void {
  storage.setItem(PACK_MANIFEST_KEY, JSON.stringify(manifest));
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error ?? new Error('IndexedDB transaction failed'),
    );
    transaction.onabort = () => reject(
      transaction.error ?? new Error('IndexedDB transaction aborted'),
    );
  });
}

function toIndexedDbRecord(pack: StoredPack): StoredPack {
  const serialized = JSON.stringify(pack.json);
  if (serialized === undefined) {
    throw new TypeError('data pack body must be JSON-serializable');
  }
  return {
    id: pack.id,
    json: JSON.parse(serialized) as unknown,
    importedAt: pack.importedAt,
  };
}

async function withStore<T>(
  factory: IDBFactory,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase(factory);
  try {
    const transaction = database.transaction(STORE_NAME, mode);
    const completed = transactionDone(transaction);
    const result = await requestResult(operation(transaction.objectStore(STORE_NAME)));
    await completed;
    return result;
  } finally {
    database.close();
  }
}

export function createIndexedDbPackStore(factory: IDBFactory): PackStore {
  return {
    list: async () =>
      withStore<StoredPack[]>(factory, 'readonly', (store) => store.getAll()),
    get: async (id) =>
      withStore<StoredPack | undefined>(
        factory,
        'readonly',
        (store) => store.get(id),
      ),
    put: async (pack) => {
      const record = toIndexedDbRecord(pack);
      await withStore<IDBValidKey>(
        factory,
        'readwrite',
        (store) => store.put(record),
      );
    },
    delete: async (id) => {
      await withStore<undefined>(
        factory,
        'readwrite',
        (store) => store.delete(id),
      );
    },
  };
}
