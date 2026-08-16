import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { catalogSlug, CLUBS_CATALOG } from "../src/lib/clubs-catalog";

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

const prisma = new PrismaClient({
  adapter: new PrismaNeonHttp(sanitizeDatabaseUrl(raw), {
    arrayMode: false,
    fullResults: true,
  }),
});

async function upsertCatalogClubs() {
  for (const [index, item] of CLUBS_CATALOG.entries()) {
    const slug = catalogSlug(item);
    const data = {
      name: item.nameEn,
      nameVi: item.nameVi,
      nameEn: item.nameEn,
      code: item.code,
      sortOrder: index + 1,
    };
    const existing = await prisma.club.findUnique({ where: { slug } });
    if (existing) {
      await prisma.club.update({ where: { slug }, data });
    } else {
      await prisma.club.create({
        data: { ...data, slug, isActive: true },
      });
    }
  }

  const catalogSlugs = new Set(CLUBS_CATALOG.map(catalogSlug));
  const allClubs = await prisma.club.findMany({ select: { id: true, slug: true } });
  for (const club of allClubs) {
    if (!catalogSlugs.has(club.slug)) {
      await prisma.club.update({
        where: { id: club.id },
        data: { isActive: false },
      });
    }
  }
}

async function upsertUser(args: {
  studentId: string;
  create: Parameters<typeof prisma.user.create>[0]["data"];
}) {
  const existing = await prisma.user.findUnique({
    where: { studentId: args.studentId },
  });
  if (existing) return existing;
  return prisma.user.create({ data: args.create });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await upsertCatalogClubs();

  await upsertUser({
    studentId: "admin",
    create: {
      name: "Event Admin",
      studentId: "admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const clubs = await prisma.club.findMany({
    orderBy: { sortOrder: "asc" },
    include: { staff: true },
  });

  for (const [index, club] of clubs.entries()) {
    if (club.staff.length > 0) continue;
    const username = `staff${index + 1}`;
    const existing = await prisma.user.findUnique({ where: { studentId: username } });
    if (existing) continue;

    const staff = await prisma.user.create({
      data: {
        name: `${club.nameEn} Staff`,
        studentId: username,
        passwordHash,
        role: Role.CLUB_STAFF,
      },
    });
    await prisma.clubStaff.create({
      data: { userId: staff.id, clubId: club.id },
    });
  }

  for (let i = 1; i <= 3; i++) {
    const studentId = `SV20260${i}`;
    await upsertUser({
      studentId,
      create: {
        name: `Sinh Vien Demo ${i}`,
        studentId,
        major: "Biotechnology",
        passwordHash,
        role: Role.STUDENT,
      },
    });
  }

  console.log("Seed complete (upsert, no wipe).");
  console.log("Admin:    admin / password123");
  console.log("Staff:    staffN / password123 (created only if club had no staff)");
  console.log("Students: SV202601..SV202603 / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
