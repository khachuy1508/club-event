"use client";

import { useState, useTransition } from "react";
import { CheckinToast } from "@/components/checkin-toast";
import { QrScanner } from "@/components/qr-scanner";

type Result = {
  ok: boolean;
  message: string;
};

export function StaffCheckinPanel() {
  const [manualId, setManualId] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [toast, setToast] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit(body: { token?: string; studentId?: string }) {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Result;
    setToast(data);
    return data;
  }

  function continueScan() {
    setToast(null);
    setCameraOn(true);
  }

  function closeToast() {
    setToast(null);
    setCameraOn(false);
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <QrScanner
          active={cameraOn}
          onStop={() => setCameraOn(false)}
          onScan={(token) => {
            setCameraOn(false);
            startTransition(() => {
              void submit({ token });
            });
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !!toast}
            onClick={() => {
              setToast(null);
              setCameraOn(true);
            }}
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {cameraOn ? "Camera đang bật" : "Bật camera"}
          </button>
          <button
            type="button"
            disabled={!cameraOn}
            onClick={() => setCameraOn(false)}
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-50"
          >
            Tắt camera
          </button>
        </div>
      </section>

      <section className="space-y-2 border-t border-[var(--line)] pt-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Hoặc nhập mssv.
        </h2>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setCameraOn(false);
            startTransition(() => {
              void submit({ studentId: manualId }).then(() => {
                setManualId("");
              });
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

      <CheckinToast
        open={!!toast && !pending}
        ok={toast?.ok ?? false}
        message={toast?.message ?? ""}
        onContinue={continueScan}
        onClose={closeToast}
      />
    </div>
  );
}
