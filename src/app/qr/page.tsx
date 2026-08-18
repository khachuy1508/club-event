import { Role } from "@/generated/prisma/client";
import { OrbitPassCard } from "@/components/orbit-pass-card";
import { PassportLiveBoard } from "@/components/passport-live-board";
import { getPassportStampsForUser } from "@/lib/passport-stamps";
import { createStudentQrToken } from "@/lib/qr";
import { getPublicPusherConfig } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

function PassportFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-sky-300 p-px sm:rounded-[1.65rem]">
      {children}
    </div>
  );
}

export default async function QrPage() {
  const session = await requireSession([Role.STUDENT]);
  const studentId = session.user.studentId ?? "";
  const pusher = getPublicPusherConfig();

  const [student, stamps, token] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, major: true },
    }),
    getPassportStampsForUser(session.user.id),
    createStudentQrToken({
      sub: session.user.id,
      studentId,
      name: session.user.name,
    }),
  ]);

  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden bg-[#1a3f8a]">
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/club.jpg"
          alt=""
          className="h-full w-full object-cover object-top select-none"
        />
      </div>
      <div className="relative z-10 flex min-h-dvh flex-col">
        <main className="mx-auto flex w-full max-w-lg min-w-0 flex-1 flex-col gap-3 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[140px] sm:max-w-5xl sm:gap-6 sm:px-4 sm:pt-[200px]">
          <PassportFrame>
            <OrbitPassCard
              token={token}
              studentId={studentId}
              name={student?.name ?? session.user.name}
              major={student?.major ?? "Chưa cập nhật"}
            />
          </PassportFrame>

          <PassportFrame>
            <PassportLiveBoard
              userId={session.user.id}
              pusherKey={pusher?.key ?? null}
              pusherCluster={pusher?.cluster ?? null}
              clubs={stamps.clubs}
              checkedInClubs={stamps.checkedInClubs}
              votedClubName={stamps.votedClubName}
            />
          </PassportFrame>

          <p className="px-2 pb-1 text-center text-[9px] leading-relaxed tracking-wide text-white/90 sm:text-xs sm:tracking-[0.2em]">
            COLLECT STAMPS – EXPLORE – VOTE – SHARE
            <span className="mt-0.5 block font-normal tracking-normal text-white/75">
              Complete your orbit and make your mark at USTH!
            </span>
          </p>
        </main>
      </div>
    </div>
  );
}
