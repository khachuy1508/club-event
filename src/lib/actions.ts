"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  MAX_CLUBS,
  MIN_CHECKINS_TO_VOTE,
  registerSchema,
  slugify,
  studentIdSchema,
} from "@/lib/validators";
import { verifyStudentQrToken } from "@/lib/qr";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function registerStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    studentId: formData.get("studentId"),
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const existing = await prisma.user.findUnique({
    where: { studentId: parsed.data.studentId },
  });
  if (existing) {
    return { ok: false, message: "MSSV đã được đăng ký" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      studentId: parsed.data.studentId,
      name: parsed.data.name,
      passwordHash,
      role: Role.STUDENT,
    },
  });

  try {
    await signIn("credentials", {
      identifier: parsed.data.studentId,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Đăng ký thành công nhưng đăng nhập thất bại" };
    }
    throw error;
  }

  redirect("/qr");
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Sai tài khoản hoặc mật khẩu" };
    }
    throw error;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { studentId: identifier.trim().toUpperCase() },
        { studentId: identifier.trim() },
        { studentId: identifier.trim().toLowerCase() },
      ],
    },
  });

  redirect(
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "CLUB_STAFF"
        ? "/scan"
        : "/qr",
  );
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function checkInAction(input: {
  token?: string;
  studentId?: string;
}): Promise<ActionResult & { studentName?: string }> {
  const session = await requireSession([Role.CLUB_STAFF]);
  const clubId = session.user.clubId;
  if (!clubId) {
    return { ok: false, message: "Tài khoản staff chưa gắn club" };
  }

  let studentUserId: string | null = null;
  let studentName = "";

  if (input.token) {
    try {
      const payload = await verifyStudentQrToken(input.token);
      studentUserId = payload.userId;
      studentName = payload.name;
    } catch {
      return { ok: false, message: "QR không hợp lệ hoặc đã hết hạn" };
    }
  } else if (input.studentId) {
    const parsed = studentIdSchema.safeParse(input.studentId);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "MSSV không hợp lệ" };
    }
    const student = await prisma.user.findUnique({
      where: { studentId: parsed.data },
    });
    if (!student || student.role !== Role.STUDENT) {
      return { ok: false, message: "Không tìm thấy sinh viên" };
    }
    studentUserId = student.id;
    studentName = student.name;
  } else {
    return { ok: false, message: "Thiếu QR hoặc MSSV" };
  }

  const student = await prisma.user.findUnique({ where: { id: studentUserId! } });
  if (!student || student.role !== Role.STUDENT) {
    return { ok: false, message: "Không tìm thấy sinh viên" };
  }
  studentName = student.name;

  try {
    await prisma.checkIn.create({
      data: {
        studentId: student.id,
        clubId,
        checkedInById: session.user.id,
      },
    });
  } catch {
    return {
      ok: false,
      message: `${studentName} đã check-in tại club này rồi`,
      studentName,
    };
  }

  revalidatePath("/scan");
  revalidatePath("/admin");
  revalidatePath("/qr");
  revalidatePath("/history");
  revalidatePath("/vote");

  return {
    ok: true,
    message: `Check-in thành công: ${studentName}`,
    studentName,
  };
}

export async function voteAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession([Role.STUDENT]);
  const clubId = String(formData.get("clubId") ?? "");

  if (!clubId) {
    return { ok: false, message: "Chọn một club để vote" };
  }

  const checkIns = await prisma.checkIn.findMany({
    where: { studentId: session.user.id },
    select: { clubId: true },
  });

  if (checkIns.length < MIN_CHECKINS_TO_VOTE) {
    return {
      ok: false,
      message: `Cần ít nhất ${MIN_CHECKINS_TO_VOTE} check-in để vote`,
    };
  }

  const visited = new Set(checkIns.map((c) => c.clubId));
  if (!visited.has(clubId)) {
    return { ok: false, message: "Chỉ vote club bạn đã check-in" };
  }

  const existing = await prisma.vote.findUnique({
    where: { studentId: session.user.id },
  });
  if (existing) {
    return { ok: false, message: "Bạn đã vote rồi" };
  }

  const club = await prisma.club.findFirst({
    where: { id: clubId, isActive: true },
  });
  if (!club) {
    return { ok: false, message: "Club không hợp lệ" };
  }

  await prisma.vote.create({
    data: {
      studentId: session.user.id,
      clubId,
    },
  });

  revalidatePath("/vote");
  revalidatePath("/admin");
  redirect("/vote?done=1");
}

export async function createClubAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { ok: false, message: "Tên club tối thiểu 2 ký tự" };
  }

  const count = await prisma.club.count();
  if (count >= MAX_CLUBS) {
    return { ok: false, message: `Tối đa ${MAX_CLUBS} clubs` };
  }

  let slug = slugify(name);
  if (!slug) slug = `club-${Date.now()}`;

  const exists = await prisma.club.findUnique({ where: { slug } });
  if (exists) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  await prisma.club.create({
    data: { name, slug, isActive: true },
  });

  revalidatePath("/admin");
  return { ok: true, message: `Đã tạo club ${name}` };
}

export async function toggleClubAction(clubId: string): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return { ok: false, message: "Không tìm thấy club" };

  await prisma.club.update({
    where: { id: clubId },
    data: { isActive: !club.isActive },
  });

  revalidatePath("/admin");
  return {
    ok: true,
    message: club.isActive ? "Đã ẩn club" : "Đã kích hoạt club",
  };
}

export async function createStaffAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);

  const clubId = String(formData.get("clubId") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!clubId || !username || name.length < 2 || password.length < 6) {
    return { ok: false, message: "Điền đủ thông tin staff (mật khẩu ≥ 6)" };
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { staff: true },
  });
  if (!club) return { ok: false, message: "Club không tồn tại" };
  if (club.staff) {
    return { ok: false, message: "Club đã có staff — reset mật khẩu thay vì tạo mới" };
  }

  const taken = await prisma.user.findUnique({ where: { studentId: username } });
  if (taken) return { ok: false, message: "Username đã tồn tại" };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      studentId: username,
      passwordHash,
      role: Role.CLUB_STAFF,
    },
  });

  await prisma.clubStaff.create({
    data: { userId: user.id, clubId },
  });

  revalidatePath("/admin");
  return { ok: true, message: `Đã tạo staff ${username} cho ${club.name}` };
}

export async function resetStaffPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 6) {
    return { ok: false, message: "Mật khẩu mới tối thiểu 6 ký tự" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== Role.CLUB_STAFF) {
    return { ok: false, message: "Không tìm thấy staff" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  revalidatePath("/admin");
  return { ok: true, message: `Đã reset mật khẩu cho ${user.studentId}` };
}
