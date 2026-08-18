import { prisma } from "@/lib/prisma";

export type PassportStampClub = {
  id: string;
  nameEn: string;
  code: string | null;
  hasLogo: boolean;
  logoSrc: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  slotName: string | null;
};

export type PassportStampsPayload = {
  clubs: PassportStampClub[];
  checkedInClubs: { id: string; name: string }[];
  votedClubName: string | null;
};

export async function getPassportStampsForUser(
  userId: string,
): Promise<PassportStampsPayload> {
  const [clubs, checkIns, vote] = await Promise.all([
    prisma.club.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: {
        id: true,
        nameEn: true,
        code: true,
        logoSrc: true,
      },
    }),
    prisma.checkIn.findMany({
      where: { studentId: userId },
      select: {
        clubId: true,
        slotName: true,
        createdAt: true,
        club: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.vote.findUnique({
      where: { studentId: userId },
      include: { club: true },
    }),
  ]);

  const checkInByClubId = Object.fromEntries(
    checkIns.map((item) => [item.clubId, item]),
  );

  return {
    clubs: clubs.map((club) => {
      const checkIn = checkInByClubId[club.id];
      return {
        id: club.id,
        nameEn: club.nameEn,
        code: club.code,
        hasLogo: Boolean(club.logoSrc),
        logoSrc: club.logoSrc,
        checkedIn: Boolean(checkIn),
        checkedInAt: checkIn?.createdAt.toISOString() ?? null,
        slotName: checkIn?.slotName ?? null,
      };
    }),
    checkedInClubs: checkIns.map((item) => ({
      id: item.club.id,
      name: item.club.name,
    })),
    votedClubName: vote?.club.name ?? null,
  };
}
