import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { sendOrderNotification } from "@/lib/telegram";
import type { OrderStatus } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const { status } = await req.json() as { status: OrderStatus };

    const order = await Order.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === "paid" ? { paidAt: new Date() } : {}),
      },
      { new: true }
    ).populate("userId", "name phone");

    if (!order)
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });

    // Notify admin on paid status
    if (status === "paid") {
      try {
        await sendOrderNotification({
          orderId: order.orderId,
          customerName: order.recipientName,
          phone: order.phone,
          totalAmount: order.totalAmount + order.deliveryFee,
          district: order.district,
          address: order.address,
          items: order.items.map((i) => ({ name: i.name ?? "", quantity: i.quantity ?? 1 })),
        });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
