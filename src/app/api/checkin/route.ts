import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentIdSchema } from "@/lib/validators";
import { assertCheckInAllowed } from "@/lib/event-hours";
import { publishStudentCheckIn } from "@/lib/realtime";
import { verifyStudentQrToken } from "@/lib/qr";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.CLUB_STAFF || !session.user.clubId) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    token?: string;
    studentId?: string;
  };

  let student;
  if (body.token) {
    try {
      const payload = await verifyStudentQrToken(body.token);
      student = await prisma.user.findUnique({ where: { id: payload.userId } });
    } catch {
      return NextResponse.json(
        { ok: false, message: "QR không hợp lệ hoặc đã hết hạn" },
        { status: 400 },
      );
    }
  } else if (body.studentId) {
    const parsed = studentIdSchema.safeParse(body.studentId);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "MSSV không hợp lệ" },
        { status: 400 },
      );
    }
    student = await prisma.user.findUnique({
      where: { studentId: parsed.data },
    });
  } else {
    return NextResponse.json(
      { ok: false, message: "Thiếu QR hoặc MSSV" },
      { status: 400 },
    );
  }

  if (!student || student.role !== Role.STUDENT) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy sinh viên" },
      { status: 404 },
    );
  }

  const windowCheck = await assertCheckInAllowed();
  if (!windowCheck.ok) {
    return NextResponse.json(
      { ok: false, message: windowCheck.message },
      { status: 403 },
    );
  }

  try {
    await prisma.checkIn.create({
      data: {
        studentId: student.id,
        clubId: session.user.clubId,
        checkedInById: session.user.id,
        slotName: windowCheck.slotName,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: `${student.name} đã check-in tại club này rồi`,
        studentName: student.name,
      },
      { status: 409 },
    );
  }

  const clubName =
    session.user.clubName ??
    (
      await prisma.club.findUnique({
        where: { id: session.user.clubId },
        select: { name: true },
      })
    )?.name ??
    "club";

  await publishStudentCheckIn(student.id, {
    clubId: session.user.clubId,
    clubName,
    slotName: windowCheck.slotName,
    at: new Date().toISOString(),
  });

  revalidatePath("/qr");
  revalidatePath("/history");
  revalidatePath("/admin");
  revalidatePath("/vote");

  return NextResponse.json({
    ok: true,
    message: `Check-in thành công: ${student.name}`,
    studentName: student.name,
    studentId: student.studentId,
  });
}
