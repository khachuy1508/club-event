import { NextResponse } from "next/server";

/** Fake-vote endpoint disabled on purpose (prod safety). */
function disabled() {
  return NextResponse.json(
    { ok: false, message: "Fake vote is disabled" },
    { status: 404 },
  );
}

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}
