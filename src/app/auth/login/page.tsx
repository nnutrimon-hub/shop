"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const LoginSchema = z.object({
  email: z
    .string()
    .email("И-мэйл буруу байна")
    .max(254, "И-мэйл хэт урт байна"),
  password: z
    .string()
    .min(1, "Нууц үг оруулна уу")
    .max(128, "Нууц үг хэт урт байна"),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleFacebookLogin = () => signIn("facebook", { callbackUrl: "/" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      toast.error("И-мэйл эсвэл нууц үг буруу байна");
    } else {
      toast.success("Амжилттай нэвтэрлээ");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Нэвтрэх</h1>
          <p className="text-sm text-muted-foreground">
            Бүртгэлгүй юу?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline"
            >
              Бүртгүүлэх
            </Link>
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Google-р нэвтрэх
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleFacebookLogin}
          >
            Facebook-р нэвтрэх
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">эсвэл</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <PasswordInput
              id="password"
              maxLength={128}
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </Button>
        </form>
      </div>
    </div>
  );
}
