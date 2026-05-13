"use client";
import { compressImage } from "@/lib/compressImage";
import { getImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { ImageIcon, Loader2, Star, Upload, X } from "lucide-react";
import Image from "next/image";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

export interface MultiImagePickerRef {
  uploadPending(): Promise<string[]>;
  hasPending: boolean;
  getExistingKeys(): string[];
}

interface PendingItem {
  file: File;
  preview: string; // object URL of original file
}

interface Props {
  currentKeys?: string[]; // already uploaded imageKeys from DB
  maxImages?: number;
  className?: string;
}

const MultiImagePicker = forwardRef<MultiImagePickerRef, Props>(
  ({ currentKeys = [], maxImages = 5, className }, ref) => {
    const [existing, setExisting] = useState<string[]>(currentKeys);
    const [pending, setPending] = useState<PendingItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync existing when parent currentKeys prop changes (e.g. switching products)
    useEffect(() => {
      setExisting(currentKeys);
      setPending([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentKeys.join(",")]);

    // Revoke object URLs on unmount
    useEffect(() => {
      return () => pending.forEach((p) => URL.revokeObjectURL(p.preview));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      get hasPending() {
        return pending.length > 0;
      },
      getExistingKeys(): string[] {
        return existing;
      },
      async uploadPending(): Promise<string[]> {
        if (pending.length === 0) return [];
        setUploading(true);
        try {
          const results = await Promise.all(
            pending.map(async (item) => {
              const compressed = await compressImage(item.file);
              const fd = new FormData();
              fd.append("file", compressed);
              fd.append("folder", "products");
              const r = await fetch(API_ENDPOINTS.admin.imageUpload, {
                method: "POST",
                body: fd,
              });
              if (!r.ok) throw new Error("Зураг байршуулахад алдаа гарлаа");
              return r.json() as Promise<{ key: string }>;
            }),
          );

          pending.forEach((item) => URL.revokeObjectURL(item.preview));
          setPending([]);
          return results.map((r) => r.key);
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Upload алдаа");
          return [];
        } finally {
          setUploading(false);
        }
      },
    }));

    const totalSlots = existing.length + pending.length;
    const canAdd = totalSlots < maxImages;

    // Synchronous — adds previews immediately, compression happens at upload time
    const handleFiles = (files: FileList) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      const newItems: PendingItem[] = [];
      for (const file of Array.from(files)) {
        if (totalSlots + newItems.length >= maxImages) {
          toast.error(`Хамгийн ихдээ ${maxImages} зураг оруулна уу`);
          break;
        }
        if (!allowed.includes(file.type)) {
          toast.error(`${file.name}: jpg, png, webp форматтай байх ёстой`);
          continue;
        }
        newItems.push({ file, preview: URL.createObjectURL(file) });
      }
      if (newItems.length > 0) setPending((prev) => [...prev, ...newItems]);
    };

    const removeExisting = (idx: number) => {
      setExisting((prev) => prev.filter((_, i) => i !== idx));
    };
    const removePending = (idx: number) => {
      setPending((prev) => {
        URL.revokeObjectURL(prev[idx].preview);
        return prev.filter((_, i) => i !== idx);
      });
    };

    const setPrimaryExisting = (idx: number) => {
      if (idx === 0) return;
      setExisting((prev) => {
        const updated = [...prev];
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
        return updated;
      });
    };

    const setPrimaryPending = (idx: number) => {
      if (idx === 0) return;
      setPending((prev) => {
        const updated = [...prev];
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
        return updated;
      });
    };

    return (
      <div className={cn("space-y-3", className)}>
        <div className="grid grid-cols-3 gap-2">
          {/* Existing uploaded images */}
          {existing.map((key, i) => (
            <div
              key={key}
              className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted group"
            >
              <Image
                src={getImageUrl(key, { width: 300 })}
                alt={`Зураг ${i + 1}`}
                fill
                className="object-cover"
              />
              {!uploading && (
                <>
                  <button
                    type="button"
                    onClick={() => removeExisting(i)}
                    className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimaryExisting(i)}
                      title="Гол зураг болгох"
                      className="absolute top-1 left-1 bg-background/80 hover:bg-amber-400 hover:text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-primary/80 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  Гол
                </span>
              )}
            </div>
          ))}

          {/* Pending (local preview) images */}
          {pending.map((item, i) => (
            <div
              key={item.preview}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-amber-400 bg-muted group"
            >
              <Image
                src={item.preview}
                alt={`Хүлээгдэж буй зураг ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              {!uploading && (
                <>
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {existing.length === 0 && i !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimaryPending(i)}
                      title="Гол зураг болгох"
                      className="absolute top-1 left-1 bg-background/80 hover:bg-amber-400 hover:text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
              {existing.length === 0 && i === 0 && (
                <span className="absolute bottom-1 left-1 bg-primary/80 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  Гол
                </span>
              )}
              <span className="absolute bottom-1 right-1 bg-amber-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                Upload хийгдэнэ
              </span>
            </div>
          ))}

          {/* Add slot */}
          {canAdd && totalSlots > 0 && !uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs">Нэмэх</span>
            </button>
          )}

          {/* Upload loading overlay */}
          {uploading && (
            <div className="aspect-square rounded-xl border bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs">Upload...</span>
            </div>
          )}

          {/* Empty state — no images at all */}
          {totalSlots === 0 && !uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="col-span-3 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
            >
              <ImageIcon className="w-8 h-8" />
              <p className="text-sm font-medium">Зураг нэмэх</p>
              <p className="text-xs">
                JPG, PNG, WEBP • max 5MB • {maxImages} зураг хүртэл
              </p>
            </button>
          )}
        </div>

        {totalSlots > 0 && (
          <p className="text-xs text-muted-foreground">
            {totalSlots}/{maxImages} зураг
            {pending.length > 0 && (
              <span className="ml-1 text-amber-600">
                • {pending.length} хадгалахад upload хийгдэнэ
              </span>
            )}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    );
  },
);

MultiImagePicker.displayName = "MultiImagePicker";
export default MultiImagePicker;
