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
          <select
            name="clubId"
            required
            defaultValue=""
            className="w-full max-w-full min-w-0 rounded-md border border-violet-100 bg-white px-1.5 py-1.5 text-[9px] text-slate-800 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
          >
            <option value="" disabled>
              Choose a club
            </option>
            {checkedInClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
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
