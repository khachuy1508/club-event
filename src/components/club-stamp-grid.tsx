"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PassportOpinionCard } from "@/components/passport-opinion-card";
import { PassportVoteCard } from "@/components/passport-vote-card";

type ClubStamp = {
  id: string;
  nameEn: string;
  code: string | null;
  hasLogo: boolean;
  logoSrc?: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  slotName: string | null;
};

type VoteClub = { id: string; name: string };

export type ClubPassportBoardProps = {
  clubs: ClubStamp[];
  checkedInClubs: VoteClub[];
  votedClubName: string | null;
};

type Props = ClubPassportBoardProps;

function formatCheckInTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function SlotBadge({ slotName }: { slotName: string | null }) {
  if (!slotName) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        —
      </span>
    );
  }
  const isMorning = /sáng/i.test(slotName);
  const isAfternoon = /chiều/i.test(slotName);
  const tone = isMorning
    ? "bg-amber-100 text-amber-800"
    : isAfternoon
      ? "bg-violet-100 text-violet-800"
      : "bg-sky-100 text-sky-800";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {slotName}
    </span>
  );
}

export function ClubPassportBoard({
  clubs,
  checkedInClubs,
  votedClubName,
}: Props) {
  const [selected, setSelected] = useState<ClubStamp | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  return (
    <section className="min-w-0 rounded-[1.2rem] border border-white/70 bg-white/85 p-2.5 backdrop-blur-md sm:rounded-[1.6rem] sm:p-6">
      <div className="rounded-xl border border-violet-200 bg-white/60 p-2 sm:rounded-2xl sm:p-4">
        <h2 className="mb-2 px-1 text-center text-[10px] font-semibold leading-snug tracking-wide text-violet-800 sm:mb-5 sm:text-sm sm:tracking-[0.18em]">
          ✦ {clubs.length} CLUBS – EXPLORE & COLLECT STAMPS ✦
        </h2>
        <ol className="grid grid-cols-4 gap-1 min-[400px]:grid-cols-5 sm:grid-cols-5 sm:gap-3">
          {clubs.map((club, index) => {
            const content = (
              <>
                <span className="absolute left-0.5 top-0 text-[8px] font-medium text-slate-400 sm:text-[10px]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <StampMark club={club} />
                <p className="mt-0.5 line-clamp-2 w-full break-words text-[7px] font-medium leading-tight text-violet-800 sm:text-[11px]">
                  {club.nameEn}
                </p>
              </>
            );
            const shell =
              "relative flex min-h-[4.6rem] w-full min-w-0 flex-col items-center justify-between px-0.5 pb-0.5 pt-3 text-center sm:min-h-[6.5rem] sm:pt-4";
            return (
              <li key={club.id} className="min-w-0">
                {club.checkedIn ? (
                  <button
                    type="button"
                    onClick={() => setSelected(club)}
                    className={`${shell} cursor-pointer rounded-lg transition hover:bg-violet-50/80 active:scale-[0.98]`}
                    aria-label={`Chi tiết check-in ${club.nameEn}`}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={shell}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-2 grid grid-cols-2 items-stretch gap-2 sm:mt-4 sm:gap-4">
        <PassportVoteCard
          checkedInClubs={checkedInClubs}
          votedClubName={votedClubName}
          embedded
        />
        <PassportOpinionCard embedded />
      </div>

      {selected
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={() => setSelected(null)}
            >
              <div
                className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>

                <p
                  id={titleId}
                  className="text-center text-sm font-semibold tracking-[0.16em] text-violet-800"
                >
                  CHECK-IN
                </p>

                <div className="mx-auto mt-4 flex h-20 w-20 items-center justify-center">
                  <StampMark club={selected} large />
                </div>

                <p className="mt-3 text-center text-lg font-semibold text-slate-800">
                  {selected.nameEn}
                </p>

                <div className="mt-4 flex justify-center">
                  <SlotBadge slotName={selected.slotName} />
                </div>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Thời gian check-in
                </p>
                <p className="mt-1 text-center text-sm font-medium text-slate-800">
                  {selected.checkedInAt
                    ? formatCheckInTime(selected.checkedInAt)
                    : "—"}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

function StampMark({
  club,
  large = false,
}: {
  club: ClubStamp;
  large?: boolean;
}) {
  const visual = club.checkedIn ? "" : "grayscale opacity-55";
  const size = large
    ? "h-16 w-16 sm:h-20 sm:w-20"
    : "h-7 w-7 sm:h-12 sm:w-12";
  const text = large ? "text-sm sm:text-base" : "text-[8px] sm:text-xs";

  if (club.hasLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={club.logoSrc ?? ""}
        alt=""
        className={`${size} object-contain ${visual}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${size} ${text} ${
        club.checkedIn
          ? "bg-violet-500 text-white"
          : "bg-violet-100 text-violet-400 grayscale"
      }`}
    >
      {(club.code ?? club.nameEn).slice(0, 3).toUpperCase()}
    </div>
  );
}
