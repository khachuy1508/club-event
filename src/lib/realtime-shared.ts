export const CHECKIN_EVENT = "checkin";

export type CheckInRealtimePayload = {
  clubId: string;
  clubName: string;
  slotName: string | null;
  at: string;
};

export function studentChannel(userId: string) {
  return `student-${userId}`;
}
