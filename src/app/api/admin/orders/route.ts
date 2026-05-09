import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (
    !session ||
    !["admin", "superadmin", "moderator"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim().slice(0, 50);
    const skip = (page - 1) * limit;

    const baseFilter: Record<string, unknown> = {};
    if (status) baseFilter.status = status;

    const filter = q
      ? mongoose.trusted({
          ...baseFilter,
          $or: [
            { orderId: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
            { recipientName: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
            { phone: q },
          ],
        })
      : baseFilter;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
