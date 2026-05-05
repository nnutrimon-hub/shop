import { uploadFile } from "@/lib/storage-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await uploadFile(buffer, file.name, file.type, folder);
    return NextResponse.json({ key });
  } catch (err) {
    console.error("[R2 upload error]", err);
    return NextResponse.json({ error: "Upload алдаа гарлаа" }, { status: 500 });
  }
}
