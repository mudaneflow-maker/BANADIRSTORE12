import { useSyncExternalStore } from "react";

// Photo Library: product photos taken/uploaded without details, reused later when adding products.
// Stored in a benadir_* key so it syncs to the cloud like other admin data.
export type LibraryPhoto = { id: string; dataUrl: string; note: string; createdAt: string };

const KEY = "benadir_photo_library_v1";
let state: LibraryPhoto[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: LibraryPhoto[] = [];

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : [];
  } catch {
    state = [];
  }
}
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  read();
  window.addEventListener("benadir-remote-update", () => {
    read();
    listeners.forEach((l) => l());
  });
}
function set(next: LibraryPhoto[]) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    alert("Kaydka taleefanka/browser-ka wuu buuxsamay — sawirro qaar tirtir.");
  }
  listeners.forEach((l) => l());
}

export function usePhotoLibrary() {
  load();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => EMPTY,
  );
}
export function addLibraryPhoto(dataUrl: string, note = "") {
  load();
  set([{ id: `PH-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, dataUrl, note, createdAt: new Date().toISOString() }, ...state]);
}
export function updateLibraryNote(id: string, note: string) {
  load();
  set(state.map((p) => (p.id === id ? { ...p, note } : p)));
}
export function removeLibraryPhoto(id: string) {
  load();
  set(state.filter((p) => p.id !== id));
}

/** Resize a photo to a small JPEG data URL so it syncs cheaply. */
export const photoToDataUrl = (file: File, max = 640): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
