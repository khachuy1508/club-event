import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden">
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
        <div className="relative mx-auto flex flex-1 max-w-5xl flex-col items-start justify-center gap-8 px-4 py-16 text-white">
          <p className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight md:text-7xl">
            Club Day
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-md bg-[var(--hero-c)] px-5 py-3 font-semibold text-[var(--hero-a)] transition hover:brightness-105"
            >
              Đăng ký
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/40 px-5 py-3 text-white transition hover:bg-white/10"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
