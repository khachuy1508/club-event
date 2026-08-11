export type AppSessionUser = {
  id: string;
  name: string;
  role: "STUDENT" | "CLUB_STAFF" | "ADMIN";
  studentId?: string | null;
  clubId?: string | null;
  clubName?: string | null;
};

import type { Role } from "@/generated/prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      role: Role;
      studentId?: string | null;
      clubId?: string | null;
      clubName?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    role: Role;
    studentId?: string | null;
    clubId?: string | null;
    clubName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    studentId?: string | null;
    clubId?: string | null;
    clubName?: string | null;
  }
}
