"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { GraduationCap, IdCard, UserRound, X } from "lucide-react";
import { logoutAction } from "@/lib/actions";

type Props = {
  token: string;
  studentId: string;
  name: string;
  major: string;
  qrHidden?: boolean;
};

export function OrbitPassCard({
  token,
  studentId,
  name,
  major,
  qrHidden = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const showQrModal = open && !qrHidden;

  useEffect(() => {
    if (!showQrModal) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [showQrModal]);

  return (
    <section className="min-w-0 rounded-[1.2rem] border border-white/70 bg-white/85 p-3 backdrop-blur-md sm:rounded-[1.6rem] sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-0">
        <dl className="min-w-0 pr-3 sm:pr-5">
          <InfoRow icon={<UserRound className="h-4 w-4 sm:h-5 sm:w-5" />} label="FULL NAME" value={name} />
          <InfoRow icon={<IdCard className="h-4 w-4 sm:h-5 sm:w-5" />} label="STUDENT ID" value={studentId} />
          <InfoRow
            icon={<GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />}
            label="MAJOR / PROGRAM"
            value={major}
          />
        </dl>

        <div className="flex w-[6.25rem] shrink-0 flex-col justify-center gap-1 border-l border-violet-200 pl-3 text-center sm:w-[11.5rem] sm:gap-2 sm:pl-5">
          {qrHidden ? (
            <div className="flex min-h-[6.25rem] items-center justify-center sm:min-h-[11.5rem]" />
          ) : (
            <>
              <p className="text-[7px] leading-tight text-slate-500 sm:text-[11px] sm:leading-snug">
                Ấn vào mã QR để phóng to
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full rounded-xl border border-violet-200 bg-white p-1.5 sm:rounded-2xl sm:p-3"
                aria-label="Phóng to mã QR"
              >
                <p className="mb-0.5 text-[7px] font-semibold tracking-[0.12em] text-violet-700 sm:mb-1.5 sm:text-[10px] sm:tracking-[0.16em]">
                  ORBIT PASS
                </p>
                <QRCodeSVG
                  value={token}
                  size={160}
                  level="M"
                  includeMargin={false}
                  className="mx-auto h-auto w-full"
                />
              </button>
            </>
          )}
          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="w-full rounded-md border border-violet-200 bg-white/90 px-1 py-1 text-[7px] font-medium leading-tight text-violet-800 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
      <p className="mt-2 text-center text-[9px] leading-snug text-slate-500 sm:mt-4 sm:text-sm">
        Scan the QR code at club booths to collect stamps
      </p>

      {showQrModal
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={() => setOpen(false)}
            >
              <div
                className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
                <p
                  id={titleId}
                  className="text-center text-sm font-semibold tracking-[0.16em] text-violet-800"
                >
                  ORBIT PASS
                </p>
                <p className="mt-1 text-center text-xs text-slate-500">
                  {name} · {studentId}
                </p>
                <div className="mx-auto mt-4 w-full max-w-[280px]">
                  <QRCodeSVG
                    value={token}
                    size={280}
                    level="M"
                    includeMargin
                    className="h-auto w-full"
                  />
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Đưa màn hình này cho staff để check-in
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 border-b border-violet-200 py-2 sm:gap-3 sm:py-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 sm:h-8 sm:w-8">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold leading-none tracking-wide text-violet-700 sm:text-xs">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-sm font-semibold leading-snug text-slate-800 sm:text-xl">
          {value}
        </dd>
      </div>
    </div>
  );
}
