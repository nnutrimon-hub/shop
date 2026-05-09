import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { csrfCheck } from "@/lib/security";
import { nextOrderId } from "@/models/Counter";
import { createQPayInvoice } from "@/lib/qpay";
import { sendOrderNotification } from "@/lib/telegram";
import DOMPurify from "isomorphic-dompurify";
import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, {
  message: "Барааны ID буруу байна",
});

const OrderItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z
    .number({ invalid_type_error: "Тоо ширхэг буруу байна" })
    .int("Тоо ширхэг бүхэл тоо байх ёстой")
    .positive("Тоо ширхэг 0-ээс их байх ёстой")
    .max(100, "Нэг бараанаас 100-аас их захиалах боломжгүй"),
});

const CreateOrderSchema = z.object({
  recipientName: z.string().min(1, "Хүлээн авагчийн нэр оруулна уу").max(100),
  phone: z.string().min(6, "Утасны дугаар буруу байна").max(20),
  district: z.string().min(1, "Дүүрэг сонгоно уу").max(100),
  address: z.string().min(1, "Хаяг оруулна уу").max(500),
  paymentMethod: z.enum(["qpay", "cod"]).default("qpay"),
  deliveryFee: z.number().min(0).max(1_000_000).default(0),
  items: z.array(OrderItemSchema).min(1, "Сагс хоосон байна").max(50),
});

type DecrementedItem = { productId: string; quantity: number };

async function rollbackStock(items: DecrementedItem[]) {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      })
    )
  );
}

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
  const csrf = csrfCheck(req);
  if (csrf) return csrf;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Sanitize user inputs
    const recipientName = DOMPurify.sanitize(data.recipientName, {
      ALLOWED_TAGS: [],
    });
    const address = DOMPurify.sanitize(data.address, { ALLOWED_TAGS: [] });
    const phone = DOMPurify.sanitize(data.phone, { ALLOWED_TAGS: [] });
    const district = DOMPurify.sanitize(data.district, { ALLOWED_TAGS: [] });
    const paymentMethod = data.paymentMethod;

    if (!recipientName || !address || !phone || !district) {
      return NextResponse.json(
        { error: "Шаардлагатай талбарууд дутуу байна" },
        { status: 400 },
      );
    }

    if (
      recipientName.length > 100 ||
      phone.length > 20 ||
      district.length > 100 ||
      address.length > 500
    ) {
      return NextResponse.json(
        { error: "Хүргэлтийн мэдээлэл хэт урт байна" },
        { status: 400 },
      );
    }

    // Validate stock & build order items
    const orderItems = [];
    const decremented: DecrementedItem[] = [];
    let totalAmount = 0;

    for (const item of data.items) {
      const product = (await Product.findById(item.productId)
        .select("name imageKey price stock")
        .lean()) as {
        _id: { toString(): string };
        name: string;
        imageKey: string;
        price: number;
        stock: number;
      } | null;

      if (!product) {
        return NextResponse.json({ error: `Бараа олдсонгүй: ${item.productId}` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `"${product.name}" бараа хүрэлцэхгүй байна` },
          { status: 400 }
        );
      }

      const updated = await Product.findOneAndUpdate(
        mongoose.trusted({
          _id: item.productId,
          stock: { $gte: item.quantity },
        }),
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        await rollbackStock(decremented);
        return NextResponse.json(
          { error: `"${product.name}" бараа хүрэлцэхгүй байна` },
          { status: 400 }
        );
      }

      decremented.push({
        productId: item.productId,
        quantity: item.quantity,
      });

      orderItems.push({
        product: item.productId,
        name: product.name,
        imageKey: product.imageKey,
        price: product.price,
        quantity: item.quantity,
      });
      totalAmount += product.price * item.quantity;
    }

    const deliveryFee = data.deliveryFee;
    const year = new Date().getFullYear();
    const orderId = await nextOrderId(year);

    let order;
    try {
      order = await Order.create({
        orderId,
        userId: session.user.id,
        items: orderItems,
        totalAmount,
        deliveryFee,
        status: paymentMethod === "qpay" ? "awaiting_payment" : "pending",
        paymentMethod,
        district,
        address,
        phone,
        recipientName,
      });
    } catch {
      await rollbackStock(decremented);
      return NextResponse.json(
        { error: "Захиалга үүсгэхэд алдаа гарлаа" },
        { status: 500 }
      );
    }

    // Create QPay invoice (only when QPay is selected)
    let qpayUrl = null;
    if (paymentMethod === "qpay") {
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
        paymentMethod,
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
