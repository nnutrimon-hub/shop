import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { csrfCheck } from "@/lib/security";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Нэр хэт богино байна")
    .max(100, "Нэр хэт урт байна"),
  email: z
    .string()
    .email("И-мэйл буруу байна")
    .max(254, "И-мэйл хэт урт байна"),
  password: z
    .string()
    .min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт байна")
    .max(128, "Нууц үг хэт урт байна")
    .regex(/[A-Za-z]/, "Нууц үг үсэг агуулсан байх ёстой")
    .regex(/[0-9]/, "Нууц үг тоо агуулсан байх ёстой"),
});

export async function POST(req: NextRequest) {
  const csrf = csrfCheck(req);
  if (csrf) return csrf;

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
