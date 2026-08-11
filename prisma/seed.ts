import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const clubs = [
  "Music Club",
  "Dance Club",
  "Tech Club",
  "Photo Club",
  "Debate Club",
  "Sports Club",
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  await prisma.vote.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.clubStaff.deleteMany();
  await prisma.club.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      name: "Event Admin",
      studentId: "admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  for (const [index, name] of clubs.entries()) {
    const club = await prisma.club.create({
      data: {
        name,
        slug: slugify(name),
        isActive: true,
      },
    });

    const staff = await prisma.user.create({
      data: {
        name: `${name} Staff`,
        studentId: `staff${index + 1}`,
        passwordHash,
        role: Role.CLUB_STAFF,
      },
    });

    await prisma.clubStaff.create({
      data: {
        userId: staff.id,
        clubId: club.id,
      },
    });
  }

  for (let i = 1; i <= 3; i++) {
    await prisma.user.create({
      data: {
        name: `Sinh Vien Demo ${i}`,
        studentId: `SV20260${i}`,
        passwordHash,
        role: Role.STUDENT,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin:    admin / password123");
  console.log("Staff:    staff1..staff6 / password123");
  console.log("Students: SV202601..SV202603 / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
