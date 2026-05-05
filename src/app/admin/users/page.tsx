"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { useRole } from "@/hooks/use-role";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useInfiniteAdminUsers } from "@/services/hooks/useUsers";
import { queryKeys } from "@/utils/queryKeys";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { formatDate } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/types/labels";
import { toast } from "sonner";
import type { UserRole } from "@/lib/auth";
import { Users, Loader2, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["user", "moderator", "admin", "superadmin"];

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-red-100 text-red-700 border-red-200",
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  moderator: "bg-blue-100 text-blue-700 border-blue-200",
  user: "bg-muted text-muted-foreground border-border",
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  credentials: "Email",
};

function AdminUsersContent() {
  const { isSuperAdmin } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [inputQ, setInputQ] = useState(q);
  const debouncedQ = useDebounce(inputQ, 400);
  const qc = useQueryClient();

  useEffect(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (debouncedQ) p.set("q", debouncedQ);
    else p.delete("q");
    router.replace(`${pathname}?${p}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteAdminUsers(debouncedQ);

  const sentinelRef = useInfiniteScroll(
    useCallback(() => fetchNextPage(), [fetchNextPage]),
    !!hasNextPage && !isFetchingNextPage,
  );

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const res = await fetch(API_ENDPOINTS.admin.users.detail(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Алдаа гарлаа");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Эрх шинэчлэгдлээ");
      qc.invalidateQueries({ queryKey: queryKeys.admin.users(debouncedQ) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const users = data?.pages.flatMap((p) => p.users) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Хэрэглэгч удирдах</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {debouncedQ
              ? `${users.length} / ${total} олдлоо`
              : `Нийт ${total} хэрэглэгч`}
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Нэр, имэйлээр хайх..."
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            className="pl-9 md:w-52 w-full"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground border-2 border-dashed rounded-2xl">
          <Users className="w-14 h-14 opacity-20" />
          <p className="font-medium">
            {q ? "Хайлтын үр дүн олдсонгүй" : "Хэрэглэгч байхгүй байна"}
          </p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">
                  Хэрэглэгч
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden sm:table-cell">
                  Нэвтрэх
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden md:table-cell">
                  Бүртгэлийн огноо
                </th>
                <th className="px-4 py-3 w-40 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Эрх
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={u.image ?? ""} />
                        <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                          {u.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs font-normal">
                      {PROVIDER_LABELS[u.provider] ?? u.provider}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSuperAdmin ? (
                      <Select
                        value={u.role}
                        onValueChange={(role) =>
                          updateRole.mutate({
                            id: u._id,
                            role: role as UserRole,
                          })
                        }
                      >
                        <SelectTrigger className="w-36 h-8 text-xs ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {USER_ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        className={cn(
                          "text-xs border font-medium",
                          ROLE_COLORS[u.role] ??
                            "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {USER_ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersContent />
    </Suspense>
  );
}
