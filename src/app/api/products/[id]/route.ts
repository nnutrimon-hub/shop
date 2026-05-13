import { connectDB } from "@/lib/mongoose";
import { csrfCheck } from "@/lib/security";
import { deleteFiles } from "@/lib/storage-server";
import Product from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";

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
  const csrf = csrfCheck(req);
  if (csrf) return csrf;

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

    if (
      (body.name && body.name.length > 200) ||
      (body.brand && body.brand.length > 100) ||
      (body.barcode && body.barcode.length > 50) ||
      (body.description && body.description.length > 2000)
    ) {
      return NextResponse.json(
        { error: "Текстэн талбар хэт урт байна" },
        { status: 400 },
      );
    }

    if (Array.isArray(body.variants)) {
      const tooLong = body.variants.some(
        (v: { label?: unknown }) =>
          typeof v?.label === "string" && v.label.length > 50,
      );
      if (tooLong) {
        return NextResponse.json(
          { error: "Хэмжээний нэр хэт урт байна" },
          { status: 400 },
        );
      }
    }

    const existing = await Product.findById(id);
    if (!existing)
      return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });
    //image delete

    const oldKeys = (existing.imageKeys ?? [])
      .map((k) => String(k).trim())
      .filter(Boolean);

    let removedKeys: string[] = [];
    if (Array.isArray(body.imageKeys)) {
      const newKeys = body.imageKeys
        .map((k: unknown) => String(k).trim())
        .filter(Boolean);
      body.imageKeys = newKeys;

      const newSet = new Set(newKeys);
      removedKeys = oldKeys.filter((k) => !newSet.has(k));
    }

    if (body.price && body.price !== existing.price) {
      body.$push = {
        priceHistory: { price: existing.price, changedAt: new Date() },
      };
    }

    const updated = await Product.findByIdAndUpdate(id, body, { new: true });
    if (removedKeys.length > 0) {
      deleteFiles(removedKeys).catch((err: unknown) => {
        console.error("[R2 delete error]", err);
      });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const csrf = csrfCheck(req);
  if (csrf) return csrf;

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const existing = await Product.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });
    }

    await Product.findByIdAndUpdate(id, { isDeleted: true });

    const keys = (existing.imageKeys ?? [])
      .map((k) => String(k).trim())
      .filter(Boolean);
    if (keys.length > 0) {
      deleteFiles(keys).catch((err: unknown) => {
        console.error("[R2 delete error on product delete]", err);
      });
    }

    return NextResponse.json({ message: "Бараа устгагдлаа" });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
