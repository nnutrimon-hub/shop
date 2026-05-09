"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Нэр хамгийн багадаа 2 тэмдэгт")
      .max(100, "Нэр хэт урт байна"),
    email: z
      .string()
      .email("И-мэйл буруу байна")
      .max(254, "И-мэйл хэт урт байна"),
    password: z
      .string()
      .min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт")
      .max(128, "Нууц үг хэт урт байна"),
    confirm: z.string().max(128),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Нууц үг таарахгүй байна",
    path: ["confirm"],
  });

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error);
        return;
      }

      // Auto-login after registration
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      toast.success("Бүртгэл амжилттай!");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Бүртгүүлэх</h1>
          <p className="text-sm text-muted-foreground">
            Бүртгэлтэй юу?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Нэвтрэх
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Нэр</Label>
            <Input
              id="name"
              maxLength={100}
              placeholder="Таны нэр"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">И-мэйл</Label>
            <Input
              id="email"
              type="email"
              maxLength={254}
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Нууц үг</Label>
            <Input
              id="password"
              type="password"
              maxLength={128}
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Нууц үг давтах</Label>
            <Input
              id="confirm"
              type="password"
              maxLength={128}
              placeholder="••••••••"
              {...register("confirm")}
            />
            {errors.confirm && (
              <p className="text-xs text-destructive">{errors.confirm.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
          </Button>
        </form>
      </div>
    </div>
  );
}
