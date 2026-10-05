import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface OutboxItem {
  id: string; // Idempotency key (UUID)
  entity: "sale" | "order" | "customer" | "product" | "expense" | "income" | "payment" | "journal";
  action: "create" | "update" | "delete";
  payload: any;
  timestamp: string;
  retryCount: number;
}

interface BenadirDB extends DBSchema {
  products: { key: string; value: any };
  customers: { key: string; value: any };
  suppliers: { key: string; value: any };
  sales: { key: string; value: any };
  orders: { key: string; value: any };
  expenses: { key: string; value: any };
  incomes: { key: string; value: any };
  accounts: { key: string; value: any };
  journal_entries: { key: string; value: any };
  outbox: { key: string; value: OutboxItem };
}

const DB_NAME = "benadir_offline_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BenadirDB>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<BenadirDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB<BenadirDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("products")) db.createObjectStore("products", { keyPath: "id" });
        if (!db.objectStoreNames.contains("customers")) db.createObjectStore("customers", { keyPath: "id" });
        if (!db.objectStoreNames.contains("suppliers")) db.createObjectStore("suppliers", { keyPath: "id" });
        if (!db.objectStoreNames.contains("sales")) db.createObjectStore("sales", { keyPath: "id" });
        if (!db.objectStoreNames.contains("orders")) db.createObjectStore("orders", { keyPath: "id" });
        if (!db.objectStoreNames.contains("expenses")) db.createObjectStore("expenses", { keyPath: "id" });
        if (!db.objectStoreNames.contains("incomes")) db.createObjectStore("incomes", { keyPath: "id" });
        if (!db.objectStoreNames.contains("accounts")) db.createObjectStore("accounts", { keyPath: "id" });
        if (!db.objectStoreNames.contains("journal_entries")) db.createObjectStore("journal_entries", { keyPath: "id" });
        if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function queueOfflineAction(action: Omit<OutboxItem, "timestamp" | "retryCount">): Promise<void> {
  try {
    const db = await getOfflineDB();
    const item: OutboxItem = {
      ...action,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    await db.put("outbox", item);
  } catch (err) {
    console.error("Failed to queue offline action:", err);
  }
}

export async function getPendingOutbox(): Promise<OutboxItem[]> {
  try {
    const db = await getOfflineDB();
    return await db.getAll("outbox");
  } catch {
    return [];
  }
}

export async function removeOutboxItem(id: string): Promise<void> {
  try {
    const db = await getOfflineDB();
    await db.delete("outbox", id);
  } catch (err) {
    console.error("Failed to remove outbox item:", err);
  }
}
