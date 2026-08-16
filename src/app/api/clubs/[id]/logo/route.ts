import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    select: { logoBytes: true, logoMime: true },
  });

  if (!club?.logoBytes || !club.logoMime) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(Buffer.from(club.logoBytes), {
    headers: {
      "Content-Type": club.logoMime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
