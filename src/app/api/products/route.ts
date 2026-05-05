import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { slugify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

function csrfCheck(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && origin && origin !== appUrl) {
    return NextResponse.json({ error: "CSRF шалгалт амжилтгүй" }, { status: 403 });
  }
  return null;
}

/** BFS to collect the given categoryId plus all its descendants */
async function getDescendantIds(rootId: string): Promise<mongoose.Types.ObjectId[]> {
  const all = await Category.find().select("_id parent").lean();
  const parentMap = new Map<string, string>();
  for (const c of all) {
    if (c.parent) parentMap.set(String(c._id), String(c.parent));
  }

  const result: mongoose.Types.ObjectId[] = [];
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(new mongoose.Types.ObjectId(current));
    for (const c of all) {
      if (String(c.parent) === current) {
        queue.push(String(c._id));
      }
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const categoryId = searchParams.get("category_id");
    const q = searchParams.get("q");
    const featured = searchParams.get("featured");
    const sale = searchParams.get("sale");

    const filter: Record<string, unknown> = {};

    if (categoryId && /^[a-f\d]{24}$/i.test(categoryId)) {
      const ids = await getDescendantIds(categoryId);
      // mongoose.trusted() is required because sanitizeFilter: true strips $in
      filter.category = mongoose.trusted({ $in: ids });
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      Object.assign(
        filter,
        mongoose.trusted({
          $or: [
            { name: new RegExp(escaped, "i") },
            { brand: new RegExp(escaped, "i") },
            { barcode: new RegExp(escaped, "i") },
          ],
        }),
      );
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (sale === "true") {
      filter.salePrice = mongoose.trusted({ $ne: null, $gt: 0 });
    }

    const skip = (page - 1) * limit;
    const countFilter = { ...filter, isDeleted: false };
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug parent")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(countFilter),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (err: unknown) {
    const msg = process.env.NODE_ENV === "development" && err instanceof Error ? err.message : "Алдаа гарлаа";
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

    const { default: DOMPurify } = await import("isomorphic-dompurify");
    body.name = DOMPurify.sanitize(body.name ?? "", { ALLOWED_TAGS: [] });
    body.brand = DOMPurify.sanitize(body.brand ?? "", { ALLOWED_TAGS: [] });
    body.barcode = DOMPurify.sanitize(body.barcode ?? "", { ALLOWED_TAGS: [] });
    body.description = DOMPurify.sanitize(body.description ?? "", {
      ALLOWED_TAGS: ["b", "i", "br", "p"],
    });

    if (!body.slug) {
      body.slug = `${slugify(body.name)}-${Date.now()}`;
    }

    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Алдаа гарлаа";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
