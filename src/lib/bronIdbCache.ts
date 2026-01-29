/**
 * BRON IndexedDB cache
 *
 * localStorage can silently fail on large payloads (quota). IndexedDB is much
 * larger and async, so we use it as a durable fallback for big keyword lists.
 */

const DB_NAME = "bron_cache_db";
const DB_VERSION = 1;
const STORE_KEYWORDS = "keywords";

type KeywordRecord<T> = {
  domain: string;
  cachedAt: number;
  data: T;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KEYWORDS)) {
        db.createObjectStore(STORE_KEYWORDS, { keyPath: "domain" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function saveKeywordsToIdb<T>(domain: string, data: T, cachedAt: number): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_KEYWORDS, "readwrite");
      const store = tx.objectStore(STORE_KEYWORDS);
      store.put({ domain, data, cachedAt } satisfies KeywordRecord<T>);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB write aborted"));
    });
  } finally {
    db.close();
  }
}

export async function loadKeywordsFromIdb<T>(domain: string, maxAgeMs: number): Promise<T | null> {
  const db = await openDb();
  try {
    const rec = await new Promise<KeywordRecord<T> | null>((resolve, reject) => {
      const tx = db.transaction(STORE_KEYWORDS, "readonly");
      const store = tx.objectStore(STORE_KEYWORDS);
      const req = store.get(domain);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
      req.onsuccess = () => resolve((req.result as KeywordRecord<T> | undefined) ?? null);
    });

    if (!rec) return null;
    if (!rec.cachedAt) return null;
    if (Date.now() - rec.cachedAt > maxAgeMs) return null;
    return rec.data ?? null;
  } finally {
    db.close();
  }
}

export async function deleteKeywordsFromIdb(domain: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_KEYWORDS, "readwrite");
      const store = tx.objectStore(STORE_KEYWORDS);
      store.delete(domain);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB delete aborted"));
    });
  } finally {
    db.close();
  }
}
