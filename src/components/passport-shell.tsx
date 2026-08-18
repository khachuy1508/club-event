"use client";

import { OrbitPassCard } from "@/components/orbit-pass-card";
import { PassportLiveBoard } from "@/components/passport-live-board";
import type { ClubPassportBoardProps } from "@/components/club-stamp-grid";
import { useState } from "react";

function PassportFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-sky-300 p-px sm:rounded-[1.65rem]">
      {children}
    </div>
  );
}

type Props = ClubPassportBoardProps & {
  token: string;
  studentId: string;
  name: string;
  major: string;
  userId: string;
  pusherKey: string | null;
  pusherCluster: string | null;
};

export function PassportShell({
  token,
  studentId,
  name,
  major,
  userId,
  pusherKey,
  pusherCluster,
  clubs,
  checkedInClubs,
  votedClubName,
}: Props) {
  const [hideQr, setHideQr] = useState(false);

  return (
    <>
      <PassportFrame>
        <OrbitPassCard
          token={token}
          studentId={studentId}
          name={name}
          major={major}
          qrHidden={hideQr}
        />
      </PassportFrame>
      <PassportFrame>
        <PassportLiveBoard
          userId={userId}
          pusherKey={pusherKey}
          pusherCluster={pusherCluster}
          clubs={clubs}
          checkedInClubs={checkedInClubs}
          votedClubName={votedClubName}
          onCheckInSuccess={() => setHideQr(true)}
          onToastDismiss={() => setHideQr(false)}
        />
      </PassportFrame>
    </>
  );
}
