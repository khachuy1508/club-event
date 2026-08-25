export const CHECKIN_EVENT = "checkin";
export const VOTE_EVENT = "vote";
export const GIFT_REDEEMED_EVENT = "gift-redeemed";
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

export type GiftRedeemedRealtimePayload = {
  giftRedeemed: boolean;
  at: string;
};

export function studentChannel(userId: string) {
  return `student-${userId}`;
}
