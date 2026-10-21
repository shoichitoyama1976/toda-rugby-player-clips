export function MatchScore({ levins, opponent }: { levins?: number; opponent?: number }) {
  if (levins == null || opponent == null) return null;
  const mark = levins > opponent ? "勝ち" : levins < opponent ? "負け" : "引き分け";
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="font-display text-3xl tabular-nums leading-none tracking-tight">{levins}</span>
      <span className="text-sm text-muted-foreground">レビンズ</span>
      <span className="text-muted-foreground">–</span>
      <span className="font-display text-3xl tabular-nums leading-none tracking-tight">{opponent}</span>
      <span className="text-sm text-muted-foreground">相手</span>
      <span className="text-sm text-accent">{mark}</span>
    </p>
  );
}
