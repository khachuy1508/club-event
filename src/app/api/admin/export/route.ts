import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const [students, clubs, votes] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.STUDENT },
      orderBy: { createdAt: "desc" },
      include: {
        checkIns: { include: { club: true } },
        vote: { include: { club: true } },
      },
    }),
    prisma.club.findMany({
      include: {
        _count: { select: { checkIns: true, votes: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.vote.groupBy({
      by: ["clubId"],
      _count: { clubId: true },
    }),
  ]);

  const voteMap = Object.fromEntries(votes.map((v) => [v.clubId, v._count.clubId]));

  const lines = [
    "type,studentId,studentName,club,extra",
    ...students.flatMap((s) => {
      const base = [
        `student,${s.studentId},${csv(s.name)},,checkins=${s.checkIns.length}`,
      ];
      const checkinLines = s.checkIns.map(
        (c) =>
          `checkin,${s.studentId},${csv(s.name)},${csv(c.club.name)},${c.createdAt.toISOString()}`,
      );
      const voteLine = s.vote
        ? [`vote,${s.studentId},${csv(s.name)},${csv(s.vote.club.name)},${s.vote.createdAt.toISOString()}`]
        : [];
      return [...base, ...checkinLines, ...voteLine];
    }),
    ...clubs.map(
      (c) =>
        `club_summary,,${csv(c.name)},checkins=${c._count.checkIns},votes=${voteMap[c.id] ?? 0}`,
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="club-event-export.csv"',
    },
  });
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
