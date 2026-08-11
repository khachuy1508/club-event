"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions";

type Props = {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
};

export function ActionForm({ action, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.message ? (
        <p
          className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      {pending ? <p className="mt-2 text-sm text-[var(--muted)]">Đang xử lý…</p> : null}
    </form>
  );
}
