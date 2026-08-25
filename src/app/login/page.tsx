import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loginAction } from "@/lib/actions";
import { homeForRole } from "@/lib/session";
import { ActionForm } from "@/components/action-form";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) {
    redirect(homeForRole(session.user.role));
  }

  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl?.startsWith("/") && !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Sign in
      </h1>
      <ActionForm
        action={loginAction}
        className="mt-8 space-y-4"
        pendingLabel="Signing in…"
      >
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}
        <label className="block space-y-1 text-sm">
          <span>Username</span>
          <input
            name="identifier"
            required
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
            autoComplete="username"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
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
          Sign in
        </button>
      </ActionForm>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--accent)] underline-offset-2 hover:underline">
          Register now
        </Link>
      </p>
    </main>
  );
}
