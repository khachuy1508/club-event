import { Role } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { ActionForm } from "@/components/action-form";
import { AdminClubsPanel } from "@/components/admin-clubs-panel";
import { AdminEventHoursForm } from "@/components/admin-event-hours-form";
import { AdminStudentsPanel } from "@/components/admin-students-panel";
import { AdminTabNav } from "@/components/admin-tab-nav";
import {
  BestClubPodium,
  buildBestClubPodium,
} from "@/components/best-club-podium";
import {
  createStaffAction,
  resetStaffPasswordAction,
} from "@/lib/actions";
import { parseAdminTab } from "@/lib/admin-tabs";
import { getEventHoursSettings } from "@/lib/event-hours";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const session = await requireSession([Role.ADMIN]);
  const params = await searchParams;
  const tab = parseAdminTab(params.tab);

  const [students, clubsRaw, voteGroups, opinions, eventHours] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.STUDENT },
      orderBy: { createdAt: "desc" },
      include: {
        checkIns: { include: { club: true }, orderBy: { createdAt: "asc" } },
        vote: { include: { club: true } },
      },
    }),
    prisma.club.findMany({
      orderBy: { sortOrder: "asc" },
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
    prisma.opinion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { name: true, studentId: true } },
      },
    }),
    getEventHoursSettings(),
  ]);

  // Normalize staff to always be an array (avoids HMR/stale client returning a single object)
  const clubs = clubsRaw.map((club) => ({
    ...club,
    staff: Array.isArray(club.staff)
      ? club.staff
      : club.staff
        ? [club.staff]
        : [],
  }));

  const clubNameById = Object.fromEntries(clubs.map((c) => [c.id, c.name]));
  const leaderboard = voteGroups.map((g) => ({
    clubId: g.clubId,
    name: clubNameById[g.clubId] ?? "Unknown",
    votes: g._count.clubId,
  }));

  const totalCheckIns = clubs.reduce((sum, c) => sum + c._count.checkIns, 0);
  const totalVotes = leaderboard.reduce((s, x) => s + x.votes, 0);
  const podium = buildBestClubPodium(
    leaderboard,
    [...clubs]
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi")),
  );

  return (
    <>
      <AppHeader user={session.user} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-4 px-4 py-8 sm:gap-6 lg:gap-8">
        <aside className="sticky top-6 w-40 shrink-0 sm:w-52">
          <p className="mb-3 font-[family-name:var(--font-display)] text-lg text-[var(--ink)] lg:mb-4">
            Admin
          </p>
          <AdminTabNav active={tab} />
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Admin dashboard
            </h1>
          </div>
          <Link
            href="/api/admin/export"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm hover:bg-[var(--wash)]"
          >
            Export CSV
          </Link>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="Số sinh viên tham gia" value={students.length} />
          <Stat label="Tổng lượt checkin tại CLUBS" value={totalCheckIns} />
          <Stat label="Tổng vote" value={totalVotes} />
        </section>

        <div className="min-h-[320px]">
          {tab === "best" ? (
            <BestClubPodium
              entries={podium.entries}
              isPlaceholder={podium.isPlaceholder}
            />
          ) : null}

          {tab === "clubs" ? (
            <AdminClubsPanel
              clubs={clubs.map((club) => ({
                id: club.id,
                nameVi: club.nameVi,
                nameEn: club.nameEn,
                code: club.code,
                hasLogo: Boolean(club.logoSrc),
                logoSrc: club.logoSrc,
                isActive: club.isActive,
                checkIns: club._count.checkIns,
                votes: club._count.votes,
                staffUsernames: club.staff.map((s) => s.user.studentId ?? ""),
              }))}
            />
          ) : null}

          {tab === "hours" ? (
            <AdminEventHoursForm settings={eventHours} />
          ) : null}

          {tab === "staff" ? (
            <section className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <h2 className="font-[family-name:var(--font-display)] text-2xl">
                  Tạo staff cho club
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Một club có thể có nhiều staff. Username không chứa khoảng trắng.
                </p>
                <ActionForm action={createStaffAction} className="space-y-3">
                  <select
                    name="clubId"
                    required
                    className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Chọn club
                    </option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.staff.length > 0 ? ` (${c.staff.length} staff)` : ""}
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
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
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
                    {clubs.flatMap((c) =>
                      c.staff.map((s) => (
                        <option key={s.userId} value={s.userId}>
                          {s.user.studentId} — {c.name}
                        </option>
                      )),
                    )}
                  </select>
                  <input
                    name="password"
                    type="password"
                    placeholder="Mật khẩu mới"
                    required
                    minLength={6}
                    className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
                  />
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
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
          ) : null}

          {tab === "students" ? (
            <AdminStudentsPanel
              students={students.map((student) => ({
                id: student.id,
                studentId: student.studentId ?? "",
                name: student.name,
                checkIns: student.checkIns.map((item) => ({
                  id: item.id,
                  clubName: item.club.name,
                  slotName: item.slotName,
                  createdAt: item.createdAt.toISOString(),
                })),
                voteClubName: student.vote?.club.name ?? null,
                voteAt: student.vote?.createdAt.toISOString() ?? null,
              }))}
            />
          ) : null}

          {tab === "opinions" ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl">Opinions</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]">
                    <tr>
                      <th className="px-3 py-2 font-medium">MSSV</th>
                      <th className="px-3 py-2 font-medium">Tên</th>
                      <th className="px-3 py-2 font-medium">Ý kiến</th>
                      <th className="px-3 py-2 font-medium">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opinions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-[var(--muted)]">
                          Chưa có ý kiến
                        </td>
                      </tr>
                    ) : (
                      opinions.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--line)] last:border-0">
                          <td className="px-3 py-3">{item.student.studentId}</td>
                          <td className="px-3 py-3">{item.student.name}</td>
                          <td className="max-w-md whitespace-pre-wrap px-3 py-3">{item.body}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-[var(--muted)]">
                            {item.createdAt.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
        </main>
      </div>
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
