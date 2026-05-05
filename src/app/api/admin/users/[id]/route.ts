import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const { role } = await req.json() as { role: UserRole };

    // Only superadmin can assign roles
    if (role && session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Зөвхөн супер админ эрх олгох боломжтой" },
        { status: 403 }
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
