import { NextResponse } from "next/server";
import { getLeaderboardSnapshot } from "@/lib/leaderboard";

export async function GET() {
  const data = await getLeaderboardSnapshot({ includeLogos: false });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
