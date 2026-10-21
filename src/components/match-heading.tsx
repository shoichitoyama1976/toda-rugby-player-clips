import type { Lineup } from "@/data/lineups";
import { MatchScore } from "@/components/match-score";
import { formatDate } from "@/lib/format";
import { teamLabel, teamLogo, type SheetTeam } from "@/lib/catalog";

export function MatchHeading({
  lineup,
  teams,
  titleAs = "p",
}: {
  lineup: Lineup;
  teams: readonly SheetTeam[];
  titleAs?: "h1" | "p";
}) {
  const Title = titleAs;
  const day = lineup.weekday || weekday(lineup.date);
  return (
    <>
      <p className="text-[11px] tracking-[0.18em] text-accent">{lineup.label}</p>
      <Title className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
        ヤクルトレビンズ戸田 vs {lineup.opponent}
      </Title>
      <MatchScore
        levins={lineup.levinsScore}
        opponent={lineup.opponentScore}
        levinsName={teamLabel(teams, "ヤクルトレビンズ戸田")}
        opponentName={teamLabel(teams, lineup.opponent)}
        levinsLogo={teamLogo(teams, "ヤクルトレビンズ戸田")}
        opponentLogo={teamLogo(teams, lineup.opponent)}
      />
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p>
          {formatDate(lineup.date)}（{day}）
        </p>
        <p>{lineup.kickoff} K.O.</p>
        <p>
          {lineup.venue}
          {lineup.side ? `（${lineup.side}）` : ""}
        </p>
      </div>
    </>
  );
}

function weekday(iso: string): string {
  const date = new Date(`${iso}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}
