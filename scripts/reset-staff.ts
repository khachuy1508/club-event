/**
 * Wipe all CLUB_STAFF users and create one `{abbr}-admin` account per club.
 *
 * Usage:
 *   npx tsx scripts/reset-staff.ts           # dry-run (default)
 *   npx tsx scripts/reset-staff.ts --apply   # mutate database
 *
 * Password for every new staff account: pass123
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import ws from "ws";

// WebSocket pool supports writes that Prisma wraps in transactions
// (Neon HTTP adapter does not).
neonConfig.webSocketConstructor = ws;

const PASSWORD = "pass123";
const APPLY = process.argv.includes("--apply");

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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/** Prefer club.code; fall back to slug. Disambiguate duplicate codes via slug. */
function adminUsername(
  club: { code: string | null; slug: string },
  used: Set<string>,
): string {
  const fromCode = club.code ? slugify(club.code) : "";
  const fromSlug = slugify(club.slug);
  let base = fromCode || fromSlug || "club";
  let username = `${base}-admin`.slice(0, 32);

  if (used.has(username)) {
    // e.g. both Basketball & Badminton have code UBC
    const slugTail = fromSlug.replace(/^usth-/, "") || fromSlug;
    base = slugify(slugTail) || `${base}-2`;
    username = `${base}-admin`.slice(0, 32);
  }

  let n = 2;
  while (used.has(username)) {
    const suffix = `-admin`;
    const maxBase = 32 - suffix.length - String(n).length - 1;
    username = `${base.slice(0, maxBase)}-${n}${suffix}`;
    n += 1;
  }

  used.add(username);
  return username;
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: sanitizeDatabaseUrl(raw) }),
});

async function main() {
  const clubs = await prisma.club.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      staff: {
        include: { user: { select: { id: true, studentId: true, name: true } } },
      },
    },
  });

  const currentStaff = await prisma.user.findMany({
    where: { role: Role.CLUB_STAFF },
    select: {
      id: true,
      studentId: true,
      name: true,
      clubStaff: { select: { club: { select: { nameEn: true, code: true } } } },
    },
    orderBy: { studentId: "asc" },
  });

  const used = new Set<string>();
  const planned = clubs.map((club) => ({
    clubId: club.id,
    clubName: club.nameEn,
    code: club.code,
    username: adminUsername(club, used),
    currentStaff: club.staff.map((s) => s.user.studentId ?? s.user.id),
  }));

  console.log(`Mode: ${APPLY ? "APPLY (will mutate)" : "DRY-RUN (no changes)"}`);
  console.log(`Active clubs: ${clubs.length}`);
  console.log(`Current staff users to delete: ${currentStaff.length}`);
  console.log("");
  console.log("Current staff:");
  for (const s of currentStaff) {
    const clubLabel = s.clubStaff
      ? `${s.clubStaff.club.code ?? "—"} / ${s.clubStaff.club.nameEn}`
      : "(no club)";
    console.log(`  - ${s.studentId ?? s.id}  (${s.name})  →  ${clubLabel}`);
  }
  console.log("");
  console.log("Planned new accounts (password: pass123):");
  for (const row of planned) {
    const old =
      row.currentStaff.length > 0 ? `  [was: ${row.currentStaff.join(", ")}]` : "";
    console.log(
      `  - ${row.username.padEnd(28)} ← ${row.code ?? "null"} / ${row.clubName}${old}`,
    );
  }

  if (!APPLY) {
    console.log("");
    console.log("Dry-run only. Re-run with --apply to execute.");
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) {
    throw new Error("No ADMIN user found — needed to reassign CheckIn.checkedInById");
  }

  const staffIds = currentStaff.map((s) => s.id);
  if (staffIds.length > 0) {
    let reassigned = 0;
    for (const staffId of staffIds) {
      const result = await prisma.checkIn.updateMany({
        where: { checkedInById: staffId },
        data: { checkedInById: admin.id },
      });
      reassigned += result.count;
    }
    console.log(`Reassigned ${reassigned} check-in(s) to admin ${admin.studentId}`);

    let deleted = 0;
    for (const staff of currentStaff) {
      await prisma.clubStaff.deleteMany({ where: { userId: staff.id } });
      await prisma.user.delete({ where: { id: staff.id } });
      deleted += 1;
      console.log(`Deleted staff: ${staff.studentId ?? staff.id}`);
    }
    console.log(`Deleted ${deleted} staff user(s)`);
  } else {
    console.log("No existing staff to delete.");
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const row of planned) {
    const existing = await prisma.user.findUnique({
      where: { studentId: row.username },
    });
    if (existing) {
      throw new Error(
        `Username already taken (not staff?): ${row.username} (id=${existing.id}, role=${existing.role})`,
      );
    }

    const user = await prisma.user.create({
      data: {
        name: `${row.clubName} Admin`,
        studentId: row.username,
        passwordHash,
        role: Role.CLUB_STAFF,
      },
    });
    await prisma.clubStaff.create({
      data: { userId: user.id, clubId: row.clubId },
    });
    console.log(`Created ${row.username} → ${row.clubName}`);
  }

  console.log("");
  console.log("Done. All new staff passwords: pass123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
