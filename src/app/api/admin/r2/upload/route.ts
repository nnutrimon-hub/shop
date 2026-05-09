import { uploadFile } from "@/lib/storage-server";
import { csrfCheck } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_FOLDERS = new Set(["products", "categories"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest) {
  const csrf = csrfCheck(req);
  if (csrf) return csrf;

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
  }
  const folder = (formData.get("folder") as string) ?? "products";
  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Фолдер буруу байна" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Зөвхөн зураг файл оруулна уу" },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Файлын хэмжээ 5MB-аас их байна" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await uploadFile(
      buffer,
      sanitizeFilename(file.name),
      file.type,
      folder
    );
    return NextResponse.json({ key });
  } catch (err) {
    console.error("[R2 upload error]", err);
    return NextResponse.json({ error: "Upload алдаа гарлаа" }, { status: 500 });
  }
}
