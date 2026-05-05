"use client";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { USER_ROLE_LABELS } from "@/types/labels";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Профайл</h1>

      <Tabs defaultValue="info">
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="info">Мэдээлэл</TabsTrigger>
            <TabsTrigger value="security">Аюулгүй байдал</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info" className="mt-4">
          <div className="p-6 rounded-xl border bg-card space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={session.user?.image ?? ""} />
                <AvatarFallback className="text-lg">
                  {session.user?.name?.[0]?.toUpperCase() ?? "Х"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{session.user?.name}</p>
                <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                <Badge variant="outline" className="mt-1">
                  {USER_ROLE_LABELS[session.user?.role ?? "user"] ?? session.user?.role}
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="p-6 rounded-xl border bg-card">
            <p className="text-muted-foreground text-sm">
              Нууц үг солих функц удахгүй нэмэгдэнэ.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
