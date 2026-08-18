import Pusher from "pusher";
import {
  CHECKIN_EVENT,
  studentChannel,
  type CheckInRealtimePayload,
} from "@/lib/realtime-shared";

export type { CheckInRealtimePayload };
export { CHECKIN_EVENT, studentChannel };

function getPusherServer() {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
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
  if (!pusher) return;
  try {
    await pusher.trigger(studentChannel(userId), CHECKIN_EVENT, payload);
  } catch (error) {
    console.error("[realtime] publish failed", error);
  }
}

export function getPublicPusherConfig() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  return { key, cluster };
}
