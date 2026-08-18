"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import { ClubPassportBoard } from "@/components/club-stamp-grid";
import type { ClubPassportBoardProps } from "@/components/club-stamp-grid";
import {
  CHECKIN_EVENT,
  studentChannel,
  type CheckInRealtimePayload,
} from "@/lib/realtime-shared";

type Props = ClubPassportBoardProps & {
  userId: string;
  pusherKey: string | null;
  pusherCluster: string | null;
};

export function PassportLiveBoard({
  userId,
  pusherKey,
  pusherCluster,
  ...initial
}: Props) {
  const [board, setBoard] = useState<ClubPassportBoardProps>(initial);
  const [toast, setToast] = useState<string | null>(null);
  const knownClubIds = useRef(
    new Set(initial.clubs.filter((c) => c.checkedIn).map((c) => c.id)),
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshStamps = useCallback(async () => {
    try {
      const res = await fetch("/api/me/stamps", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ClubPassportBoardProps;
      setBoard(data);
      knownClubIds.current = new Set(
        data.clubs.filter((c) => c.checkedIn).map((c) => c.id),
      );
    } catch {
      // ignore transient network errors
    }
  }, []);

  const showToast = useCallback((message: string) => {
    if (document.visibilityState === "hidden") return;
    setToast(message);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    if (!pusherKey || !pusherCluster) return;

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    const channelName = studentChannel(userId);
    const channel = pusher.subscribe(channelName);

    const onCheckIn = (payload: CheckInRealtimePayload) => {
      if (!knownClubIds.current.has(payload.clubId)) {
        knownClubIds.current.add(payload.clubId);
        showToast(`Bạn đã checkin thành công tại ${payload.clubName}`);
      }
      void refreshStamps();
    };

    channel.bind(CHECKIN_EVENT, onCheckIn);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshStamps();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      channel.unbind(CHECKIN_EVENT, onCheckIn);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [userId, pusherKey, pusherCluster, refreshStamps, showToast]);

  return (
    <>
      <ClubPassportBoard
        clubs={board.clubs}
        checkedInClubs={board.checkedInClubs}
        votedClubName={board.votedClubName}
      />

      {toast ? (
        <div
          className="fixed inset-x-0 top-0 z-[90] flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
          role="status"
          aria-live="polite"
        >
          <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-[0_16px_40px_-20px_rgba(15,40,35,0.55)]">
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
              {toast}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
