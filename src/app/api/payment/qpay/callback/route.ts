import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { checkQPayPayment } from "@/lib/qpay";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { payment_id, invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: "invoice_id шаардлагатай" }, { status: 400 });
    }

    const paymentCheck = await checkQPayPayment(invoice_id);

    if (paymentCheck.count > 0 && paymentCheck.paid_amount > 0) {
      await Order.findOneAndUpdate(
        { qpayInvoiceId: invoice_id },
        {
          status: "paid",
          paidAt: new Date(),
        }
      );
    }

    return NextResponse.json({ success: true, payment_id });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
