import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const role = session.user.role ?? "user";
  const isAllowed = ["admin", "superadmin", "moderator"].includes(role);
  if (!isAllowed) {
    redirect("/unauthorized");
  }

  return <AdminShell>{children}</AdminShell>;
}

