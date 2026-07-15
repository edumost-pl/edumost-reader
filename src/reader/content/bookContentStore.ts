const DB_NAME = "edumost-reader-content-v1";
const DB_VERSION = 1;
const STORE = "files";

function fileKey(localId: string, path: string): string {
  return `${localId}::${path.replace(/\\/g, "/")}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function txStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export class BookContentStore {
  async has(localId: string): Promise<boolean> {
    const paths = await this.listPaths(localId);
    return paths.some((p) => p === "book.toml" || p.endsWith("/book.toml"));
  }

  async listPaths(localId: string, prefix = ""): Promise<string[]> {
    const db = await openDb();
    const normPrefix = prefix.replace(/\\/g, "/");
    return new Promise((resolve, reject) => {
      const out: string[] = [];
      const req = txStore(db, "readonly").openCursor();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          db.close();
          resolve(out);
          return;
        }
        const key = String(cursor.key);
        if (key.startsWith(`${localId}::`)) {
          const path = key.slice(localId.length + 2);
          if (!normPrefix || path.startsWith(normPrefix)) {
            out.push(path);
          }
        }
        cursor.continue();
      };
    });
  }

  async getBytes(localId: string, path: string): Promise<ArrayBuffer | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = txStore(db, "readonly").get(fileKey(localId, path));
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as ArrayBuffer | undefined) ?? null);
      };
    });
  }

  async getText(localId: string, path: string): Promise<string | null> {
    const bytes = await this.getBytes(localId, path);
    if (!bytes) return null;
    return new TextDecoder("utf-8").decode(bytes);
  }

  async replaceAll(localId: string, files: Array<{ path: string; data: ArrayBuffer }>): Promise<void> {
    await this.removeAll(localId);
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const store = txStore(db, "readwrite");
      store.transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      store.transaction.onerror = () => reject(store.transaction.error);
      for (const f of files) {
        const path = f.path.replace(/\\/g, "/").replace(/^\.\//, "");
        store.put(f.data, fileKey(localId, path));
      }
    });
  }

  async removeAll(localId: string): Promise<void> {
    const paths = await this.listPaths(localId);
    if (paths.length === 0) return;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const store = txStore(db, "readwrite");
      store.transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      store.transaction.onerror = () => reject(store.transaction.error);
      for (const path of paths) {
        store.delete(fileKey(localId, path));
      }
    });
  }
}

export const bookContentStore = new BookContentStore();
