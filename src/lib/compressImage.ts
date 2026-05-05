import imageCompression from "browser-image-compression";

// Returns target MB — aggressive enough to shrink, gentle enough to keep quality.
export function calculateMaxSizeMB(fileSizeBytes: number): number {
  const mb = fileSizeBytes / (1024 * 1024);
  if (mb <= 0.5) return mb;
  if (mb <= 1) return mb * 0.8; // already small — don't touch
  if (mb <= 1.5) return Math.max(0.8, mb * 0.6); // already small — don't touch
  if (mb <= 3) return Math.max(0.8, mb * 0.5);
  if (mb <= 10) return Math.max(1.0, mb * 0.4);
  if (mb <= 30) return Math.max(1.5, mb * 0.3);
  if (mb <= 100) return Math.max(2.0, mb * 0.25);
  return Math.max(2.5, mb * 0.2);
}

export async function compressImage(file: File): Promise<File> {
  const maxSizeMB = calculateMaxSizeMB(file.size);
  return imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight: 1600,
    initialQuality: 0.7,
    useWebWorker: true,
    preserveExif: false,
    fileType: "image/webp",
  });
}
