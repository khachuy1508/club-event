"use client";

import { ActionForm } from "@/components/action-form";
import { saveEventHoursAction } from "@/lib/actions";
import type { EventHoursSettings } from "@/lib/event-hours";

type Props = {
  settings: EventHoursSettings | null;
};

const field =
  "w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm";

export function AdminEventHoursForm({ settings }: Props) {
  return (
    <section className="max-w-xl space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Khung giờ event
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sau khi lưu, staff chỉ check-in được trong 2 khung giờ này mỗi ngày
          (giờ Việt Nam).
        </p>
      </div>

      <ActionForm action={saveEventHoursAction} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <p className="text-sm font-medium sm:col-span-3">Sáng</p>
          <label className="block space-y-1 text-sm">
            <span>Tên</span>
            <input
              name="morningName"
              required
              defaultValue={settings?.morningName ?? "Sáng"}
              className={field}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Từ</span>
            <input
              type="time"
              name="morningStart"
              required
              defaultValue={settings?.morningStart ?? "08:00"}
              className={field}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Đến</span>
            <input
              type="time"
              name="morningEnd"
              required
              defaultValue={settings?.morningEnd ?? "12:00"}
              className={field}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <p className="text-sm font-medium sm:col-span-3">Chiều</p>
          <label className="block space-y-1 text-sm">
            <span>Tên</span>
            <input
              name="afternoonName"
              required
              defaultValue={settings?.afternoonName ?? "Chiều"}
              className={field}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Từ</span>
            <input
              type="time"
              name="afternoonStart"
              required
              defaultValue={settings?.afternoonStart ?? "14:00"}
              className={field}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Đến</span>
            <input
              type="time"
              name="afternoonEnd"
              required
              defaultValue={settings?.afternoonEnd ?? "17:00"}
              className={field}
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
        >
          Lưu khung giờ
        </button>
      </ActionForm>
    </section>
  );
}
