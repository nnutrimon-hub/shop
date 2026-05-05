import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findOne({
      $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { slug: id }],
    })
      .populate("category", "name slug")
      .lean();

    if (!product)
      return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });

    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (
    !session ||
    !["admin", "superadmin", "moderator"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const { default: DOMPurify } = await import("isomorphic-dompurify");
    if (body.name)
      body.name = DOMPurify.sanitize(body.name, { ALLOWED_TAGS: [] });
    if (body.brand)
      body.brand = DOMPurify.sanitize(body.brand, { ALLOWED_TAGS: [] });
    if (body.barcode)
      body.barcode = DOMPurify.sanitize(body.barcode, { ALLOWED_TAGS: [] });
    if (body.description)
      body.description = DOMPurify.sanitize(body.description, {
        ALLOWED_TAGS: ["b", "i", "br", "p"],
      });

    const existing = await Product.findById(id);
    if (!existing)
      return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });

    if (body.price && body.price !== existing.price) {
      body.$push = {
        priceHistory: { price: existing.price, changedAt: new Date() },
      };
    }

    const updated = await Product.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    await Product.findByIdAndUpdate(id, { isDeleted: true });
    return NextResponse.json({ message: "Бараа устгагдлаа" });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
