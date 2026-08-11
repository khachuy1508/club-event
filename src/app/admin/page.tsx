import { Role } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { ActionForm } from "@/components/action-form";
import { ToggleClubButton } from "@/components/toggle-club-button";
import {
  createClubAction,
  createStaffAction,
  resetStaffPasswordAction,
} from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { MAX_CLUBS } from "@/lib/validators";
import Link from "next/link";

export default async function AdminPage() {
  const session = await requireSession([Role.ADMIN]);

  const [students, clubs, voteGroups] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.STUDENT },
      orderBy: { createdAt: "desc" },
      include: {
        checkIns: { include: { club: true }, orderBy: { createdAt: "asc" } },
        vote: { include: { club: true } },
      },
    }),
    prisma.club.findMany({
      orderBy: { name: "asc" },
      include: {
        staff: { include: { user: true } },
        _count: { select: { checkIns: true, votes: true } },
      },
    }),
    prisma.vote.groupBy({
      by: ["clubId"],
      _count: { clubId: true },
      orderBy: { _count: { clubId: "desc" } },
    }),
  ]);

  const clubNameById = Object.fromEntries(clubs.map((c) => [c.id, c.name]));
  const leaderboard = voteGroups.map((g) => ({
    clubId: g.clubId,
    name: clubNameById[g.clubId] ?? "Unknown",
    votes: g._count.clubId,
  }));

  return (
    <>
      <AppHeader user={session.user} links={[{ href: "/admin", label: "Dashboard" }]} />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Admin dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {students.length} sinh viên · {clubs.length}/{MAX_CLUBS} clubs
            </p>
          </div>
          <Link
            href="/api/admin/export"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm hover:bg-[var(--wash)]"
          >
            Export CSV
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="Sinh viên" value={students.length} />
          <Stat
            label="Tổng check-in"
            value={clubs.reduce((sum, c) => sum + c._count.checkIns, 0)}
          />
          <Stat label="Tổng vote" value={leaderboard.reduce((s, x) => s + x.votes, 0)} />
        </section>

        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            BXH Best Club
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Chưa có vote.</p>
          ) : (
            <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {leaderboard.map((item, index) => (
                <li key={item.clubId} className="flex items-center justify-between py-3">
                  <span>
                    <span className="mr-3 text-[var(--muted)]">#{index + 1}</span>
                    {item.name}
                  </span>
                  <strong>{item.votes} vote</strong>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Clubs</h2>
            <ActionForm action={createClubAction} className="flex flex-wrap gap-2">
              <input
                name="name"
                placeholder="Tên club mới"
                required
                className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
              >
                Thêm club
              </button>
            </ActionForm>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Club</th>
                  <th className="px-3 py-2 font-medium">Check-ins</th>
                  <th className="px-3 py-2 font-medium">Votes</th>
                  <th className="px-3 py-2 font-medium">Staff</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((club) => (
                  <tr key={club.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-3 py-3 font-medium">{club.name}</td>
                    <td className="px-3 py-3">{club._count.checkIns}</td>
                    <td className="px-3 py-3">{club._count.votes}</td>
                    <td className="px-3 py-3">
                      {club.staff ? (
                        <span>{club.staff.user.studentId}</span>
                      ) : (
                        <span className="text-[var(--muted)]">Chưa có</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={club.isActive ? "text-emerald-700" : "text-rose-700"}>
                          {club.isActive ? "Active" : "Hidden"}
                        </span>
                        <ToggleClubButton clubId={club.id} isActive={club.isActive} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              Tạo staff cho club
            </h2>
            <ActionForm action={createStaffAction} className="space-y-3">
              <select
                name="clubId"
                required
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Chọn club chưa có staff
                </option>
                {clubs
                  .filter((c) => !c.staff)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <input
                name="username"
                placeholder="Username (vd: staff7)"
                required
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <input
                name="name"
                placeholder="Tên hiển thị"
                required
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <input
                name="password"
                type="password"
                placeholder="Mật khẩu"
                required
                minLength={6}
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
              >
                Tạo staff
              </button>
            </ActionForm>
          </div>

          <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              Reset mật khẩu staff
            </h2>
            <ActionForm action={resetStaffPasswordAction} className="space-y-3">
              <select
                name="userId"
                required
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Chọn staff
                </option>
                {clubs
                  .filter((c) => c.staff)
                  .map((c) => (
                    <option key={c.staff!.userId} value={c.staff!.userId}>
                      {c.staff!.user.studentId} — {c.name}
                    </option>
                  ))}
              </select>
              <input
                name="password"
                type="password"
                placeholder="Mật khẩu mới"
                required
                minLength={6}
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm hover:bg-[var(--wash)]"
              >
                Reset
              </button>
            </ActionForm>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Danh sách sinh viên
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">MSSV</th>
                  <th className="px-3 py-2 font-medium">Họ tên</th>
                  <th className="px-3 py-2 font-medium">Clubs đã đến</th>
                  <th className="px-3 py-2 font-medium">Vote</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-[var(--line)] last:border-0 align-top">
                    <td className="px-3 py-3 font-medium">{student.studentId}</td>
                    <td className="px-3 py-3">{student.name}</td>
                    <td className="px-3 py-3">
                      {student.checkIns.length === 0 ? (
                        <span className="text-[var(--muted)]">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {student.checkIns.map((c) => (
                            <li key={c.id}>{c.club.name}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {student.vote?.club.name ?? (
                        <span className="text-[var(--muted)]">Chưa vote</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">{value}</p>
    </div>
  );
}
