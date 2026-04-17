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

export async function clearQueue(): Promise<number> {
  const db = await getDB();
  const count = await db.count(STORE);
  await db.clear(STORE);
  notifyChange();
  return count;
}

/**
 * Renvoie l'âge (en ms) du plus ancien élément en file, ou null si vide.
 * Utile pour alerter le commercial si la synchro tarde (> 24h).
 */
export async function getOldestPendingAge(): Promise<number | null> {
  const items = await getQueue();
  if (items.length === 0) return null;
  const oldest = items.reduce((min, it) => Math.min(min, it.createdAt), Date.now());
  return Date.now() - oldest;
}

const CHANNEL = "agricapital-queue-change";
const STATS_CHANNEL = "agricapital-sync-stats-change";
function notifyChange() {
  try {
    window.dispatchEvent(new CustomEvent(CHANNEL));
  } catch {
    /* noop */
  }
}
function notifyStatsChange() {
  try {
    window.dispatchEvent(new CustomEvent(STATS_CHANNEL));
  } catch {
    /* noop */
  }
}
export function onQueueChange(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(CHANNEL, handler);
  return () => window.removeEventListener(CHANNEL, handler);
}
export function onSyncStatsChange(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(STATS_CHANNEL, handler);
  return () => window.removeEventListener(STATS_CHANNEL, handler);
}

// ---------------- Sync stats (persisted in localStorage) ----------------
export interface SyncErrorEntry {
  at: number;
  message: string;
  payloadSummary: string;
}
export interface SyncStats {
  successCount: number;
  failureCount: number;
  lastSyncAt: number | null;
  errors: SyncErrorEntry[]; // last 10
}
const STATS_KEY = "agricapital-sync-stats-v1";
const MAX_ERRORS = 10;

export function getSyncStats(): SyncStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw) as SyncStats;
  } catch {
    /* noop */
  }
  return { successCount: 0, failureCount: 0, lastSyncAt: null, errors: [] };
}
function saveSyncStats(stats: SyncStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    notifyStatsChange();
  } catch {
    /* noop */
  }
}
export function resetSyncStats() {
  saveSyncStats({ successCount: 0, failureCount: 0, lastSyncAt: null, errors: [] });
}

let syncing = false;

export async function syncQueue(): Promise<{ ok: number; failed: number }> {
  if (syncing) return { ok: 0, failed: 0 };
  syncing = true;
  let ok = 0;
  let failed = 0;
  const stats = getSyncStats();
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
        stats.successCount++;
      } catch (err: unknown) {
        failed++;
        stats.failureCount++;
        const message = err instanceof Error ? err.message : String(err);
        const p = item.payload as Record<string, unknown>;
        const summary = `${String(p.nom ?? "?")} (${String(p.whatsapp ?? "?")})`;
        stats.errors = [
          { at: Date.now(), message, payloadSummary: summary },
          ...stats.errors,
        ].slice(0, MAX_ERRORS);
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
    stats.lastSyncAt = Date.now();
    saveSyncStats(stats);
  }
  return { ok, failed };
}
