import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { registerStudentAction } from "@/lib/actions";
import { homeForRole } from "@/lib/session";
import { ActionForm } from "@/components/action-form";
import { AppHeader } from "@/components/app-header";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect(homeForRole(session.user.role));
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Đăng ký sinh viên
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Dùng mã số sinh viên để tạo tài khoản và nhận QR check-in.
        </p>
        <ActionForm action={registerStudentAction} className="mt-8 space-y-4">
          <label className="block space-y-1 text-sm">
            <span>Mã số sinh viên</span>
            <input
              name="studentId"
              required
              placeholder="VD: SV202601"
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 uppercase"
              autoComplete="username"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Họ và tên</span>
            <input
              name="name"
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
              autoComplete="name"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Mật khẩu</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
              autoComplete="new-password"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Nhập lại mật khẩu</span>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
              autoComplete="new-password"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--accent)] px-4 py-2.5 font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            Tạo tài khoản
          </button>
        </ActionForm>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </main>
    </>
  );
}
