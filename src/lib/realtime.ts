import Pusher from "pusher";
import {
  CHECKIN_EVENT,
  GIFT_REDEEMED_EVENT,
  LEADERBOARD_CHANNEL,
  VOTE_EVENT,
  studentChannel,
  type CheckInRealtimePayload,
  type GiftRedeemedRealtimePayload,
  type LeaderboardVotePayload,
} from "@/lib/realtime-shared";

export type {
  CheckInRealtimePayload,
  GiftRedeemedRealtimePayload,
  LeaderboardVotePayload,
};
export {
  CHECKIN_EVENT,
  GIFT_REDEEMED_EVENT,
  LEADERBOARD_CHANNEL,
  VOTE_EVENT,
  studentChannel,
};

function readEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}

function getPusherServer() {
  const appId = readEnv("PUSHER_APP_ID");
  const key = readEnv("PUSHER_KEY");
  const secret = readEnv("PUSHER_SECRET");
  const cluster = readEnv("PUSHER_CLUSTER");
  if (!appId || !key || !secret || !cluster) {
    return null;
  }
  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
}

/** No-op when Pusher env is missing so check-in still works. */
export async function publishStudentCheckIn(
  userId: string,
  payload: CheckInRealtimePayload,
) {
  const pusher = getPusherServer();
  if (!pusher) {
    console.error("[realtime] skip publish: missing PUSHER_* env");
    return;
  }
  try {
    await pusher.trigger(studentChannel(userId), CHECKIN_EVENT, payload);
  } catch (error) {
    console.error("[realtime] publish failed", error);
  }
}

export async function publishLeaderboardVote(payload: LeaderboardVotePayload) {
  const pusher = getPusherServer();
  if (!pusher) {
    console.error("[realtime] skip leaderboard vote: missing PUSHER_* env");
    return;
  }
  try {
    await pusher.trigger(LEADERBOARD_CHANNEL, VOTE_EVENT, payload);
  } catch (error) {
    console.error("[realtime] leaderboard publish failed", error);
  }
}

/** No-op when Pusher env is missing so admin gift mark still works. */
export async function publishStudentGiftRedeemed(
  userId: string,
  payload: GiftRedeemedRealtimePayload,
) {
  const pusher = getPusherServer();
  if (!pusher) {
    console.error("[realtime] skip gift-redeemed: missing PUSHER_* env");
    return;
  }
  try {
    await pusher.trigger(studentChannel(userId), GIFT_REDEEMED_EVENT, payload);
  } catch (error) {
    console.error("[realtime] gift-redeemed publish failed", error);
  }
}

export function getPublicPusherConfig() {
  const key = readEnv("NEXT_PUBLIC_PUSHER_KEY") ?? readEnv("PUSHER_KEY");
  const cluster = readEnv("NEXT_PUBLIC_PUSHER_CLUSTER") ?? readEnv("PUSHER_CLUSTER");
  if (!key || !cluster) return null;
  return { key, cluster };
}
