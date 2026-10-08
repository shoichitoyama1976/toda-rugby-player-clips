import { createFileRoute, Link } from "@tanstack/react-router";
import { lineupsNewestFirst, type Lineup } from "@/data/lineups";
import { formatDate } from "@/lib/format";
import { SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/matches/")({
  component: MatchesPage,
  head: () => ({
    meta: [
      { title: `試合メンバー｜${SITE_NAME}` },
      {
        name: "description",
        content: "公式アカウントの出場メンバーから、選手の掲載記事へ進む一覧です。",
      },
    ],
  }),
});

function MatchesPage() {
  const lineups = lineupsNewestFirst();

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl tracking-tight">試合メンバー</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          公式アカウントの投稿にあった出場メンバーです。名前をタップすると、その選手の記事へ進みます。
        </p>
      </header>
      <div className="grid gap-3">
        {lineups.map((lineup) => (
          <MatchCard key={lineup.id} lineup={lineup} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ lineup }: { lineup: Lineup }) {
  return (
    <Link
      to="/matches/$id"
      params={{ id: lineup.id }}
      className="block rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <p className="text-[11px] tracking-wide text-accent">{lineup.label}</p>
      <p className="mt-2 font-display text-2xl leading-tight">vs {lineup.opponent}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatDate(lineup.date)}（{weekday(lineup.date)}）{lineup.kickoff} K.O.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{lineup.venue}</p>
    </Link>
  );
}

function weekday(iso: string): string {
  const date = new Date(`${iso}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}
