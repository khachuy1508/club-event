import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishLeaderboardVote } from "@/lib/realtime";

const MAX_FAKE_VOTES = 20;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const clubs = await prisma.club.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    select: {
      id: true,
      nameEn: true,
      slug: true,
      _count: { select: { votes: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    clubs: clubs.map((club) => ({
      id: club.id,
      nameEn: club.nameEn,
      slug: club.slug,
      votes: club._count.votes,
    })),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    clubId?: string;
    slug?: string;
    count?: number;
  } | null;

  const count = Math.min(
    MAX_FAKE_VOTES,
    Math.max(1, Number.parseInt(String(body?.count ?? 1), 10) || 1),
  );

  const club = body?.clubId
    ? await prisma.club.findFirst({
        where: { id: body.clubId, isActive: true },
      })
    : body?.slug
      ? await prisma.club.findFirst({
          where: { slug: body.slug, isActive: true },
        })
      : null;

  if (!club) {
    return NextResponse.json(
      { ok: false, message: "Thiếu clubId hoặc slug hợp lệ" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash("test-vote-bot", 8);
  const created: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const studentId = `TEST${randomBytes(3).toString("hex").toUpperCase()}`;
    const user = await prisma.user.create({
      data: {
        studentId,
        name: `[TEST] Fake voter`,
        major: "ICT",
        passwordHash,
        role: Role.STUDENT,
      },
    });
    await prisma.vote.create({
      data: {
        studentId: user.id,
        clubId: club.id,
      },
    });
    created.push(studentId);
    await publishLeaderboardVote({
      clubId: club.id,
      clubName: club.name,
      at: new Date().toISOString(),
    });
  }

  revalidatePath("/leaderboard");
  revalidatePath("/admin");

  const votes = await prisma.vote.count({ where: { clubId: club.id } });

  return NextResponse.json({
    ok: true,
    message: `Đã cộng ${count} vote giả cho ${club.nameEn}`,
    clubId: club.id,
    clubName: club.nameEn,
    votes,
    fakeStudentIds: created,
  });
}
