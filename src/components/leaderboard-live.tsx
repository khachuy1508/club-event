"use client";

import { startTransition, useCallback, useEffect, useState, ViewTransition } from "react";
import Pusher from "pusher-js";
import { BestClubPodium } from "@/components/best-club-podium";
import {
  sortClubsByVotes,
  type LeaderboardSnapshot,
} from "@/lib/leaderboard-shared";
import {
  LEADERBOARD_CHANNEL,
  VOTE_EVENT,
} from "@/lib/realtime-shared";

type Props = LeaderboardSnapshot & {
  pusherKey: string | null;
  pusherCluster: string | null;
};

export function LeaderboardLive({
  pusherKey,
  pusherCluster,
  ...initial
}: Props) {
  const [data, setData] = useState<LeaderboardSnapshot>(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as LeaderboardSnapshot;
      startTransition(() => {
        setData((prev) => ({
          podium: {
            ...next.podium,
            entries: next.podium.entries.map((entry) => ({
              ...entry,
              logoSrc:
                prev.clubs.find((row) => row.id === entry.clubId)?.logoSrc ??
                prev.podium.entries.find((row) => row.clubId === entry.clubId)
                  ?.logoSrc ??
                entry.logoSrc,
            })),
          },
          clubs: next.clubs.map((club) => ({
            ...club,
            logoSrc:
              prev.clubs.find((row) => row.id === club.id)?.logoSrc ?? club.logoSrc,
          })),
        }));
      });
    } catch {
      // ignore transient network errors
    }
  }, []);

  useEffect(() => {
    if (!pusherKey || !pusherCluster) return;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    });
    const channel = pusher.subscribe(LEADERBOARD_CHANNEL);
    channel.bind(VOTE_EVENT, () => {
      void refresh();
    });

    return () => {
      channel.unbind(VOTE_EVENT);
      pusher.unsubscribe(LEADERBOARD_CHANNEL);
      pusher.disconnect();
    };
  }, [pusherKey, pusherCluster, refresh]);

  const clubsByVotes = sortClubsByVotes(data.clubs);

  return (
    <>
      <BestClubPodium
        entries={data.podium.entries}
        isPlaceholder={data.podium.isPlaceholder}
        hideHeading
      />

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Danh sách clubs
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Logo</th>
                <th className="px-3 py-2 font-medium">Club</th>
                <th className="px-3 py-2 font-medium">Check-ins</th>
                <th className="px-3 py-2 font-medium">Votes</th>
              </tr>
            </thead>
            <tbody>
              {clubsByVotes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-[var(--muted)]"
                  >
                    Chưa có club
                  </td>
                </tr>
              ) : (
                clubsByVotes.map((club, index) => (
                  <tr
                    key={club.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-3 py-3 text-[var(--muted)]">{index + 1}</td>
                    <td className="px-3 py-3">
                      {club.logoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={club.logoSrc}
                          alt=""
                          className="h-10 w-10 rounded object-contain"
                        />
                      ) : (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{club.nameEn}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {club.nameVi}
                        {club.code ? ` · ${club.code}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">{club.checkIns}</td>
                    <td className="px-3 py-3">
                      <ViewTransition
                        key={`${club.id}-${club.votes}`}
                        enter="slide-up"
                        default="none"
                      >
                        <span className="inline-block">{club.votes}</span>
                      </ViewTransition>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
