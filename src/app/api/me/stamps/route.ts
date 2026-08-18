import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getPassportStampsForUser } from "@/lib/passport-stamps";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const data = await getPassportStampsForUser(session.user.id);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
