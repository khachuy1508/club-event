import type { Metadata } from "next";
import { LeaderboardLive } from "@/components/leaderboard-live";
import { getLeaderboardSnapshot } from "@/lib/leaderboard";
import { getPublicPusherConfig } from "@/lib/realtime";

export const metadata: Metadata = {
  title: "BXH Best Club — Club Day",
  description: "Bảng xếp hạng Best Club và danh sách clubs (công khai)",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const snapshot = await getLeaderboardSnapshot({ includeLogos: true });
  const pusher = getPublicPusherConfig();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
        Bảng xếp hạng & Clubs
      </h1>

      <LeaderboardLive
        clubs={snapshot.clubs}
        podium={snapshot.podium}
        pusherKey={pusher?.key ?? null}
        pusherCluster={pusher?.cluster ?? null}
      />
    </main>
  );
}
