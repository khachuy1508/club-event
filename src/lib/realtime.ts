import Pusher from "pusher";
import {
  CHECKIN_EVENT,
  studentChannel,
  type CheckInRealtimePayload,
} from "@/lib/realtime-shared";

export type { CheckInRealtimePayload };
export { CHECKIN_EVENT, studentChannel };

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

export function getPublicPusherConfig() {
  const key = readEnv("NEXT_PUBLIC_PUSHER_KEY") ?? readEnv("PUSHER_KEY");
  const cluster = readEnv("NEXT_PUBLIC_PUSHER_CLUSTER") ?? readEnv("PUSHER_CLUSTER");
  if (!key || !cluster) return null;
  return { key, cluster };
}
