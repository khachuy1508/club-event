/**
 * Mark (or unmark) gift redemption for one student.
 *
 * Usage:
 *   npx tsx scripts/redeem-gift.ts <MSSV>
 *   npx tsx scripts/redeem-gift.ts <MSSV> --undo
 *
 * Examples:
 *   npx tsx scripts/redeem-gift.ts SV202601
 *   npx tsx scripts/redeem-gift.ts sv202601 --undo
 */
import "dotenv/config";
import Pusher from "pusher";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import {
  GIFT_REDEEMED_EVENT,
  studentChannel,
} from "../src/lib/realtime-shared";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const UNDO = process.argv.includes("--undo");
const studentIdArg = args[0];

if (!studentIdArg) {
  console.error("Usage: npx tsx scripts/redeem-gift.ts <MSSV> [--undo]");
  process.exit(1);
}

const raw = process.env.DATABASE_URL;
if (!raw) {
  throw new Error("DATABASE_URL is not set");
}

function sanitizeDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function readEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}

async function publishGiftRedeemed(userId: string, giftRedeemed: boolean) {
  const appId = readEnv("PUSHER_APP_ID");
  const key = readEnv("PUSHER_KEY");
  const secret = readEnv("PUSHER_SECRET");
  const cluster = readEnv("PUSHER_CLUSTER");
  if (!appId || !key || !secret || !cluster) {
    console.warn("Skip Pusher: missing PUSHER_* env (badge sẽ hiện sau khi reload)");
    return;
  }
  const pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
  await pusher.trigger(studentChannel(userId), GIFT_REDEEMED_EVENT, {
    giftRedeemed,
    at: new Date().toISOString(),
  });
  console.log(`✓ Pushed ${GIFT_REDEEMED_EVENT} → ${studentChannel(userId)}`);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeonHttp(sanitizeDatabaseUrl(raw), {
    arrayMode: false,
    fullResults: true,
  }),
});

async function main() {
  const studentId = studentIdArg.trim().toUpperCase();
  const giftRedeemed = !UNDO;

  const user = await prisma.user.findFirst({
    where: {
      role: Role.STUDENT,
      OR: [
        { studentId },
        { studentId: studentIdArg.trim() },
        { studentId: studentIdArg.trim().toLowerCase() },
      ],
    },
    select: {
      id: true,
      studentId: true,
      name: true,
      giftRedeemed: true,
    },
  });

  if (!user) {
    throw new Error(`Không tìm thấy sinh viên với MSSV: ${studentIdArg}`);
  }

  console.log(
    `Found: ${user.studentId} — ${user.name} (giftRedeemed=${user.giftRedeemed})`,
  );

  if (user.giftRedeemed === giftRedeemed) {
    console.log(
      giftRedeemed
        ? "Đã đổi quà rồi — không cần cập nhật."
        : "Chưa đổi quà — không cần bỏ đánh dấu.",
    );
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { giftRedeemed },
  });

  await publishGiftRedeemed(user.id, giftRedeemed);

  console.log(
    giftRedeemed
      ? `✓ Đã đánh dấu đổi quà cho ${user.studentId}`
      : `✓ Đã bỏ đánh dấu đổi quà của ${user.studentId}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
