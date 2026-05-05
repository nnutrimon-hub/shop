import imageCompression from "browser-image-compression";

// Returns target MB — aggressive enough to shrink, gentle enough to keep quality.
export function calculateMaxSizeMB(fileSizeBytes: number): number {
  const mb = fileSizeBytes / (1024 * 1024);
  if (mb <= 0.8) return fileSizeBytes; // already small — don't touch
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
    maxWidthOrHeight: 1920,
    initialQuality: 1,
    useWebWorker: true,
    preserveExif: false,
  });
}

// import imageCompression from "browser-image-compression";

// export async function compressImage(file: File): Promise<File> {
//   const mb = file.size / (1024 * 1024);

//   if (mb <= 1) return file;

//   return imageCompression(file, {
//     maxSizeMB: Math.min(1.5, mb * 0.7),
//     maxWidthOrHeight: 2560,
//     initialQuality: 0.9,
//     useWebWorker: true,
//     preserveExif: false,
//   });
// }
