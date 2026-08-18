export const CHECKIN_EVENT = "checkin";
export const VOTE_EVENT = "vote";
export const LEADERBOARD_CHANNEL = "leaderboard";

export type CheckInRealtimePayload = {
  clubId: string;
  clubName: string;
  slotName: string | null;
  at: string;
};

export type LeaderboardVotePayload = {
  clubId: string;
  clubName: string;
  at: string;
};

export function studentChannel(userId: string) {
  return `student-${userId}`;
}
