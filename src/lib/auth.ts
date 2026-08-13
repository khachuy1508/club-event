import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";
import { applyAuthUrlEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

applyAuthUrlEnv();

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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const identifier = parsed.data.identifier.trim().toUpperCase();
        const password = parsed.data.password;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { studentId: identifier },
              { studentId: parsed.data.identifier.trim() },
              { studentId: parsed.data.identifier.trim().toLowerCase() },
            ],
          },
          include: {
            clubStaff: { include: { club: true } },
          },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
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
