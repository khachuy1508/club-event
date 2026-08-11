"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = {
  token: string;
  studentId: string;
  name: string;
};

export function StudentQrCard({ token, studentId, name }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_-40px_rgba(15,40,35,0.45)]">
      <div className="text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">{name}</p>
        <p className="mt-1 text-sm tracking-wide text-[var(--muted)]">{studentId}</p>
      </div>
      <div className="rounded-xl bg-white p-4">
        <QRCodeSVG value={token} size={220} level="M" includeMargin={false} />
      </div>
      <p className="text-center text-sm text-[var(--muted)]">
        Đưa mã này cho staff club để check-in. QR có hiệu lực trong ngày sự kiện.
      </p>
    </div>
  );
}
