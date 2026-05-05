"use client";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth";

export function useRole() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "user") as UserRole;

  return {
    role,
    isAdmin: role === "admin" || role === "superadmin",
    isSuperAdmin: role === "superadmin",
    isModerator: role === "moderator",
    isUser: role === "user",
    hasRole: (roles: UserRole[]) => roles.includes(role),
  };
}
