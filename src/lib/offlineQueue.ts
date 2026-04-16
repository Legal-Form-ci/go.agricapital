import { openDB, type IDBPDatabase } from "idb";
import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "agricapital-offline";
const DB_VERSION = 1;
const STORE = "waitlist_queue";

export interface QueuedSubmission {
  id?: number;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueSubmission(payload: Record<string, unknown>) {
  const db = await getDB();
  const id = await db.add(STORE, {
    payload,
    createdAt: Date.now(),
    attempts: 0,
  } as QueuedSubmission);
  notifyChange();
  return id as number;
}

export async function getQueue(): Promise<QueuedSubmission[]> {
  const db = await getDB();
  return (await db.getAll(STORE)) as QueuedSubmission[];
}

export async function removeFromQueue(id: number) {
  const db = await getDB();
  await db.delete(STORE, id);
  notifyChange();
}

export async function updateQueueItem(item: QueuedSubmission) {
  const db = await getDB();
  await db.put(STORE, item);
  notifyChange();
}

export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return await db.count(STORE);
}

const CHANNEL = "agricapital-queue-change";
function notifyChange() {
  try {
    window.dispatchEvent(new CustomEvent(CHANNEL));
  } catch {
    /* noop */
  }
}
export function onQueueChange(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(CHANNEL, handler);
  return () => window.removeEventListener(CHANNEL, handler);
}

let syncing = false;

export async function syncQueue(): Promise<{ ok: number; failed: number }> {
  if (syncing) return { ok: 0, failed: 0 };
  syncing = true;
  let ok = 0;
  let failed = 0;
  try {
    const items = await getQueue();
    for (const item of items) {
      if (!navigator.onLine) break;
      try {
        const { error } = await supabase
          .from("waitlist_agricapital")
          .insert(item.payload as never);
        if (error) throw error;
        if (item.id != null) await removeFromQueue(item.id);
        ok++;
      } catch (err: unknown) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        if (item.id != null) {
          await updateQueueItem({
            ...item,
            attempts: item.attempts + 1,
            lastError: message,
          });
        }
      }
    }
  } finally {
    syncing = false;
  }
  return { ok, failed };
}
