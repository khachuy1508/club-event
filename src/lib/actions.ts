"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { parseClubLogo } from "@/lib/logo";
import { assertCheckInAllowed, EVENT_SETTINGS_ID } from "@/lib/event-hours";
import { publishStudentCheckIn } from "@/lib/realtime";
import {
  DEFAULT_STUDENT_PASSWORD,
  MAX_CLUBS,
  MIN_CHECKINS_TO_VOTE,
  createStaffSchema,
  eventHoursSchema,
  opinionSchema,
  registerSchema,
  resetStaffPasswordSchema,
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
    major: formData.get("major"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
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
      major: parsed.data.major,
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
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return {
        ok: false,
        message: "Đăng ký thành công nhưng đăng nhập thất bại. Hãy đăng nhập lại.",
      };
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
  const callbackUrl = String(formData.get("callbackUrl") ?? "");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { studentId: identifier.trim().toUpperCase() },
        { studentId: identifier.trim() },
        { studentId: identifier.trim().toLowerCase() },
      ],
    },
  });

  const roleHome =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "CLUB_STAFF"
        ? "/scan"
        : "/qr";

  const safeCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : null;

  const redirectTo =
    user?.role === "STUDENT" && safeCallback ? safeCallback : roleHome;

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { ok: false, message: "Sai tài khoản hoặc mật khẩu" };
    }
    throw error;
  }

  redirect(redirectTo);
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

  const windowCheck = await assertCheckInAllowed();
  if (!windowCheck.ok) {
    return { ok: false, message: windowCheck.message };
  }

  const clubName =
    session.user.clubName ??
    (await prisma.club.findUnique({ where: { id: clubId }, select: { name: true } }))
      ?.name ??
    "club";

  const payload = {
    clubId,
    clubName,
    slotName: windowCheck.slotName,
    at: new Date().toISOString(),
  };

  try {
    await prisma.checkIn.create({
      data: {
        studentId: student.id,
        clubId,
        checkedInById: session.user.id,
        slotName: windowCheck.slotName,
      },
    });
  } catch {
    await publishStudentCheckIn(student.id, payload);
    return {
      ok: false,
      message: `${studentName} đã check-in tại club này rồi`,
      studentName,
    };
  }

  await publishStudentCheckIn(student.id, payload);

  revalidatePath("/scan");
  revalidatePath("/admin");
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
  revalidatePath("/qr");
  revalidatePath("/admin");
  redirect("/qr");
}

export async function createClubAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);

  const nameEn = String(formData.get("nameEn") ?? formData.get("name") ?? "").trim();
  const nameVi = String(formData.get("nameVi") ?? nameEn).trim();
  const codeRaw = String(formData.get("code") ?? "").trim();
  const code = codeRaw.length > 0 ? codeRaw : null;

  if (nameEn.length < 2) {
    return { ok: false, message: "Tên club (EN) tối thiểu 2 ký tự" };
  }

  const count = await prisma.club.count();
  if (count >= MAX_CLUBS) {
    return { ok: false, message: `Tối đa ${MAX_CLUBS} clubs` };
  }

  const logoResult = await parseClubLogo(formData.get("logo"));
  if (!logoResult.ok) return logoResult;

  let slug = slugify(nameEn);
  if (!slug) slug = `club-${Date.now()}`;

  const exists = await prisma.club.findUnique({ where: { slug } });
  if (exists) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  try {
    await prisma.club.create({
      data: {
        name: nameEn,
        nameEn,
        nameVi,
        code,
        slug,
        sortOrder: count + 1,
        isActive: true,
        logoSrc: logoResult.src,
      },
    });
  } catch (error) {
    console.error("createClubAction failed", error);
    const detail =
      error instanceof Error ? error.message : "Unknown database error";
    return {
      ok: false,
      message: `Không tạo được club: ${detail}.`,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/qr");
  return { ok: true, message: `Đã tạo club ${nameEn}` };
}

export async function updateClubAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);
  const clubId = String(formData.get("clubId") ?? "");
  if (!clubId) return { ok: false, message: "Thiếu club" };

  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameVi = String(formData.get("nameVi") ?? nameEn).trim();
  const codeRaw = String(formData.get("code") ?? "").trim();
  const code = codeRaw.length > 0 ? codeRaw : null;

  if (nameEn.length < 2) {
    return { ok: false, message: "Tên club (EN) tối thiểu 2 ký tự" };
  }

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return { ok: false, message: "Không tìm thấy club" };

  const logoResult = await parseClubLogo(formData.get("logo"));
  if (!logoResult.ok) return logoResult;

  await prisma.club.update({
    where: { id: clubId },
    data: {
      name: nameEn,
      nameEn,
      nameVi,
      code,
      ...(logoResult.src ? { logoSrc: logoResult.src } : {}),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/qr");
  return { ok: true, message: `Đã cập nhật ${nameEn}` };
}

export async function submitOpinionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession([Role.STUDENT]);
  const parsed = opinionSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  await prisma.opinion.create({
    data: {
      studentId: session.user.id,
      body: parsed.data.body,
    },
  });

  revalidatePath("/qr");
  revalidatePath("/admin");
  return { ok: true, message: "Cảm ơn bạn đã gửi ý kiến" };
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
  revalidatePath("/qr");
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

  const parsed = createStaffSchema.safeParse({
    clubId: formData.get("clubId"),
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    };
  }

  const { clubId, username, name, password } = parsed.data;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
  });
  if (!club) return { ok: false, message: "Club không tồn tại" };

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

  const parsed = resetStaffPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    };
  }

  const { userId, password } = parsed.data;

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

export async function resetStudentPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return { ok: false, message: "Thiếu sinh viên" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== Role.STUDENT) {
    return { ok: false, message: "Không tìm thấy sinh viên" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10) },
  });

  revalidatePath("/admin");
  return {
    ok: true,
    message: `Đã reset mật khẩu cho ${user.studentId}`,
  };
}

export async function saveEventHoursAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession([Role.ADMIN]);

  const parsed = eventHoursSchema.safeParse({
    morningName: formData.get("morningName"),
    morningStart: formData.get("morningStart"),
    morningEnd: formData.get("morningEnd"),
    afternoonName: formData.get("afternoonName"),
    afternoonStart: formData.get("afternoonStart"),
    afternoonEnd: formData.get("afternoonEnd"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    };
  }

  await prisma.eventSettings.upsert({
    where: { id: EVENT_SETTINGS_ID },
    create: { id: EVENT_SETTINGS_ID, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/admin");
  revalidatePath("/scan");
  return { ok: true, message: "Đã lưu khung giờ event" };
}
