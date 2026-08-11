import { Role } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { ActionForm } from "@/components/action-form";
import { voteAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { MIN_CHECKINS_TO_VOTE } from "@/lib/validators";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ done?: string }>;
};

export default async function VotePage({ searchParams }: Props) {
  const session = await requireSession([Role.STUDENT]);
  const params = await searchParams;

  const [checkIns, existingVote] = await Promise.all([
    prisma.checkIn.findMany({
      where: { studentId: session.user.id },
      include: { club: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.vote.findUnique({
      where: { studentId: session.user.id },
      include: { club: true },
    }),
  ]);

  const unlocked = checkIns.length >= MIN_CHECKINS_TO_VOTE;

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
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Vote Best Club
        </h1>

        {!unlocked ? (
          <div className="mt-6 space-y-3">
            <p className="text-[var(--muted)]">
              Bạn cần ít nhất {MIN_CHECKINS_TO_VOTE} check-in (hiện có {checkIns.length}).
            </p>
            <Link href="/qr" className="text-[var(--accent)] underline-offset-2 hover:underline">
              Quay lại QR
            </Link>
          </div>
        ) : existingVote || params.done ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-emerald-900">
            <p className="font-medium">
              Bạn đã vote cho{" "}
              {existingVote?.club.name ?? "Best Club"}.
            </p>
            <p className="mt-1 text-sm">Cảm ơn bạn — phiếu không thể đổi.</p>
          </div>
        ) : (
          <ActionForm action={voteAction} className="mt-8 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Chỉ được vote các club bạn đã check-in. Chọn 1 club rồi gửi.
            </p>
            <div className="space-y-2">
              {checkIns.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)]"
                >
                  <input type="radio" name="clubId" value={item.clubId} required />
                  <span>{item.club.name}</span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="rounded-md bg-[var(--accent)] px-4 py-2.5 font-medium text-white hover:bg-[var(--accent-strong)]"
            >
              Gửi vote
            </button>
          </ActionForm>
        )}
      </main>
    </>
  );
}
