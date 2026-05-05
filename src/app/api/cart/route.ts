import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import type { Session } from "next-auth";

async function getCartFilter(req: NextRequest, session: Session | null) {
  if (session?.user?.id) {
    return { userId: new mongoose.Types.ObjectId(session.user.id) };
  }
  const guestId = req.headers.get("x-guest-id");
  if (guestId) return { guestId };
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const filter = await getCartFilter(req, session);
    if (!filter) return NextResponse.json({ items: [] });

    const cart = await Cart.findOne(filter)
      .populate("items.product", "name imageKey price stock")
      .lean();

    return NextResponse.json(cart ?? { items: [] });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const filter = await getCartFilter(req, session);
    if (!filter) {
      return NextResponse.json({ error: "Зочин ID шаардлагатай" }, { status: 400 });
    }

    const { productId, quantity = 1 } = await req.json();

    const product = await Product.findById(productId).select("name imageKey price stock").lean() as {
      _id: mongoose.Types.ObjectId;
      name: string;
      imageKey: string;
      price: number;
      stock: number;
    } | null;

    if (!product)
      return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });
    if (product.stock < quantity)
      return NextResponse.json({ error: "Хүрэлцэхгүй байна" }, { status: 400 });

    let cart = await Cart.findOne(filter);

    if (!cart) {
      cart = await Cart.create({
        ...filter,
        items: [
          {
            product: product._id,
            name: product.name,
            imageKey: product.imageKey,
            price: product.price,
            quantity,
          },
        ],
      });
    } else {
      const existingIdx = cart.items.findIndex(
        (i) => i.product.toString() === productId
      );
      if (existingIdx >= 0) {
        cart.items[existingIdx].quantity += quantity;
      } else {
        cart.items.push({
          product: new mongoose.Types.ObjectId(productId),
          name: product.name,
          imageKey: product.imageKey,
          price: product.price,
          quantity,
        });
      }
      await cart.save();
    }

    return NextResponse.json(cart);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const filter = await getCartFilter(req, session);
    if (!filter) return NextResponse.json({ error: "Зочин ID шаардлагатай" }, { status: 400 });

    const { productId, quantity } = await req.json();
    const cart = await Cart.findOne(filter);
    if (!cart)
      return NextResponse.json({ error: "Сагс олдсонгүй" }, { status: 404 });

    const idx = cart.items.findIndex((i) => i.product.toString() === productId);
    if (idx < 0)
      return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }

    await cart.save();
    return NextResponse.json(cart);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Нэвтрээгүй" }, { status: 401 });

    await connectDB();
    const { items } = await req.json();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    await Cart.findOneAndUpdate(
      { userId },
      {
        userId,
        items: (items ?? []).map((item: { productId: string; name: string; imageKey: string; price: number; quantity: number }) => ({
          product: new mongoose.Types.ObjectId(item.productId),
          name: item.name,
          imageKey: item.imageKey,
          price: item.price,
          quantity: item.quantity,
        })),
        expireAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const filter = await getCartFilter(req, session);
    if (!filter) return NextResponse.json({ error: "Зочин ID шаардлагатай" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (productId) {
      const cart = await Cart.findOne(filter);
      if (cart) {
        cart.items = cart.items.filter((i) => i.product.toString() !== productId);
        await cart.save();
        return NextResponse.json(cart);
      }
    } else {
      await Cart.findOneAndDelete(filter);
    }

    return NextResponse.json({ message: "Устгагдлаа" });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
