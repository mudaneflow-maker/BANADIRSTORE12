import React, { useRef, useState } from "react";
import { Camera, Upload, X, Check, FolderOpen, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useLibraryImages,
  addLibraryImage,
  compressImage,
  type LibraryImage,
} from "@/lib/image-library";

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  currentImageUrl?: string;
}

export const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentImageUrl,
}) => {
  const images = useLibraryImages();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const file = files[0];
      const compressed = await compressImage(file, 1200, 0.85);
      const newImg = addLibraryImage(compressed, `Sawir ${new Date().toLocaleDateString()}`, "camera");
      onSelectImage(newImg.url);
      onClose();
    } catch (err) {
      console.error("Camera error:", err);
      alert("Sawirka lama qaadi karin.");
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const file = files[0];
      const compressed = await compressImage(file, 1200, 0.85);
      const newImg = addLibraryImage(compressed, file.name.replace(/\.[^/.]+$/, ""), "upload");
      onSelectImage(newImg.url);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Sawirka lama soo gelin karin.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3 sm:p-4"
    >
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">Ka Dooro Sawir Maktabadda (Library)</h2>
              <p className="text-[11px] text-muted-foreground">Dooro sawir hore u keydsanaa ama hadda toos u qaad sawir cusub</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* TOP ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-3 border-b border-border">
          <div className="text-xs text-muted-foreground">
            {images.length} sawir ayaa ku jira maktabadda
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold h-8"
            >
              <Camera className="w-3.5 h-3.5" />
              {isProcessing ? "Waa la qabanayaa..." : "Qaad Sawir Cusub"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="gap-1.5 text-xs h-8"
            >
              <Upload className="w-3.5 h-3.5" /> Upload ka Telefoonka/PC
            </Button>
          </div>
        </div>

        {/* IMAGE GRID */}
        <div className="flex-1 overflow-y-auto p-4">
          {images.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <div className="text-sm font-semibold text-foreground">Weli sawir kuma jiro Maktabadda</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Riix "Qaad Sawir Cusub" si aad telefoonka uga sawirto ama "Upload" si aad sawir uga soo geliso kumbuyuutarka/telefoonka.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => {
                const isSelected = currentImageUrl === img.url;
                return (
                  <div
                    key={img.id}
                    onClick={() => {
                      onSelectImage(img.url);
                      onClose();
                    }}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all shadow-xs hover:shadow-md ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/60"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.title || "Alaab"}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-white text-[10px] truncate">
                      {img.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-border p-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Xir
          </Button>
        </div>
      </div>
    </div>
  );
};
