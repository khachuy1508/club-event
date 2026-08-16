import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import type { AppSessionUser } from "@/types/next-auth";

type Props = {
  user?: AppSessionUser | null;
  links?: { href: string; label: string }[];
  variant?: "default" | "passport";
};

export function AppHeader({ user, links = [], variant = "default" }: Props) {
  const isPassport = variant === "passport";
  return (
    <header
      className={
        isPassport
          ? "border-b border-white/20 bg-slate-950/25 backdrop-blur-md"
          : "border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-5xl min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
        <Link
          href="/"
          className={`shrink-0 font-[family-name:var(--font-display)] text-base tracking-tight sm:text-xl ${
            isPassport ? "text-white" : "text-[var(--ink)]"
          }`}
        >
          Club Day
        </Link>
        <nav className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs sm:gap-3 sm:text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isPassport
                  ? "text-white/80 transition hover:text-white"
                  : "text-[var(--muted)] transition hover:text-[var(--ink)]"
              }
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className={
                  isPassport
                    ? "rounded-md border border-white/40 px-2 py-1 text-white hover:bg-white/10 sm:px-3 sm:py-1.5"
                    : "rounded-md border border-[var(--line)] px-2 py-1 text-[var(--ink)] hover:bg-[var(--wash)] sm:px-3 sm:py-1.5"
                }
              >
                Đăng xuất
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-white hover:bg-[var(--accent-strong)]"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
