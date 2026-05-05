import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id).lean();

    if (!order)
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });

    // IDOR check
    const isOwner = order.userId.toString() === session.user.id;
    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
