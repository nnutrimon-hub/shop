import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import DeliveryZone from "@/models/DeliveryZone";

export async function GET() {
  try {
    await connectDB();
    const zones = await DeliveryZone.find().sort({ district: 1 }).lean();
    return NextResponse.json(zones);
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
