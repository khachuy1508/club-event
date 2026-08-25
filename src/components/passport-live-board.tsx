"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Pusher from "pusher-js";
import { ClubPassportBoard } from "@/components/club-stamp-grid";
import type { ClubPassportBoardProps } from "@/components/club-stamp-grid";
import {
  CHECKIN_EVENT,
  GIFT_REDEEMED_EVENT,
  studentChannel,
  type CheckInRealtimePayload,
  type GiftRedeemedRealtimePayload,
} from "@/lib/realtime-shared";

type Props = ClubPassportBoardProps & {
  userId: string;
  pusherKey: string | null;
  pusherCluster: string | null;
  onCheckInSuccess?: () => void;
  onToastDismiss?: () => void;
  onGiftRedeemed?: (giftRedeemed: boolean) => void;
};

export function PassportLiveBoard({
  userId,
  pusherKey,
  pusherCluster,
  onCheckInSuccess,
  onToastDismiss,
  onGiftRedeemed,
  ...initial
}: Props) {
  const [board, setBoard] = useState<ClubPassportBoardProps>(initial);
  const [toast, setToast] = useState<string | null>(null);
  const onCheckInSuccessRef = useRef(onCheckInSuccess);
  const onToastDismissRef = useRef(onToastDismiss);
  const onGiftRedeemedRef = useRef(onGiftRedeemed);

  useEffect(() => {
    onCheckInSuccessRef.current = onCheckInSuccess;
    onToastDismissRef.current = onToastDismiss;
    onGiftRedeemedRef.current = onGiftRedeemed;
  }, [onCheckInSuccess, onToastDismiss, onGiftRedeemed]);

  const refreshStamps = useCallback(async () => {
    try {
      const res = await fetch("/api/me/stamps", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ClubPassportBoardProps;
      setBoard(data);
    } catch {
      // ignore transient network errors
    }
  }, []);

  const showToast = useCallback((message: string) => {
    onCheckInSuccessRef.current?.();
    setToast(message);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
    onToastDismissRef.current?.();
  }, []);

  useEffect(() => {
    if (!pusherKey || !pusherCluster) return;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    });
    const channelName = studentChannel(userId);
    const channel = pusher.subscribe(channelName);

    const onCheckIn = (payload: CheckInRealtimePayload) => {
      showToast(`Bạn đã checkin thành công tại ${payload.clubName}`);
      void refreshStamps();
    };

    const onGift = (payload: GiftRedeemedRealtimePayload) => {
      const redeemed = Boolean(payload.giftRedeemed);
      onGiftRedeemedRef.current?.(redeemed);
      if (redeemed) {
        showToast("Bạn đã nhận quà thành công");
      }
    };

    channel.bind(CHECKIN_EVENT, onCheckIn);
    channel.bind(GIFT_REDEEMED_EVENT, onGift);

    return () => {
      channel.unbind(CHECKIN_EVENT, onCheckIn);
      channel.unbind(GIFT_REDEEMED_EVENT, onGift);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userId, pusherKey, pusherCluster, refreshStamps, showToast]);

  const toastNode = toast
    ? createPortal(
          <div
            className="fixed inset-0 z-200 flex items-center justify-center p-4"
            role="status"
            aria-live="polite"
          >
            <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-950 shadow-[0_16px_40px_-20px_rgba(15,40,35,0.55)]">
              <p className="text-center text-base font-semibold leading-snug">
                {toast}
              </p>
              <button
                type="button"
                onClick={dismissToast}
                className="mt-3 w-full rounded-md px-2 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Đóng
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <ClubPassportBoard
        clubs={board.clubs}
        checkedInClubs={board.checkedInClubs}
        votedClubName={board.votedClubName}
      />
      {toastNode}
    </>
  );
}
