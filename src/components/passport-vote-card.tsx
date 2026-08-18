"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionForm } from "@/components/action-form";
import { voteAction } from "@/lib/actions";
import { MIN_CHECKINS_TO_VOTE } from "@/lib/validators";

type ClubOption = { id: string; name: string };

type Props = {
  checkedInClubs: ClubOption[];
  votedClubName: string | null;
  embedded?: boolean;
};

export function PassportVoteCard({
  checkedInClubs,
  votedClubName,
  embedded = false,
}: Props) {
  const unlocked = checkedInClubs.length >= MIN_CHECKINS_TO_VOTE;
  const shell = embedded
    ? "min-w-0 rounded-xl border border-violet-200 bg-white/60 p-2 sm:rounded-2xl sm:p-4"
    : "min-w-0 rounded-2xl border border-white/80 bg-white/85 p-3 shadow-xl backdrop-blur-md sm:rounded-3xl sm:p-5";

  return (
    <section className={shell}>
      <h2 className="text-center text-[9px] font-semibold tracking-wide text-violet-800 sm:text-sm sm:tracking-[0.18em]">
        ✦ VOTE BEST CLUB ✦
      </h2>
      <p className="mt-0.5 text-center text-[8px] leading-snug text-slate-500 sm:mt-1 sm:text-sm">
        Pick the club you love the most!
      </p>

      {votedClubName ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-1.5 py-1.5 text-center text-[9px] text-emerald-800 sm:mt-4 sm:text-sm">
          Bạn đã vote cho <strong>{votedClubName}</strong>
        </p>
      ) : !unlocked ? (
        <p className="mt-2 text-center text-[8px] text-slate-500 sm:mt-4 sm:text-sm">
          Cần {MIN_CHECKINS_TO_VOTE} check-in (hiện {checkedInClubs.length}).
        </p>
      ) : (
        <ActionForm action={voteAction} className="mt-2 space-y-2 sm:mt-4 sm:space-y-3">
          <ClubSelect clubs={checkedInClubs} />
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-violet-500 to-sky-500 px-2 py-1.5 text-[9px] font-semibold text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            SUBMIT
          </button>
        </ActionForm>
      )}
    </section>
  );
}

function ClubSelect({ clubs }: { clubs: ClubOption[] }) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = clubs.find((club) => club.id === value);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxHeight = 192;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < 96 && rect.top > spaceBelow;
      setPos({
        top: openUp
          ? Math.max(8, rect.top - maxHeight - 4)
          : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    place();
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  return (
    <div className="relative min-w-0">
      <input type="hidden" name="clubId" value={value} />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full min-w-0 items-center justify-between gap-1 rounded-md border border-violet-100 bg-white px-1.5 py-1.5 text-left text-[9px] text-slate-800 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
      >
        <span className={`min-w-0 truncate ${selected ? "text-slate-800" : "text-slate-400"}`}>
          {selected?.name ?? "Choose a club"}
        </span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          ▾
        </span>
      </button>
      {open
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              className="fixed z-200 max-h-48 overflow-y-auto rounded-md border border-violet-100 bg-white py-0.5 shadow-lg sm:rounded-xl"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              {clubs.map((club) => {
                const active = club.id === value;
                return (
                  <li key={club.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        setValue(club.id);
                        setOpen(false);
                      }}
                      className={`w-full truncate px-1.5 py-1.5 text-left text-[9px] sm:px-3 sm:py-2 sm:text-sm ${
                        active
                          ? "bg-violet-100 font-medium text-violet-900"
                          : "text-slate-800 hover:bg-violet-50"
                      }`}
                    >
                      {club.name}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
