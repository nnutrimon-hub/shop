import crypto from "crypto";

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "jpg";
}

export function getImageUrl(key: string, opts: ImageOptions = {}): string {
  const { width, height, quality = 100, format = "auto" } = opts;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !key) return "";

  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    "c_fill",
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${key}`;
}

export function generateUploadSignature(folder = "products"): {
  timestamp: number;
  signature: string;
  folder: string;
} {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) throw new Error("Missing ENV: CLOUDINARY_API_SECRET");

  const timestamp = Math.round(Date.now() / 1000);
  const params = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha256")
    .update(params + apiSecret)
    .digest("hex");

  return { timestamp, signature, folder };
}
