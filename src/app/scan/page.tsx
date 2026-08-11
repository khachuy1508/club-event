import { Role } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { StaffCheckinPanel } from "@/components/staff-checkin-panel";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function ScanPage() {
  const session = await requireSession([Role.CLUB_STAFF]);
  const clubId = session.user.clubId;

  const checkInCount = clubId
    ? await prisma.checkIn.count({ where: { clubId } })
    : 0;

  return (
    <>
      <AppHeader user={session.user} links={[{ href: "/scan", label: "Scanner" }]} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Check-in — {session.user.clubName ?? "Club"}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Tổng check-in tại booth: <strong>{checkInCount}</strong>
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Camera trên điện thoại cần mở app qua <strong>HTTPS</strong> (Vercel). Nếu không mở được, dùng nhập MSSV.
          </p>
        </div>
        <StaffCheckinPanel />
      </main>
    </>
  );
}
