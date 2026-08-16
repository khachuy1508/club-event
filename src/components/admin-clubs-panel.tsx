"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ImagePlus, Pencil, X } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { createClubAction, updateClubAction } from "@/lib/actions";
import { MAX_LOGO_BYTES } from "@/lib/validators";

export type AdminClubRow = {
  id: string;
  nameVi: string;
  nameEn: string;
  code: string | null;
  hasLogo: boolean;
  logoSrc: string | null;
  isActive: boolean;
  checkIns: number;
  votes: number;
  staffUsernames: string[];
};

type Editor =
  | { mode: "create" }
  | { mode: "edit"; club: AdminClubRow };

export function AdminClubsPanel({ clubs }: { clubs: AdminClubRow[] }) {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Clubs</h2>
        <button
          type="button"
          onClick={() => setEditor({ mode: "create" })}
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white hover:bg-[var(--accent-strong)]"
        >
          Thêm club
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--wash)] text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Logo</th>
              <th className="px-3 py-2 font-medium">Club</th>
              <th className="px-3 py-2 font-medium">Check-ins</th>
              <th className="px-3 py-2 font-medium">Votes</th>
              <th className="px-3 py-2 font-medium">Staff</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-3 py-3">
                  {club.hasLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={club.logoSrc ?? ""}
                      alt=""
                      className="h-10 w-10 rounded object-contain"
                    />
                  ) : (
                    <span className="text-xs text-[var(--muted)]">Chưa có</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{club.nameEn}</p>
                  <p className="text-xs text-[var(--muted)]">{club.nameVi}</p>
                  {club.code ? (
                    <p className="text-xs text-[var(--muted)]">{club.code}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3">{club.checkIns}</td>
                <td className="px-3 py-3">{club.votes}</td>
                <td className="px-3 py-3">
                  {club.staffUsernames.length === 0 ? (
                    <span className="text-[var(--muted)]">Chưa có</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {club.staffUsernames.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setEditor({ mode: "edit", club })}
                    className="rounded-md border border-[var(--line)] p-1.5 text-[var(--ink)] hover:bg-[var(--wash)]"
                    aria-label={`Sửa ${club.nameEn}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editor ? (
        <ClubFormModal editor={editor} onClose={() => setEditor(null)} />
      ) : null}
    </section>
  );
}

function ClubFormModal({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const isEdit = editor.mode === "edit";
  const club = isEdit ? editor.club : null;

  const onSuccess = useCallback(() => {
    onClose();
    router.refresh();
  }, [onClose, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const field =
    "w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 id={titleId} className="font-[family-name:var(--font-display)] text-xl">
          {isEdit ? "Sửa club" : "Thêm club"}
        </h3>

        <ActionForm
          key={club?.id ?? "create"}
          action={isEdit ? updateClubAction : createClubAction}
          onSuccess={onSuccess}
          className="mt-4 space-y-3"
        >
          {club ? <input type="hidden" name="clubId" value={club.id} /> : null}
          <label className="block space-y-1 text-sm">
            <span>Tên tiếng Việt</span>
            <input name="nameVi" required defaultValue={club?.nameVi ?? ""} className={field} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Tên tiếng Anh</span>
            <input name="nameEn" required defaultValue={club?.nameEn ?? ""} className={field} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Mã (tuỳ chọn)</span>
            <input name="code" defaultValue={club?.code ?? ""} className={field} />
          </label>
          <LogoFileField
            existingSrc={club?.logoSrc ?? null}
            isEdit={isEdit}
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--line)] px-3 py-2 text-sm hover:bg-[var(--wash)]"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
            >
              {isEdit ? "Lưu" : "Tạo club"}
            </button>
          </div>
        </ActionForm>
      </div>
    </div>,
    document.body,
  );
}

function LogoFileField({
  existingSrc,
  isEdit,
}: {
  existingSrc: string | null;
  isEdit: boolean;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="space-y-2 text-sm">
      <span className="block">Logo</span>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--wash)] p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-white">
          {preview || existingSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview ?? existingSrc ?? ""}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-[var(--muted)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-strong)]">
            <ImagePlus className="h-4 w-4" />
            {fileName || existingSrc ? "Đổi logo" : "Tải logo lên"}
            <input
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const input = event.target;
                const file = input.files?.[0];
                if (preview) URL.revokeObjectURL(preview);
                if (!file) {
                  setFileName(null);
                  setPreview(null);
                  setFileError(null);
                  return;
                }
                if (file.size > MAX_LOGO_BYTES) {
                  input.value = "";
                  setFileName(null);
                  setPreview(null);
                  setFileError("Logo tối đa 500KB");
                  return;
                }
                setFileError(null);
                setFileName(file.name);
                setPreview(URL.createObjectURL(file));
              }}
            />
          </label>
          <p
            className={`mt-1.5 truncate text-xs ${
              fileError ? "text-red-600" : "text-[var(--muted)]"
            }`}
          >
            {fileError
              ? fileError
              : fileName
                ? fileName
                : isEdit
                  ? "JPEG, PNG hoặc WebP · tối đa 500KB. Bỏ trống để giữ logo cũ."
                  : "JPEG, PNG hoặc WebP · tối đa 500KB"}
          </p>
        </div>
      </div>
    </div>
  );
}
