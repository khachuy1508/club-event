"use client";

import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { ActionForm } from "@/components/action-form";
import {
  resetStudentPasswordAction,
  setStudentGiftRedeemedAction,
} from "@/lib/actions";

export type AdminStudentRow = {
  id: string;
  studentId: string;
  name: string;
  giftRedeemed: boolean;
  checkIns: {
    id: string;
    clubName: string;
    slotName: string | null;
    createdAt: string;
  }[];
  voteClubName: string | null;
  voteAt: string | null;
};

type Props = {
  students: AdminStudentRow[];
};

function GiftRedeemedBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
      Đã đổi quà
    </span>
  );
}

function ResetStudentPasswordButton({
  userId,
  studentId,
}: {
  userId: string;
  studentId: string;
}) {
  return (
    <ActionForm action={resetStudentPasswordAction} className="inline-flex">
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
        onClick={(event) => {
          event.stopPropagation();
          if (
            !window.confirm(
              `Reset mật khẩu của ${studentId || "sinh viên này"}?`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        Reset password
      </button>
    </ActionForm>
  );
}

function GiftRedeemedToggle({
  userId,
  giftRedeemed,
}: {
  userId: string;
  giftRedeemed: boolean;
}) {
  return (
    <ActionForm action={setStudentGiftRedeemedAction} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        type="hidden"
        name="giftRedeemed"
        value={giftRedeemed ? "false" : "true"}
      />
      {giftRedeemed ? (
        <div className="flex flex-wrap items-center gap-2">
          <GiftRedeemedBadge />
          <button
            type="submit"
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm hover:bg-[var(--wash)]"
          >
            Bỏ đánh dấu
          </button>
        </div>
      ) : (
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
        >
          Đánh dấu đã đổi quà
        </button>
      )}
    </ActionForm>
  );
}

function slotLabel(clubName: string, slotName: string | null) {
  return slotName ? `${clubName} (${slotName})` : `${clubName} (—)`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
}

function ClubsCell({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-[var(--muted)]">—</span>;
  }

  if (names.length <= 2) {
    return <span>{names.join(", ")}</span>;
  }

  const visible = names.slice(0, 2).join(", ");
  const rest = names.length - 2;
  const full = names.join(", ");

  return (
    <span className="group relative inline-flex max-w-full cursor-default items-baseline gap-1">
      <span>
        {visible},{" "}
        <span className="font-medium text-[var(--accent)]">+{rest}</span>
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-max max-w-xs rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink)] shadow-lg group-hover:block"
      >
        {full}
      </span>
    </span>
  );
}

function StudentDetailModal({
  student,
  onClose,
}: {
  student: AdminStudentRow;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_60px_-30px_rgba(15,40,35,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="overflow-y-auto p-5">
          <div>
            <h3
              id={titleId}
              className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]"
            >
              {student.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{student.studentId}</p>
          </div>

          <section className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold text-[var(--ink)]">Đổi quà</h4>
            <GiftRedeemedToggle
              userId={student.id}
              giftRedeemed={student.giftRedeemed}
            />
          </section>

          <section className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold text-[var(--ink)]">Check-in</h4>
            {student.checkIns.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Chưa check-in club nào.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {student.checkIns.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-3 text-sm"
                  >
                    <span className="font-medium">{item.clubName}</span>
                    <span className="shrink-0 text-[var(--muted)]">
                      {item.slotName ?? "—"}
                      {" · "}
                      {formatWhen(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold text-[var(--ink)]">Vote Best Club</h4>
            {student.voteClubName ? (
              <p className="text-sm">
                <span className="font-medium">{student.voteClubName}</span>
                {student.voteAt ? (
                  <span className="text-[var(--muted)]">
                    {" "}
                    · {formatWhen(student.voteAt)}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-sm text-[var(--muted)]">Chưa vote.</p>
            )}
          </section>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--line)] px-5 py-3">
          <ResetStudentPasswordButton
            userId={student.id}
            studentId={student.studentId}
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm hover:bg-[var(--wash)]"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
}

export function AdminStudentsPanel({ students }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!deferredQuery) return students;
    return students.filter((student) => {
      const id = (student.studentId ?? "").toLowerCase();
      const name = student.name.toLowerCase();
      return id.includes(deferredQuery) || name.includes(deferredQuery);
    });
  }, [students, deferredQuery]);

  const selected = selectedId
    ? (students.find((s) => s.id === selectedId) ?? null)
    : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Danh sách sinh viên
        </h2>
        <label className="block w-full max-w-sm space-y-1 text-sm sm:w-72">
          <span className="text-[var(--muted)]">Tìm MSSV / họ tên</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="VD: SV202601 hoặc Nguyen"
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
          />
        </label>
      </div>

      <p className="text-sm text-[var(--muted)]">
        {filtered.length}/{students.length} sinh viên
        {deferredQuery ? ` · lọc “${query.trim()}”` : ""}
      </p>

      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">MSSV</th>
              <th className="px-3 py-2 font-medium">Họ tên</th>
              <th className="px-3 py-2 font-medium">Đổi quà</th>
              <th className="px-3 py-2 font-medium">Clubs đã đến</th>
              <th className="px-3 py-2 font-medium">Khung giờ</th>
              <th className="px-3 py-2 font-medium">Vote</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[var(--muted)]">
                  Không tìm thấy sinh viên.
                </td>
              </tr>
            ) : (
              filtered.map((student) => {
                const clubNames = student.checkIns.map((c) => c.clubName);
                const slotNames = student.checkIns.map((c) =>
                  slotLabel(c.clubName, c.slotName),
                );
                return (
                  <tr
                    key={student.id}
                    className="cursor-pointer border-b border-[var(--line)] last:border-0 align-top transition hover:bg-[var(--wash)]"
                    onClick={() => setSelectedId(student.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(student.id);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-3 py-3 font-medium text-[var(--accent)] underline-offset-2">
                      {student.studentId}
                    </td>
                    <td className="px-3 py-3">{student.name}</td>
                    <td className="px-3 py-3">
                      {student.giftRedeemed ? (
                        <GiftRedeemedBadge />
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ClubsCell names={clubNames} />
                    </td>
                    <td className="px-3 py-3">
                      <ClubsCell names={slotNames} />
                    </td>
                    <td className="px-3 py-3">
                      {student.voteClubName ?? (
                        <span className="text-[var(--muted)]">Chưa vote</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <StudentDetailModal
          student={selected}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  );
}
