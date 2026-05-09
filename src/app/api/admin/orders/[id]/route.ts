import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { csrfCheck } from "@/lib/security";
import { sendOrderNotification } from "@/lib/telegram";
import type { OrderStatus } from "@/types";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const OrderStatusSchema = z.enum([
  "pending",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

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
    const parsed = z.object({ status: OrderStatusSchema }).safeParse(
      await req.json()
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Захиалгын төлөв буруу байна" },
        { status: 400 }
      );
    }
    const status = parsed.data.status as OrderStatus;

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
