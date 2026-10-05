import { useSyncExternalStore } from "react";

/**
 * Global "money visible" flag — every money figure in the app is masked
 * until the balance PIN is entered. Auto-hides again after 5 seconds.
 */
let visible = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const setBalanceVisible = (v: boolean) => {
  visible = v;
  if (timer) clearTimeout(timer);
  if (v) timer = setTimeout(() => { visible = false; emit(); }, 5000);
  emit();
};

export const isBalanceVisible = () => visible;

export const useBalanceVisible = () =>
  useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => visible,
    () => false,
  );

/** Format money only when visible, otherwise bullets. */
export const maskMoney = (n: number, visibleFlag: boolean) =>
  visibleFlag ? `$${(n || 0).toFixed(2)}` : "••••••";
