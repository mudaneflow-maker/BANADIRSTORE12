import React, { useRef } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { addLibraryPhoto, photoToDataUrl, removeLibraryPhoto, updateLibraryNote, usePhotoLibrary } from "@/lib/photo-library";

export function PhotoLibraryView() {
  const photos = usePhotoLibrary();
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      addLibraryPhoto(await photoToDataUrl(f));
    }
  };
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Library — sawirrada alaabta</h2>
          <p className="text-xs text-muted-foreground">Sawir alaab aad aragto, xog la'aan. Hadhow marka product la darayo halkan ayaad ka dooran kartaa.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => camRef.current?.click()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><Camera className="h-4 w-4" />Sawir qaad</button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground"><Upload className="h-4 w-4" />Upload photo</button>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      </div>
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Library-gu waa madhan yahay. Riix "Sawir qaad" ama "Upload photo".</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <img src={p.dataUrl} alt={p.note || "Sawir alaab"} className="aspect-square w-full object-cover" />
              <div className="flex items-center gap-1 p-1.5">
                <input defaultValue={p.note} placeholder="Qoraal (ikhtiyaari)" onBlur={(e) => e.target.value !== p.note && updateLibraryNote(p.id, e.target.value)} className="min-w-0 flex-1 rounded border border-border bg-background px-1.5 py-1 text-xs" />
                <button aria-label="Tirtir sawirka" onClick={() => confirm("Tirtir sawirkan?") && removeLibraryPhoto(p.id)} className="rounded p-1 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Small popup to pick a photo from the Library. */
export function LibraryPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (dataUrl: string) => void }) {
  const photos = usePhotoLibrary();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-foreground/50 p-2 sm:items-center" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Ka dooro Library</h3>
          <button onClick={onClose} className="text-xs font-bold text-muted-foreground">Xir</button>
        </div>
        {photos.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Library-gu waa madhan yahay — ka dar Products &amp; Stock → Library.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p) => (
              <button type="button" key={p.id} onClick={() => { onPick(p.dataUrl); onClose(); }} className="overflow-hidden rounded-lg border border-border hover:ring-2 hover:ring-primary">
                <img src={p.dataUrl} alt={p.note || "Sawir"} className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
