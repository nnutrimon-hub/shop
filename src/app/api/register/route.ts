import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Нэр хэт богино байна"),
  email: z.string().email("И-мэйл буруу байна"),
  password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const cleanName = DOMPurify.sanitize(name, { ALLOWED_TAGS: [] });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: cleanName,
      email: email.toLowerCase(),
      password: hashed,
      provider: "credentials",
      role: "user",
    });

    return NextResponse.json(
      { message: "Бүртгэл амжилттай", id: user._id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
