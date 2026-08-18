"use client";

import { ViewTransition } from "react";
import { type PodiumClub } from "@/lib/leaderboard-shared";

type Props = {
  entries: PodiumClub[];
  /** true when showing A–Z placeholders because nobody has votes yet */
  isPlaceholder: boolean;
  hideHeading?: boolean;
};

const RANK_META = {
  1: {
    order: "order-2",
    height: "h-36 sm:h-44",
    tone: "bg-[linear-gradient(180deg,#ffe566_0%,#e8b923_48%,#c4920c_100%)] shadow-[0_12px_30px_-14px_rgba(196,146,12,0.7)]",
    badge: "bg-[#fff3c0] text-[#7a5200]",
    voteInk: "text-[#c4920c]",
    label: "Top 1",
  },
  2: {
    order: "order-1",
    height: "h-28 sm:h-32",
    tone: "bg-[linear-gradient(180deg,#f4f6f8_0%,#c5ccd4_48%,#9aa3ad_100%)] shadow-[0_12px_30px_-14px_rgba(120,130,145,0.65)]",
    badge: "bg-[#eef2f6] text-[#4d5968]",
    voteInk: "text-[#6b7580]",
    label: "Top 2",
  },
  3: {
    order: "order-3",
    height: "h-20 sm:h-24",
    tone: "bg-[linear-gradient(180deg,#e8a05a_0%,#c46a28_48%,#8a3a12_100%)] shadow-[0_12px_30px_-14px_rgba(139,58,18,0.65)]",
    badge: "bg-[#f8d2a4] text-[#6a2e10]",
    voteInk: "text-[#c46a28]",
    label: "Top 3",
  },
} as const;

function PodiumSlot({
  rank,
  club,
  isPlaceholder,
}: {
  rank: 1 | 2 | 3;
  club: PodiumClub | undefined;
  isPlaceholder: boolean;
}) {
  const meta = RANK_META[rank];
  if (!club) {
    return (
      <div className={`flex w-full max-w-[9.5rem] flex-col items-center sm:max-w-[11rem] ${meta.order}`}>
        <div
          className={`flex w-full ${meta.height} items-end justify-center rounded-t-xl bg-[var(--wash)] px-2 pb-4 text-sm text-[var(--muted)]`}
        >
          —
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full max-w-[9.5rem] flex-col items-center sm:max-w-[11rem] ${meta.order}`}
    >
      <div className="mb-3 flex flex-col items-center gap-1 px-1 text-center">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}
        >
          {meta.label}
        </span>
        <ViewTransition
          key={club.clubId}
          name={`bxh-podium-rank-${rank}`}
          share="text-morph"
          enter="fade-in"
          exit="fade-out"
          default="none"
        >
          <p className="font-[family-name:var(--font-display)] text-base leading-tight text-[var(--ink)] sm:text-lg">
            {club.name}
          </p>
        </ViewTransition>
        <ViewTransition
          key={`${rank}-${club.votes}-${isPlaceholder ? "ph" : "live"}`}
          name={`bxh-podium-votes-${rank}`}
          enter="slide-up"
          default="none"
        >
          {isPlaceholder ? (
            <p className="text-xs text-[var(--muted)] sm:text-sm">Chưa có vote</p>
          ) : (
            <p className="flex items-baseline justify-center gap-1">
              <span className={`font-[family-name:var(--font-display)] text-3xl font-semibold leading-none sm:text-4xl ${meta.voteInk}`}>
                {club.votes}
              </span>
              <span className="text-sm font-medium text-[var(--muted)]">vote</span>
            </p>
          )}
        </ViewTransition>
      </div>
      <div
        className={`w-full rounded-t-xl ${meta.height} ${meta.tone}`}
      />
    </div>
  );
}

export function BestClubPodium({ entries, isPlaceholder, hideHeading }: Props) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <section className="space-y-4">
      {hideHeading ? null : (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            BXH Best Club
          </h2>
          {isPlaceholder ? (
            <p className="text-sm text-[var(--muted)]">
              Chưa có vote — đang hiện 3 club theo A–Z
            </p>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 pb-0 pt-8 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-end justify-center gap-2 sm:gap-4">
          <PodiumSlot rank={2} club={second} isPlaceholder={isPlaceholder} />
          <PodiumSlot rank={1} club={first} isPlaceholder={isPlaceholder} />
          <PodiumSlot rank={3} club={third} isPlaceholder={isPlaceholder} />
        </div>
      </div>

      {!isPlaceholder && entries.length > 3 ? (
        <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {entries.slice(3).map((item, index) => (
            <li
              key={item.clubId}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span>
                <span className="mr-3 text-[var(--muted)]">#{index + 4}</span>
                {item.name}
              </span>
              <ViewTransition
                key={`${item.clubId}-${item.votes}`}
                enter="slide-up"
                default="none"
              >
                <span className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-none text-[var(--accent)]">
                  {item.votes}
                  <span className="ml-1 text-sm font-medium text-[var(--muted)]">
                    vote
                  </span>
                </span>
              </ViewTransition>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
