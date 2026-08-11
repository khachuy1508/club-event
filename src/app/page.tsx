import Link from "next/link";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/session";
import { AppHeader } from "@/components/app-header";

export default async function HomePage() {
  const session = await auth();

  return (
    <>
      <AppHeader user={session?.user} />
      <main className="relative flex flex-1 flex-col">
        <section className="relative isolate min-h-[78vh] overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(135deg,var(--hero-a)_0%,var(--hero-b)_55%,#245f4f_100%)]"
          />
          <div
            aria-hidden
            className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-[var(--hero-c)]/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:22px_22px]"
          />
          <div className="relative mx-auto flex max-w-5xl flex-col justify-end gap-6 px-4 pb-16 pt-28 text-white md:pt-36">
            <p className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight md:text-7xl">
              Club Day
            </p>
            <h1 className="max-w-xl text-lg text-white/85 md:text-xl">
              Check-in qua các club, đủ 3 điểm thì vote Best Club.
            </h1>
            <div className="flex flex-wrap gap-3">
              {session?.user ? (
                <Link
                  href={homeForRole(session.user.role)}
                  className="rounded-md bg-[var(--hero-c)] px-5 py-3 font-semibold text-[var(--hero-a)] transition hover:brightness-105"
                >
                  Vào khu vực của bạn
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-md bg-[var(--hero-c)] px-5 py-3 font-semibold text-[var(--hero-a)] transition hover:brightness-105"
                  >
                    Đăng ký sinh viên
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-md border border-white/40 px-5 py-3 text-white transition hover:bg-white/10"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-16 md:grid-cols-3">
          {[
            {
              title: "Sinh viên",
              body: "Tạo tài khoản bằng MSSV, hiện QR để staff check-in.",
            },
            {
              title: "Club staff",
              body: "Quét QR hoặc nhập MSSV để đánh dấu sinh viên đã đến booth.",
            },
            {
              title: "Best Club",
              body: "Đủ 3 check-in là mở vote — mỗi sinh viên một phiếu.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {item.title}
              </h2>
              <p className="text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
