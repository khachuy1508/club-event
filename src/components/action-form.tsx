"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionResult } from "@/lib/actions";

type Props = {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
};

function snapshotForm(form: HTMLFormElement) {
  const saved: Record<string, string> = {};
  const elements = Array.from(form.elements) as Array<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >;

  for (const el of elements) {
    if (!el.name || el.disabled) continue;
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        if (el.checked) saved[el.name] = el.value;
        continue;
      }
      if (el.type === "file" || el.type === "submit" || el.type === "button") continue;
    }
    saved[el.name] = el.value;
  }
  return saved;
}

function restoreForm(form: HTMLFormElement, saved: Record<string, string>) {
  const elements = Array.from(form.elements) as Array<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >;

  for (const el of elements) {
    if (!el.name || !(el.name in saved)) continue;
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = el.value === saved[el.name];
        continue;
      }
      if (el.type === "file" || el.type === "submit" || el.type === "button") continue;
    }
    el.value = saved[el.name] ?? "";
  }
}

export function ActionForm({ action, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const savedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!state || state.ok) return;
    const form = formRef.current;
    if (!form) return;

    // React resets uncontrolled fields after the action; restore on the next frame.
    const id = window.requestAnimationFrame(() => {
      restoreForm(form, savedRef.current);
    });
    return () => window.cancelAnimationFrame(id);
  }, [state]);

  return (
    <form
      ref={formRef}
      className={className}
      action={(formData) => {
        if (formRef.current) {
          savedRef.current = snapshotForm(formRef.current);
        }
        return formAction(formData);
      }}
    >
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
