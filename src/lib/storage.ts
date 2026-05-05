export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getImageUrl(key: string, opts?: ImageOptions): string {
  void opts; // R2 нь URL transform дэмжихгүй — opts хэрэглэгдэхгүй
  const base = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  if (!base || !key) return "";
  return `${base}/${key}`;
}
