"use client";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/cloudinary";
import { compressImage } from "@/lib/compressImage";
import { cn } from "@/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { toast } from "sonner";

export interface ImagePickerRef {
  uploadIfPending(): Promise<string | null>;
  hasPendingFile: boolean;
}

interface Props {
  currentKey?: string;
  className?: string;
}

const ImagePicker = forwardRef<ImagePickerRef, Props>(
  ({ currentKey, className }, ref) => {
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Clean up object URL on unmount or when pendingFile changes
    useEffect(() => {
      return () => {
        if (localPreview) URL.revokeObjectURL(localPreview);
      };
    }, [localPreview]);

    useImperativeHandle(ref, () => ({
      get hasPendingFile() {
        return pendingFile !== null;
      },
      async uploadIfPending(): Promise<string | null> {
        if (!pendingFile) return null;

        setUploading(true);
        try {
          const signRes = await fetch("/api/admin/cloudinary/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder: "products" }),
          });
          if (!signRes.ok) throw new Error("Гарын үсэг авахад алдаа гарлаа");

          const { timestamp, signature, api_key, cloud_name, folder } =
            await signRes.json();

          const formData = new FormData();
          formData.append("file", pendingFile);
          formData.append("timestamp", String(timestamp));
          formData.append("signature", signature);
          formData.append("api_key", api_key);
          formData.append("folder", folder);

          const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
            { method: "POST", body: formData }
          );
          if (!cloudRes.ok) throw new Error("Зураг байршуулахад алдаа гарлаа");

          const result = await cloudRes.json();

          // Clear pending state after successful upload
          URL.revokeObjectURL(localPreview!);
          setPendingFile(null);
          setLocalPreview(null);

          return result.public_id as string;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Алдаа гарлаа";
          toast.error(msg);
          return null;
        } finally {
          setUploading(false);
        }
      },
    }));

    const handleFile = async (file: File) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowed.includes(file.type)) {
        toast.error("Зөвхөн jpg, png, webp формат зөвшөөрнө");
        return;
      }
      if (localPreview) URL.revokeObjectURL(localPreview);
      const compressed = await compressImage(file);
      setPendingFile(compressed);
      setLocalPreview(URL.createObjectURL(compressed));
    };

    const clearPending = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (localPreview) URL.revokeObjectURL(localPreview);
      setPendingFile(null);
      setLocalPreview(null);
    };

    // What to display in the preview area
    const displaySrc = localPreview ?? (currentKey ? getImageUrl(currentKey, { width: 400  }) : null);
    const isPending = pendingFile !== null;

    return (
      <div className={cn("space-y-2", className)}>
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-colors",
            displaySrc ? "border-primary/30" : "border-muted-foreground/30"
          )}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{ minHeight: "160px" }}
        >
          {displaySrc ? (
            <Image
              src={displaySrc}
              alt="Бүтээгдэхүүний зураг"
              fill
              className="object-cover"
              unoptimized={isPending}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Upload className="w-8 h-8" />
              <p className="text-sm">Зураг сонгох</p>
              <p className="text-xs">JPG, PNG, WEBP • Хамгийн ихдээ 5MB</p>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Байршуулж байна...</p>
            </div>
          )}

          {/* Pending indicator badge */}
          {isPending && !uploading && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              Хадгалахад upload хийгдэнэ
            </div>
          )}

          {/* Clear pending file button */}
          {isPending && !uploading && (
            <button
              type="button"
              onClick={clearPending}
              className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4 text-destructive" />
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await handleFile(file);
            e.target.value = "";
          }}
        />

        {displaySrc && !uploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="w-full"
          >
            {isPending ? "Өөр зураг сонгох" : "Зураг солих"}
          </Button>
        )}
      </div>
    );
  }
);

ImagePicker.displayName = "ImagePicker";
export default ImagePicker;
