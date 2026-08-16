"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { submitOpinionAction } from "@/lib/actions";

type Props = {
  existingBody: string | null;
  embedded?: boolean;
};

export function PassportOpinionCard({ existingBody, embedded = false }: Props) {
  const [count, setCount] = useState(0);
  const shell = embedded
    ? "min-w-0 rounded-xl border border-violet-200 bg-white/60 p-2 sm:rounded-2xl sm:p-4"
    : "min-w-0 rounded-2xl border border-white/80 bg-white/85 p-3 shadow-xl backdrop-blur-md sm:rounded-3xl sm:p-5";

  return (
    <section className={shell}>
      <h2 className="text-center text-[9px] font-semibold tracking-wide text-violet-800 sm:text-sm sm:tracking-[0.18em]">
        ✦ SHARE YOUR OPINION ✦
      </h2>
      <p className="mt-0.5 text-center text-[8px] leading-snug text-slate-500 sm:mt-1 sm:text-sm">
        Help us make Club Day even better!
      </p>

      {existingBody ? (
        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-violet-50 px-1.5 py-1.5 text-[9px] text-slate-800 sm:mt-4 sm:text-sm">
          {existingBody}
        </p>
      ) : (
        <ActionForm action={submitOpinionAction} className="mt-2 space-y-2 sm:mt-4 sm:space-y-3">
          <div className="relative">
            <textarea
              name="body"
              required
              maxLength={300}
              rows={3}
              placeholder="Write your opinion here..."
              className="w-full min-w-0 resize-none rounded-md border border-violet-100 bg-white px-1.5 py-1.5 pb-4 text-[9px] text-slate-800 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
              onChange={(event) => setCount(event.target.value.length)}
            />
            <span className="absolute bottom-1 right-1.5 text-[8px] text-slate-400 sm:bottom-2 sm:right-3 sm:text-[11px]">
              {count}/300
            </span>
          </div>
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
