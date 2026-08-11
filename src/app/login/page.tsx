import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loginAction } from "@/lib/actions";
import { homeForRole } from "@/lib/session";
import { ActionForm } from "@/components/action-form";
import { AppHeader } from "@/components/app-header";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(homeForRole(session.user.role));
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Đăng nhập
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sinh viên dùng MSSV. Staff/Admin dùng username được cấp.
        </p>
        <ActionForm action={loginAction} className="mt-8 space-y-4">
          <label className="block space-y-1 text-sm">
            <span>MSSV / Username</span>
            <input
              name="identifier"
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
              autoComplete="username"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Mật khẩu</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--accent)] px-4 py-2.5 font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            Đăng nhập
          </button>
        </ActionForm>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Đăng ký sinh viên
          </Link>
        </p>
      </main>
    </>
  );
}
