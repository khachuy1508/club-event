import { Role } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { StudentQrCard } from "@/components/student-qr-card";
import { createStudentQrToken } from "@/lib/qr";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { MIN_CHECKINS_TO_VOTE } from "@/lib/validators";
import Link from "next/link";

export default async function QrPage() {
  const session = await requireSession([Role.STUDENT]);
  const studentId = session.user.studentId ?? "";

  const checkInCount = await prisma.checkIn.count({
    where: { studentId: session.user.id },
  });

  const token = await createStudentQrToken({
    sub: session.user.id,
    studentId,
    name: session.user.name,
  });

  const canVote = checkInCount >= MIN_CHECKINS_TO_VOTE;

  return (
    <>
      <AppHeader
        user={session.user}
        links={[
          { href: "/qr", label: "QR" },
          { href: "/history", label: "Lịch sử" },
          { href: "/vote", label: "Vote" },
        ]}
      />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            QR check-in của bạn
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Đã check-in {checkInCount}/{MIN_CHECKINS_TO_VOTE} club để mở vote
          </p>
        </div>
        <StudentQrCard token={token} studentId={studentId} name={session.user.name} />
        <div className="flex justify-center gap-3 text-sm">
          <Link href="/history" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Xem lịch sử
          </Link>
          {canVote ? (
            <Link href="/vote" className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline">
              Vote Best Club
            </Link>
          ) : null}
        </div>
      </main>
    </>
  );
}
