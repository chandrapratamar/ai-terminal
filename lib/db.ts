export async function getFromDB(store: string, key: string) {
  if (typeof window === "undefined") return null; // SSR guard
  const { openDB } = await import('idb');
  const db = await openDB('webtui-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('chat-sessions')) {
        db.createObjectStore('chat-sessions');
      }
      if (!db.objectStoreNames.contains('chat-settings')) {
        db.createObjectStore('chat-settings');
      }
      if (!db.objectStoreNames.contains('webtui-theme')) {
        db.createObjectStore('webtui-theme');
      }
    },
  });
  return db.get(store, key);
}

export async function setToDB(store: string, key: string, value: any) {
  if (typeof window === "undefined") return;
  const { openDB } = await import('idb');
  const db = await openDB('webtui-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('chat-sessions')) {
        db.createObjectStore('chat-sessions');
      }
      if (!db.objectStoreNames.contains('chat-settings')) {
        db.createObjectStore('chat-settings');
      }
      if (!db.objectStoreNames.contains('webtui-theme')) {
        db.createObjectStore('webtui-theme');
      }
    },
  });
  return db.put(store, value, key);
}

export async function delFromDB(store: string, key: string) {
  if (typeof window === "undefined") return;
  const { openDB } = await import('idb');
  const db = await openDB('webtui-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('chat-sessions')) {
        db.createObjectStore('chat-sessions');
      }
      if (!db.objectStoreNames.contains('chat-settings')) {
        db.createObjectStore('chat-settings');
      }
      if (!db.objectStoreNames.contains('webtui-theme')) {
        db.createObjectStore('webtui-theme');
      }
    },
  });
  return db.delete(store, key);
} 