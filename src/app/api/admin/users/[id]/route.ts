import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { csrfCheck } from "@/lib/security";
import type { UserRole } from "@/models/User";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const UserRoleSchema = z.enum(["user", "moderator", "admin", "superadmin"]);

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const csrf = csrfCheck(req);
  if (csrf) return csrf;

  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const parsed = z.object({ role: UserRoleSchema }).safeParse(
      await req.json()
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Хэрэглэгчийн эрх буруу байна" },
        { status: 400 }
      );
    }
    const role = parsed.data.role as UserRole;

    // Only superadmin can assign roles
    if (role && session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Зөвхөн супер админ эрх олгох боломжтой" },
        { status: 403 }
      );
    }

    if (session.user.id === id && role !== session.user.role) {
      return NextResponse.json(
        { error: "Өөрийн эрхийг өөрчлөх боломжгүй" },
        { status: 400 }
      );
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password -__v -resetToken -resetTokenExpiry");

    if (!updated)
      return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
