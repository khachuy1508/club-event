import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";
import { applyAuthUrlEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

applyAuthUrlEnv();

function credentialString(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

function passwordHashFromDb(value: unknown) {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  return "";
}

async function findUserByStudentIds(studentIds: string[]) {
  const select = {
    id: true,
    name: true,
    role: true,
    studentId: true,
    passwordHash: true,
    clubStaff: {
      select: {
        clubId: true,
        club: { select: { name: true } },
      },
    },
  } as const;

  for (let attempt = 0; attempt < 3; attempt++) {
    const user = await prisma.user.findFirst({
      where: { studentId: { in: studentIds } },
      select,
    });
    if (user) return user;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "MSSV / Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentialString(credentials?.identifier);
        const password = credentialString(credentials?.password);
        const parsed = loginSchema.safeParse({ identifier, password });
        if (!parsed.success) return null;

        const trimmed = parsed.data.identifier;
        const studentIds = [
          ...new Set([trimmed, trimmed.toUpperCase(), trimmed.toLowerCase()]),
        ];

        const user = await findUserByStudentIds(studentIds);
        if (!user) return null;

        const hash = passwordHashFromDb(user.passwordHash);
        const valid = hash ? await bcrypt.compare(parsed.data.password, hash) : false;
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          clubId: user.clubStaff?.clubId ?? null,
          clubName: user.clubStaff?.club.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.studentId = user.studentId;
        token.clubId = user.clubId;
        token.clubName = user.clubName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name ?? "";
      session.user.role = token.role;
      session.user.studentId = token.studentId;
      session.user.clubId = token.clubId;
      session.user.clubName = token.clubName;
      return session;
    },
  },
});
