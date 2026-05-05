import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type UserRole = "superadmin" | "admin" | "moderator" | "user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID ?? "",
      clientSecret: process.env.AUTH_FACEBOOK_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "И-мэйл", type: "email" },
        password: { label: "Нууц үг", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          await connectDB();
          const { default: User } = await import("@/models/User");
          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase(),
          }).select("+password");

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image ?? null,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider === "google" ||
        account?.provider === "facebook"
      ) {
        await connectDB();
        const { default: User } = await import("@/models/User");
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: account.provider,
            role: "user",
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
        token.image = user.image;
      }
      if (
        account?.provider === "google" ||
        account?.provider === "facebook"
      ) {
        await connectDB();
        const { default: User } = await import("@/models/User");
        const dbUser = await User.findOne({ email: token.email })
          .select("_id role image")
          .lean() as { _id: { toString(): string }; role: string; image?: string } | null;

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.image = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string | null;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/login", error: "/auth/error" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});

// ── RBAC helper ──────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (
  req: NextRequest,
  ctx: RouteContext
) => Promise<NextResponse | Response>;

export function withRole(
  roles: UserRole[],
  handler: RouteHandler
): RouteHandler {
  return async (req, ctx) => {
    const session = await auth();
    if (!session || !roles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
    }
    return handler(req, ctx);
  };
}
