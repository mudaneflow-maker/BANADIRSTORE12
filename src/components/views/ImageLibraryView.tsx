import React, { useRef, useState } from "react";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  Eye,
  Check,
  PackagePlus,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useLibraryImages,
  addLibraryImage,
  deleteLibraryImage,
  compressImage,
  type LibraryImage,
} from "@/lib/image-library";

interface ImageLibraryViewProps {
  onSelectForProduct?: (imageUrl: string) => void;
  onCreateProductWithImage?: (imageUrl: string) => void;
}

export const ImageLibraryView: React.FC<ImageLibraryViewProps> = ({
  onSelectForProduct,
  onCreateProductWithImage,
}) => {
  const images = useLibraryImages();
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterTag, setFilterTag] = useState<string>("all");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const file = files[0];
      const compressed = await compressImage(file, 1200, 0.85);
      addLibraryImage(compressed, `Sawir ${new Date().toLocaleDateString()}`, "camera");
    } catch (err) {
      console.error("Camera capture error:", err);
      alert("Sawirka lama qaadi karin, fadlan isku day mar kale.");
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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file, 1200, 0.85);
        addLibraryImage(compressed, file.name.replace(/\.[^/.]+$/, ""), "upload");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Sawirada lama soo gelin karin, fadlan hubi.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Hidden file inputs for Camera and File Upload */}
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
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            Maktabadda Sawirrada (Photo Library)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Sawir alaabta adigoon magac iyo xog qorin, si toos ahna ugu keydi halkan. Hadhow alaabta marka aad diiwaangelinayso
            si fudud uga dhex dooro.
          </p>
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm text-xs sm:text-sm h-10 px-4"
          >
            <Camera className="w-4 h-4" />
            {isProcessing ? "Waa la kaydinayaa..." : "Sawir Qaad (Camera)"}
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="gap-2 text-xs sm:text-sm h-10 px-4"
          >
            <Upload className="w-4 h-4 text-primary" />
            Upload Sawirro
          </Button>
        </div>
      </div>

      {/* STATS & FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span>Wadarta Sawirrada:</span>
          <strong className="font-bold text-foreground text-sm">{images.length} sawir</strong>
        </div>

        {images.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Riix sawir kasta si aad u weyneyso ama alaab ugu xirto.
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {images.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center space-y-4 bg-card/50">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Camera className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-base text-foreground">Weli sawir kuma jiro Maktabadda</h3>
            <p className="text-xs text-muted-foreground">
              Haddii aad suuqa ama meel ku aragto alaab aad rabto inaad dukaanka geliso, kaliya riix "Sawir Qaad" si ay halkan kuugu kaydsanaato.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2 bg-primary text-primary-foreground text-xs"
            >
              <Camera className="w-4 h-4" /> Sawir ka qaad Telefoonka
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 text-xs"
            >
              <Upload className="w-4 h-4" /> Soo geli Sawir
            </Button>
          </div>
        </div>
      ) : (
        /* GRID OF IMAGES */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted cursor-pointer hover:border-primary transition-all shadow-xs hover:shadow-md"
            >
              <img
                src={img.url}
                alt={img.title || "Alaab"}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <div className="self-end bg-black/60 backdrop-blur-xs rounded-full p-1 text-white hover:text-destructive">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-white text-[11px] font-medium truncate">
                  {img.title}
                </div>
              </div>

              {img.source === "camera" && (
                <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                  <Camera className="w-2.5 h-2.5 text-primary" /> Camera
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DETAIL / PREVIEW MODAL */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">{selectedImage.title}</h3>
                <span className="text-[11px] text-muted-foreground">
                  La qaaday: {new Date(selectedImage.createdAt).toLocaleString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Ma hubtaa inaad tirtirto sawirkan?")) {
                    deleteLibraryImage(selectedImage.id);
                    setSelectedImage(null);
                  }
                }}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Tirtir
              </Button>

              <div className="flex items-center gap-2">
                {onCreateProductWithImage && (
                  <Button
                    onClick={() => {
                      const url = selectedImage.url;
                      setSelectedImage(null);
                      onCreateProductWithImage(url);
                    }}
                    className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
                  >
                    <PackagePlus className="w-3.5 h-3.5" /> U Samee Alaab Cusub
                  </Button>
                )}

                {onSelectForProduct && (
                  <Button
                    onClick={() => {
                      onSelectForProduct(selectedImage.url);
                      setSelectedImage(null);
                    }}
                    className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" /> Dooro Sawirkan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
