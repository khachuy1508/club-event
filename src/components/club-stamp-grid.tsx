import { PassportOpinionCard } from "@/components/passport-opinion-card";
import { PassportVoteCard } from "@/components/passport-vote-card";

type ClubStamp = {
  id: string;
  nameEn: string;
  code: string | null;
  hasLogo: boolean;
  checkedIn: boolean;
};

type VoteClub = { id: string; name: string };

type Props = {
  clubs: ClubStamp[];
  checkedInClubs: VoteClub[];
  votedClubName: string | null;
  existingOpinion: string | null;
};

export function ClubPassportBoard({
  clubs,
  checkedInClubs,
  votedClubName,
  existingOpinion,
}: Props) {
  return (
    <section className="min-w-0 rounded-[1.2rem] border border-white/70 bg-white/85 p-2.5 backdrop-blur-md sm:rounded-[1.6rem] sm:p-6">
      <div className="rounded-xl border border-violet-200 bg-white/60 p-2 sm:rounded-2xl sm:p-4">
        <h2 className="mb-2 px-1 text-center text-[10px] font-semibold leading-snug tracking-wide text-violet-800 sm:mb-5 sm:text-sm sm:tracking-[0.18em]">
          ✦ {clubs.length} CLUBS – EXPLORE & COLLECT STAMPS ✦
        </h2>
        <ol className="grid grid-cols-4 gap-1 min-[400px]:grid-cols-5 sm:grid-cols-5 sm:gap-3">
          {clubs.map((club, index) => (
            <li
              key={club.id}
              className="relative flex min-h-[4.6rem] min-w-0 flex-col items-center justify-between px-0.5 pb-0.5 pt-3 text-center sm:min-h-[6.5rem] sm:pt-4"
            >
              <span className="absolute left-0.5 top-0 text-[8px] font-medium text-slate-400 sm:text-[10px]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <StampMark club={club} />
              <p className="mt-0.5 line-clamp-2 w-full break-words text-[7px] font-medium leading-tight text-violet-800 sm:text-[11px]">
                {club.nameEn}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-2 grid grid-cols-2 items-stretch gap-2 sm:mt-4 sm:gap-4">
        <PassportVoteCard
          checkedInClubs={checkedInClubs}
          votedClubName={votedClubName}
          embedded
        />
        <PassportOpinionCard existingBody={existingOpinion} embedded />
      </div>
    </section>
  );
}

function StampMark({ club }: { club: ClubStamp }) {
  const visual = club.checkedIn ? "" : "grayscale opacity-55";
  if (club.hasLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/clubs/${club.id}/logo`}
        alt=""
        className={`h-7 w-7 object-contain sm:h-12 sm:w-12 ${visual}`}
      />
    );
  }
  return (
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full text-[8px] font-bold sm:h-12 sm:w-12 sm:text-xs ${
        club.checkedIn ? "bg-violet-500 text-white" : "bg-violet-100 text-violet-400 grayscale"
      }`}
    >
      {(club.code ?? club.nameEn).slice(0, 3).toUpperCase()}
    </div>
  );
}
