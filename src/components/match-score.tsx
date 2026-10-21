export function MatchScore({
  levins,
  opponent,
  levinsName,
  opponentName,
}: {
  levins?: number;
  opponent?: number;
  levinsName: string;
  opponentName: string;
}) {
  if (levins == null || opponent == null || !opponentName) return null;
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-sm text-muted-foreground">{levinsName}</span>
      <span className="font-display text-3xl tabular-nums leading-none tracking-tight">{levins}</span>
      <span className="text-muted-foreground">–</span>
      <span className="font-display text-3xl tabular-nums leading-none tracking-tight">{opponent}</span>
      <span className="text-sm text-muted-foreground">{opponentName}</span>
    </p>
  );
}