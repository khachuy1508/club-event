"use client";

import { useState, useTransition } from "react";
import { QrScanner } from "@/components/qr-scanner";

type Result = {
  ok: boolean;
  message: string;
};

export function StaffCheckinPanel() {
  const [manualId, setManualId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit(body: { token?: string; studentId?: string }) {
    setResult(null);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Result;
    setResult(data);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Quét QR sinh viên
        </h2>
        <QrScanner
          onScan={(token) => {
            startTransition(() => {
              void submit({ token });
            });
          }}
        />
      </section>

      <section className="space-y-3 border-t border-[var(--line)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Fallback: nhập MSSV
        </h2>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() => {
              void submit({ studentId: manualId });
            });
          }}
        >
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="VD: SV202601"
            className="flex-1 rounded-md border border-[var(--line)] bg-white px-3 py-2"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={pending || !manualId.trim()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-white disabled:opacity-50"
          >
            Check-in
          </button>
        </form>
      </section>

      {pending ? <p className="text-sm text-[var(--muted)]">Đang check-in…</p> : null}
      {result ? (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-900"
          }`}
          role="status"
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
