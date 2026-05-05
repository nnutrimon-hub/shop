import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <ShieldX className="w-16 h-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Хандах эрхгүй</h1>
        <p className="text-muted-foreground">
          Энэ хуудсанд хандах эрх таньд байхгүй байна.
        </p>
        <Button render={<Link href="/" />}>
          Нүүр хуудас руу буцах
        </Button>
      </div>
    </div>
  );
}
