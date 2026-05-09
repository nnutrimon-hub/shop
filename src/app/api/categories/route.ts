import { connectDB } from "@/lib/mongoose";
import { csrfCheck } from "@/lib/security";
import { slugify } from "@/lib/utils";
import Category from "@/models/Category";
import DOMPurify from "isomorphic-dompurify";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 0;
    const limit = page > 0 ? Math.min(100, parseInt(searchParams.get("limit") ?? "30")) : 0;
    const q = searchParams.get("q")?.trim().slice(0, 50);

    const filter = q
      ? mongoose.trusted({
          name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        })
      : {};

    // Paginated response (admin infinite scroll)
    if (page > 0) {
      const [categories, total] = await Promise.all([
        Category.find(filter)
          .select("name slug parent createdAt updatedAt")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Category.countDocuments(filter),
      ]);
      return NextResponse.json({ categories, total, page });
    }

    // Flat array response (sidebar / public)
    const categories = await Category.find(filter)
      .select("-description -imageKey -__v")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(categories);
  } catch (err: unknown) {
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Алдаа гарлаа";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const csrf = csrfCheck(req);
  if (csrf) return csrf;

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();

    body.name = DOMPurify.sanitize(String(body.name ?? ""), {
      ALLOWED_TAGS: [],
    }).trim();
    if (!body.name) {
      return NextResponse.json(
        { error: "Ангилалын нэр оруулна уу" },
        { status: 400 },
      );
    }
    if (body.name.length > 100) {
      return NextResponse.json(
        { error: "Ангилалын нэр хэт урт байна" },
        { status: 400 },
      );
    }
    if (!body.slug) body.slug = slugify(body.name) + "-" + Date.now();
    if (!body.parentId || body.parentId === "") {
      body.parent = null;
    } else {
      body.parent = body.parentId;
    }
    delete body.parentId;

    const category = await Category.create(body);
    const { _id, name, slug, parent, createdAt, updatedAt } = category.toObject();
    return NextResponse.json({ _id, name, slug, parent: parent ?? null, createdAt, updatedAt }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Алдаа гарлаа";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
