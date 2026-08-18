export type PodiumClub = {
  clubId: string;
  name: string;
  votes: number;
};

type Props = {
  entries: PodiumClub[];
  /** true when showing A–Z placeholders because nobody has votes yet */
  isPlaceholder: boolean;
  hideHeading?: boolean;
};

const RANK_META = {
  1: {
    order: "order-2",
    height: "h-44 sm:h-52",
    tone: "bg-[var(--accent)]",
    badge: "bg-[var(--hero-c)] text-[var(--hero-a)]",
    label: "Top 1",
  },
  2: {
    order: "order-1",
    height: "h-36 sm:h-40",
    tone: "bg-[var(--hero-b)]",
    badge: "bg-white/90 text-[var(--hero-a)]",
    label: "Top 2",
  },
  3: {
    order: "order-3",
    height: "h-28 sm:h-32",
    tone: "bg-[var(--hero-a)]",
    badge: "bg-white/80 text-[var(--hero-a)]",
    label: "Top 3",
  },
} as const;

function PodiumSlot({
  rank,
  club,
  isPlaceholder,
}: {
  rank: 1 | 2 | 3;
  club: PodiumClub | undefined;
  isPlaceholder: boolean;
}) {
  const meta = RANK_META[rank];
  if (!club) {
    return (
      <div className={`flex w-full max-w-[9.5rem] flex-col items-center sm:max-w-[11rem] ${meta.order}`}>
        <div
          className={`flex w-full ${meta.height} items-end justify-center rounded-t-xl bg-[var(--wash)] px-2 pb-4 text-sm text-[var(--muted)]`}
        >
          —
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full max-w-[9.5rem] flex-col items-center sm:max-w-[11rem] ${meta.order}`}
    >
      <div className="mb-3 flex flex-col items-center gap-1 px-1 text-center">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}
        >
          {meta.label}
        </span>
        <p className="font-[family-name:var(--font-display)] text-base leading-tight text-[var(--ink)] sm:text-lg">
          {club.name}
        </p>
        <p className="text-xs text-[var(--muted)] sm:text-sm">
          {isPlaceholder ? "Chưa có vote" : `${club.votes} vote`}
        </p>
      </div>
      <div
        className={`flex w-full ${meta.height} items-end justify-center rounded-t-xl ${meta.tone} px-2 pb-5 shadow-[0_12px_30px_-18px_rgba(11,61,56,0.55)]`}
      >
        <span className="font-[family-name:var(--font-display)] text-4xl text-white/95 sm:text-5xl">
          {rank}
        </span>
      </div>
    </div>
  );
}

export function BestClubPodium({ entries, isPlaceholder, hideHeading }: Props) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <section className="space-y-4">
      {hideHeading ? null : (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            BXH Best Club
          </h2>
          {isPlaceholder ? (
            <p className="text-sm text-[var(--muted)]">
              Chưa có vote — đang hiện 3 club theo A–Z
            </p>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 pb-0 pt-8 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-end justify-center gap-2 sm:gap-4">
          <PodiumSlot rank={2} club={second} isPlaceholder={isPlaceholder} />
          <PodiumSlot rank={1} club={first} isPlaceholder={isPlaceholder} />
          <PodiumSlot rank={3} club={third} isPlaceholder={isPlaceholder} />
        </div>
      </div>

      {!isPlaceholder && entries.length > 3 ? (
        <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {entries.slice(3).map((item, index) => (
            <li
              key={item.clubId}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span>
                <span className="mr-3 text-[var(--muted)]">#{index + 4}</span>
                {item.name}
              </span>
              <strong>{item.votes} vote</strong>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

/** Build top podium rows: vote ranking, or first 3 clubs A–Z when empty. */
export function buildBestClubPodium(
  leaderboard: PodiumClub[],
  clubsAlphabetical: { id: string; name: string }[],
): { entries: PodiumClub[]; isPlaceholder: boolean } {
  if (leaderboard.length > 0) {
    return { entries: leaderboard, isPlaceholder: false };
  }

  return {
    isPlaceholder: true,
    entries: clubsAlphabetical.slice(0, 3).map((club) => ({
      clubId: club.id,
      name: club.name,
      votes: 0,
    })),
  };
}
