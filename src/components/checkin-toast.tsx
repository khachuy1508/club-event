"use client";

type Props = {
  open: boolean;
  ok: boolean;
  message: string;
  onContinue: () => void;
  onClose: () => void;
  continueLabel?: string;
};

export function CheckinToast({
  open,
  ok,
  message,
  onContinue,
  onClose,
  continueLabel = "Tiếp tục quét",
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="status"
      aria-live="polite"
    >
      <div
        className={`w-full max-w-md animate-[toast-in_0.25s_ease-out] rounded-2xl border px-4 py-4 shadow-[0_16px_40px_-20px_rgba(15,40,35,0.55)] ${
          ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <p className="text-sm font-medium leading-snug">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 rounded-md bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            {continueLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] hover:bg-[var(--wash)]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
