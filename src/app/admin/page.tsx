import { Role } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { ActionForm } from "@/components/action-form";
import { AdminStudentsPanel } from "@/components/admin-students-panel";
import { AdminTabNav } from "@/components/admin-tab-nav";
import {
  BestClubPodium,
  buildBestClubPodium,
} from "@/components/best-club-podium";
import { ToggleClubButton } from "@/components/toggle-club-button";
import {
  createClubAction,
  createStaffAction,
  resetStaffPasswordAction,
} from "@/lib/actions";
import { parseAdminTab } from "@/lib/admin-tabs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { MAX_CLUBS } from "@/lib/validators";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const session = await requireSession([Role.ADMIN]);
  const params = await searchParams;
  const tab = parseAdminTab(params.tab);

  const [students, clubsRaw, voteGroups] = await Promise.all([
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
      <AppHeader user={session.user} links={[{ href: "/admin", label: "Dashboard" }]} />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-10">
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

        <AdminTabNav active={tab} />

        <div className="min-h-[320px]">
          {tab === "best" ? (
            <BestClubPodium
              entries={podium.entries}
              isPlaceholder={podium.isPlaceholder}
            />
          ) : null}

          {tab === "clubs" ? (
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
                      <tr
                        key={club.id}
                        className="border-b border-[var(--line)] last:border-0"
                      >
                        <td className="px-3 py-3 font-medium">{club.name}</td>
                        <td className="px-3 py-3">{club._count.checkIns}</td>
                        <td className="px-3 py-3">{club._count.votes}</td>
                        <td className="px-3 py-3">
                          {club.staff.length === 0 ? (
                            <span className="text-[var(--muted)]">Chưa có</span>
                          ) : (
                            <ul className="space-y-0.5">
                              {club.staff.map((s) => (
                                <li key={s.id}>{s.user.studentId}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                club.isActive ? "text-emerald-700" : "text-rose-700"
                              }
                            >
                              {club.isActive ? "Active" : "Hidden"}
                            </span>
                            <ToggleClubButton
                              clubId={club.id}
                              isActive={club.isActive}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
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
                  createdAt: item.createdAt.toISOString(),
                })),
                voteClubName: student.vote?.club.name ?? null,
                voteAt: student.vote?.createdAt.toISOString() ?? null,
              }))}
            />
          ) : null}
        </div>
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
