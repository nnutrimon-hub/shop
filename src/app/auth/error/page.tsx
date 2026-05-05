"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Тохиргооны алдаа гарлаа. Системийн администратортай холбогдоно уу.",
  AccessDenied: "Нэвтрэх эрх хаагдсан байна.",
  Verification: "Баталгаажуулах холбоос хүчинтэй биш эсвэл хэдийнэ ашиглагдсан.",
  Default: "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-xl font-bold">Нэвтрэхэд алдаа гарлаа</h1>
        <p className="text-muted-foreground">{message}</p>
        <Button render={<Link href="/auth/login" />}>
          Дахин оролдох
        </Button>
      </div>
    </div>
  );
}
