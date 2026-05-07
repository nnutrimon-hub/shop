import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder = "products"
): Promise<string> {
  const key = `${folder}/${Date.now()}-${filename}`;
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

export async function deleteFile(key: string): Promise<void> {
  const k = key.trim();
  if (!k) return;
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: k,
    })
  );
}

export async function deleteFiles(keys: string[]): Promise<void> {
  const cleaned = Array.from(
    new Set(keys.map((k) => k.trim()).filter(Boolean))
  );
  if (cleaned.length === 0) return;
  if (cleaned.length === 1) {
    await deleteFile(cleaned[0]);
    return;
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Delete: {
        Objects: cleaned.map((Key) => ({ Key })),
        Quiet: true,
      },
    })
  );
}
