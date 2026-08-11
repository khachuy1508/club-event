import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import type { AppSessionUser } from "@/types/next-auth";

type Props = {
  user?: AppSessionUser | null;
  links?: { href: string; label: string }[];
};

export function AppHeader({ user, links = [] }: Props) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
          Club Day
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-[var(--line)] px-3 py-1.5 text-[var(--ink)] hover:bg-[var(--wash)]"
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
