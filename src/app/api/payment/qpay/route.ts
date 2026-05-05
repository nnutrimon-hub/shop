import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { createQPayInvoice } from "@/lib/qpay";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  }

  try {
    await connectDB();
    const { orderId } = await req.json();

    const order = await Order.findById(orderId);
    if (!order)
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });

    // IDOR check
    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
    }

    const invoice = await createQPayInvoice({
      orderId: order.orderId,
      amount: order.totalAmount + order.deliveryFee,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/qpay/callback`,
    });

    await Order.findByIdAndUpdate(order._id, {
      qpayInvoiceId: invoice.invoice_id,
      qpayShortUrl: invoice.qPay_shortUrl,
    });

    return NextResponse.json({
      invoiceId: invoice.invoice_id,
      qpayUrl: invoice.qPay_shortUrl,
      qrImage: invoice.qr_image,
      urls: invoice.urls,
    });
  } catch {
    return NextResponse.json({ error: "QPay холболтод алдаа гарлаа" }, { status: 500 });
  }
}
