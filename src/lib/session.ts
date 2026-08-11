import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";

export async function requireSession(roles?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (roles && !roles.includes(session.user.role)) {
    redirect(homeForRole(session.user.role));
  }
  return session;
}

export function homeForRole(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "CLUB_STAFF") return "/scan";
  return "/qr";
}
