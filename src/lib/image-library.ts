import { useSyncExternalStore } from "react";

export type LibraryImage = {
  id: string;
  url: string; // Data URL or remote URL
  title?: string;
  tag?: string;
  source?: "camera" | "upload";
  createdAt: string;
};

const KEY = "benadir_image_library_v1";
const listeners = new Set<() => void>();
let memoryImages: LibraryImage[] = [];
let isLoaded = false;

function load() {
  if (isLoaded || typeof window === "undefined") return;
  isLoaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      memoryImages = JSON.parse(raw);
    } else {
      memoryImages = [];
    }
  } catch {
    memoryImages = [];
  }
}

function persist(next: LibraryImage[]) {
  memoryImages = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("Storage full or error saving to localStorage:", e);
  }
  listeners.forEach((l) => l());
}

export function getLibraryImages(): LibraryImage[] {
  load();
  return memoryImages;
}

export function useLibraryImages(): LibraryImage[] {
  load();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => memoryImages,
    () => [],
  );
}

const uid = () => `IMG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * Resizes and compresses image data URL to ensure fast mobile loading and low storage footprint.
 */
export async function compressImage(fileOrBlob: File | Blob, maxWidth = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

export function addLibraryImage(url: string, title?: string, source: "camera" | "upload" = "upload"): LibraryImage {
  load();
  const newItem: LibraryImage = {
    id: uid(),
    url,
    title: title?.trim() || `Sawir ${new Date().toLocaleDateString()}`,
    source,
    createdAt: new Date().toISOString(),
  };
  persist([newItem, ...memoryImages]);
  return newItem;
}

export function addMultipleLibraryImages(images: { url: string; title?: string }[]): LibraryImage[] {
  load();
  const newItems: LibraryImage[] = images.map((img) => ({
    id: uid(),
    url: img.url,
    title: img.title?.trim() || `Sawir ${new Date().toLocaleDateString()}`,
    source: "upload",
    createdAt: new Date().toISOString(),
  }));
  persist([...newItems, ...memoryImages]);
  return newItems;
}

export function deleteLibraryImage(id: string): void {
  load();
  persist(memoryImages.filter((img) => img.id !== id));
}

export function updateLibraryImage(id: string, patch: Partial<Pick<LibraryImage, "title" | "tag">>): void {
  load();
  persist(memoryImages.map((img) => (img.id === id ? { ...img, ...patch } : img)));
}
