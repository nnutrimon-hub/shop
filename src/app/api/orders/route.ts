import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { nextOrderId } from "@/models/Counter";
import { createQPayInvoice } from "@/lib/qpay";
import { sendOrderNotification } from "@/lib/telegram";
import DOMPurify from "isomorphic-dompurify";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId: session.user.id }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();

    // Sanitize user inputs
    const recipientName = DOMPurify.sanitize(body.recipientName ?? "", { ALLOWED_TAGS: [] });
    const address = DOMPurify.sanitize(body.address ?? "", { ALLOWED_TAGS: [] });
    const phone = DOMPurify.sanitize(body.phone ?? "", { ALLOWED_TAGS: [] });
    const district = DOMPurify.sanitize(body.district ?? "", { ALLOWED_TAGS: [] });

    if (!recipientName || !address || !phone || !district || !body.items?.length) {
      return NextResponse.json({ error: "Шаардлагатай талбарууд дутуу байна" }, { status: 400 });
    }

    // Validate stock & build order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of body.items) {
      const product = await Product.findById(item.productId)
        .select("name imageKey price stock")
        .lean() as { _id: { toString(): string }; name: string; imageKey: string; price: number; stock: number } | null;

      if (!product) {
        return NextResponse.json({ error: `Бараа олдсонгүй: ${item.productId}` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `"${product.name}" бараа хүрэлцэхгүй байна` },
          { status: 400 }
        );
      }

      orderItems.push({
        product: item.productId,
        name: product.name,
        imageKey: product.imageKey,
        price: product.price,
        quantity: item.quantity,
      });
      totalAmount += product.price * item.quantity;
    }

    const deliveryFee = Number(body.deliveryFee) || 0;
    const year = new Date().getFullYear();
    const orderId = await nextOrderId(year);

    const order = await Order.create({
      orderId,
      userId: session.user.id,
      items: orderItems,
      totalAmount,
      deliveryFee,
      status: "awaiting_payment",
      district,
      address,
      phone,
      recipientName,
    });

    // Decrement stock atomically
    for (const item of body.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Create QPay invoice
    let qpayUrl = null;
    try {
      const invoice = await createQPayInvoice({
        orderId,
        amount: totalAmount + deliveryFee,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/qpay/callback`,
      });
      await Order.findByIdAndUpdate(order._id, {
        qpayInvoiceId: invoice.invoice_id,
        qpayShortUrl: invoice.qPay_shortUrl,
      });
      qpayUrl = invoice.qPay_shortUrl;
    } catch {
      // QPay failure doesn't block order creation
    }

    // Telegram notification
    try {
      await sendOrderNotification({
        orderId,
        customerName: recipientName,
        phone,
        totalAmount: totalAmount + deliveryFee,
        district,
        address,
        items: orderItems.map((i) => ({ name: i.name, quantity: i.quantity })),
      });
    } catch {
      // Telegram failure is non-critical
    }

    return NextResponse.json(
      { orderId, qpayUrl, _id: order._id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Захиалга үүсгэхэд алдаа гарлаа" }, { status: 500 });
  }
}
