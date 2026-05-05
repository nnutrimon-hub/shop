import { connectDB } from "@/lib/mongoose";
import { slugify } from "@/lib/utils";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (body.name) {
      body.name = (body.name as string).replace(/<[^>]*>/g, "").trim();
      if (!body.slug) body.slug = slugify(body.name) + "-" + Date.now();
    }

    // Prevent circular parent (a category can't be its own parent)
    if (body.parentId !== undefined) {
      body.parent = body.parentId === "" || body.parentId === null ? null : body.parentId;
      delete body.parentId;
    }
    if (String(body.parent) === id) {
      return NextResponse.json({ error: "Өөрөө өөрийнхөө эцэг ангилал байж болохгүй" }, { status: 400 });
    }

    const updated = await Category.findByIdAndUpdate(id, body, { new: true })
      .select("name slug parent createdAt updatedAt")
      .lean();
    if (!updated)
      return NextResponse.json({ error: "Ангилал олдсонгүй" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Алдаа гарлаа";
    return NextResponse.json({ error: msg }, { status: 400 });
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

    const cat = await Category.findById(id);
    if (!cat) return NextResponse.json({ error: "Ангилал олдсонгүй" }, { status: 404 });

    // Block deletion if the category has products
    const productCount = await Product.countDocuments({ category: id, isDeleted: { $ne: true } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Энэ ангилалд ${productCount} бараа байгаа тул устгах боломжгүй` },
        { status: 400 },
      );
    }

    // Move children up to the deleted category's parent
    await Category.updateMany({ parent: id }, { parent: cat.parent ?? null });
    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: "Ангилал устгагдлаа" });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
