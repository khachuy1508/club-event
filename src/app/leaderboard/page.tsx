import type { Metadata } from "next";
import {
  BestClubPodium,
  buildBestClubPodium,
} from "@/components/best-club-podium";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "BXH Best Club — Club Day",
  description: "Bảng xếp hạng Best Club và danh sách clubs (công khai)",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [clubs, voteGroups] = await Promise.all([
    prisma.club.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: {
        id: true,
        name: true,
        nameVi: true,
        nameEn: true,
        code: true,
        logoSrc: true,
        _count: { select: { checkIns: true, votes: true } },
      },
    }),
    prisma.vote.groupBy({
      by: ["clubId"],
      _count: { clubId: true },
      orderBy: { _count: { clubId: "desc" } },
    }),
  ]);

  const clubNameById = Object.fromEntries(clubs.map((c) => [c.id, c.name]));
  const leaderboard = voteGroups.map((g) => ({
    clubId: g.clubId,
    name: clubNameById[g.clubId] ?? "Unknown",
    votes: g._count.clubId,
  }));

  const podium = buildBestClubPodium(
    leaderboard,
    [...clubs]
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi")),
  );

  const clubsByVotes = [...clubs].sort((a, b) => {
    const voteDiff = b._count.votes - a._count.votes;
    if (voteDiff !== 0) return voteDiff;
    return a.name.localeCompare(b.name, "vi");
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
        Bảng xếp hạng & Clubs
      </h1>

      <BestClubPodium
        entries={podium.entries}
        isPlaceholder={podium.isPlaceholder}
        hideHeading
      />

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Danh sách clubs
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Logo</th>
                  <th className="px-3 py-2 font-medium">Club</th>
                  <th className="px-3 py-2 font-medium">Check-ins</th>
                  <th className="px-3 py-2 font-medium">Votes</th>
                </tr>
              </thead>
              <tbody>
                {clubsByVotes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-[var(--muted)]"
                    >
                      Chưa có club
                    </td>
                  </tr>
                ) : (
                  clubsByVotes.map((club, index) => (
                    <tr
                      key={club.id}
                      className="border-b border-[var(--line)] last:border-0"
                    >
                      <td className="px-3 py-3 text-[var(--muted)]">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        {club.logoSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={club.logoSrc}
                            alt=""
                            className="h-10 w-10 rounded object-contain"
                          />
                        ) : (
                          <span className="text-xs text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{club.nameEn}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {club.nameVi}
                          {club.code ? ` · ${club.code}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">{club._count.checkIns}</td>
                      <td className="px-3 py-3 font-semibold">
                        {club._count.votes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
    </main>
  );
}
