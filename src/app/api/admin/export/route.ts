import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    orderBy: { createdAt: "desc" },
    select: {
      studentId: true,
      name: true,
      major: true,
      checkIns: { select: { id: true } },
      opinions: {
        orderBy: { createdAt: "asc" },
        select: { body: true },
      },
    },
  });

  const lines = [
    "MSSV,Tên,Ngành,Lời nhắn,Số dấu",
    ...students.map((student) => {
      const messages = student.opinions.map((item) => item.body.trim()).filter(Boolean);
      return [
        csv(student.studentId ?? ""),
        csv(student.name),
        csv(student.major ?? ""),
        csv(messages.join(" | ")),
        String(student.checkIns.length),
      ].join(",");
    }),
  ];

  // BOM helps Excel open Vietnamese characters correctly
  const body = `\uFEFF${lines.join("\n")}`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="students-export.csv"',
    },
  });
}

function csv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
