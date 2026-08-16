import { Role } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function HistoryPage() {
  const session = await requireSession([Role.STUDENT]);

  const checkIns = await prisma.checkIn.findMany({
    where: { studentId: session.user.id },
    include: { club: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AppHeader
        user={session.user}
        links={[
          { href: "/qr", label: "Passport" },
          { href: "/history", label: "Lịch sử" },
        ]}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Club đã check-in
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {checkIns.length === 0
            ? "Chưa có check-in nào. Đưa QR cho staff tại booth."
            : `Bạn đã đến ${checkIns.length} club.`}
        </p>
        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {checkIns.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-[var(--ink)]">{item.club.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {item.createdAt.toLocaleString("vi-VN")}
                </p>
              </div>
              <span className="text-sm text-emerald-700">Đã check-in</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
