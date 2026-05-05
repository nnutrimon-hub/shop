import { NextRequest, NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  // Lazy import keeps auth.ts (bcryptjs) out of module init
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME тохируулаагүй байна" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const folder = (body as { folder?: string }).folder ?? "products";

    const { timestamp, signature } = generateUploadSignature(folder);

    // Return only timestamp + signature + public keys — never API_SECRET
    return NextResponse.json({
      timestamp,
      signature,
      folder,
      cloud_name: cloudName,
      api_key: process.env.CLOUDINARY_API_KEY,
    });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
