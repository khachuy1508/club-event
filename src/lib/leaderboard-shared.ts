export type PodiumClub = {
  clubId: string;
  name: string;
  votes: number;
  logoSrc: string | null;
};

export type LeaderboardClub = {
  id: string;
  name: string;
  nameVi: string;
  nameEn: string;
  code: string | null;
  logoSrc: string | null;
  checkIns: number;
  votes: number;
};

export type LeaderboardSnapshot = {
  clubs: LeaderboardClub[];
  podium: {
    entries: PodiumClub[];
    isPlaceholder: boolean;
  };
};

export function sortClubsByVotes(clubs: LeaderboardClub[]) {
  return [...clubs].sort((a, b) => {
    const voteDiff = b.votes - a.votes;
    if (voteDiff !== 0) return voteDiff;
    return a.name.localeCompare(b.name, "vi");
  });
}

/** Build top podium rows: vote ranking, or first 3 clubs A–Z when empty. */
export function buildBestClubPodium(
  leaderboard: PodiumClub[],
  clubsAlphabetical: { id: string; name: string; logoSrc?: string | null }[],
): { entries: PodiumClub[]; isPlaceholder: boolean } {
  if (leaderboard.length > 0) {
    return { entries: leaderboard, isPlaceholder: false };
  }

  return {
    isPlaceholder: true,
    entries: clubsAlphabetical.slice(0, 3).map((club) => ({
      clubId: club.id,
      name: club.name,
      votes: 0,
      logoSrc: club.logoSrc ?? null,
    })),
  };
}
