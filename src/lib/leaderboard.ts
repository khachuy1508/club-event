import { prisma } from "@/lib/prisma";
import {
  buildBestClubPodium,
  type LeaderboardClub,
  type LeaderboardSnapshot,
} from "@/lib/leaderboard-shared";

export type { LeaderboardClub, LeaderboardSnapshot } from "@/lib/leaderboard-shared";
export { sortClubsByVotes, buildBestClubPodium } from "@/lib/leaderboard-shared";

export async function getLeaderboardSnapshot(
  options: { includeLogos?: boolean } = {},
): Promise<LeaderboardSnapshot> {
  const includeLogos = options.includeLogos ?? true;

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
        ...(includeLogos ? { logoSrc: true } : {}),
        _count: { select: { checkIns: true, votes: true } },
      },
    }),
    prisma.vote.groupBy({
      by: ["clubId"],
      _count: { clubId: true },
      orderBy: { _count: { clubId: "desc" } },
    }),
  ]);

  const rows: LeaderboardClub[] = clubs.map((club) => ({
    id: club.id,
    name: club.name,
    nameVi: club.nameVi,
    nameEn: club.nameEn,
    code: club.code,
    logoSrc: "logoSrc" in club ? ((club.logoSrc as string | null) ?? null) : null,
    checkIns: club._count.checkIns,
    votes: club._count.votes,
  }));

  const clubNameById = Object.fromEntries(rows.map((club) => [club.id, club.name]));
  const logoById = Object.fromEntries(rows.map((club) => [club.id, club.logoSrc]));
  const leaderboard = voteGroups.map((group) => ({
    clubId: group.clubId,
    name: clubNameById[group.clubId] ?? "Unknown",
    votes: group._count.clubId,
    logoSrc: logoById[group.clubId] ?? null,
  }));

  const podium = buildBestClubPodium(
    leaderboard,
    [...rows]
      .map((club) => ({ id: club.id, name: club.name, logoSrc: club.logoSrc }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi")),
  );

  return { clubs: rows, podium };
}
