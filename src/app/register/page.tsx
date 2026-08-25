import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { registerStudentAction } from "@/lib/actions";
import { homeForRole } from "@/lib/session";
import { ActionForm } from "@/components/action-form";
import { USTH_MAJORS } from "@/lib/majors";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect(homeForRole(session.user.role));
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Student registration
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Use your student ID to create an account and get a check-in QR code.
      </p>
      <ActionForm
        action={registerStudentAction}
        className="mt-8 space-y-4"
        pendingLabel="Creating account…"
      >
        <label className="block space-y-1 text-sm">
          <span>Student ID</span>
          <input
            name="studentId"
            required
            placeholder="e.g. SV202601"
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 uppercase"
            autoComplete="username"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Full name</span>
          <input
            name="name"
            required
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
            autoComplete="name"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Major</span>
          <select
            name="major"
            required
            defaultValue=""
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
          >
            <option value="" disabled>
              Select a major
            </option>
            {USTH_MAJORS.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
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
          <span>Confirm password</span>
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
          Create account
        </button>
      </ActionForm>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)] underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
