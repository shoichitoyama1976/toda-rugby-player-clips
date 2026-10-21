import { createFileRoute, Link } from "@tanstack/react-router";
import type { Lineup } from "@/data/lineups";
import { MatchHeading } from "@/components/match-heading";
import type { SheetTeam } from "@/lib/catalog";
import { SITE_NAME } from "@/lib/seo";
import { useCatalog } from "@/lib/use-catalog";

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
  const { lineups, teams } = useCatalog();

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
          <MatchCard key={lineup.id} lineup={lineup} teams={teams} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ lineup, teams }: { lineup: Lineup; teams: readonly SheetTeam[] }) {
  return (
    <Link
      to="/matches/$id"
      params={{ id: lineup.id }}
      className="block rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <MatchHeading lineup={lineup} teams={teams} />
    </Link>
  );
}
