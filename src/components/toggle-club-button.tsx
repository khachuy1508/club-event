"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleClubAction } from "@/lib/actions";

export function ToggleClubButton({
  clubId,
  isActive,
}: {
  clubId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleClubAction(clubId);
          router.refresh();
        });
      }}
      className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs hover:bg-[var(--wash)] disabled:opacity-50"
    >
      {isActive ? "Ẩn" : "Bật"}
    </button>
  );
}
