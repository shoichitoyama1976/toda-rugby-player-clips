export function MatchScore({
  levins,
  opponent,
  levinsName,
  opponentName,
  levinsLogo,
  opponentLogo,
}: {
  levins?: number;
  opponent?: number;
  levinsName: string;
  opponentName: string;
  levinsLogo?: string;
  opponentLogo?: string;
}) {
  const scored = levins != null && opponent != null && Boolean(opponentName);
  if (!scored && !levinsLogo && !opponentLogo) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
      <TeamFace name={levinsName} logo={levinsLogo} />
      {scored ? (
        <>
          <span className="font-display text-3xl tabular-nums leading-none tracking-tight">{levins}</span>
          <span className="text-muted-foreground">–</span>
          <span className="font-display text-3xl tabular-nums leading-none tracking-tight">{opponent}</span>
        </>
      ) : (
        <span className="text-muted-foreground">–</span>
      )}
      <TeamFace name={opponentName} logo={opponentLogo} />
    </p>
  );
}

function TeamFace({ name, logo }: { name: string; logo?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {logo ? (
        <img src={logo} alt="" width={32} height={32} className="size-8 object-contain" />
      ) : null}
      <span className="text-sm text-muted-foreground">{name}</span>
    </span>
  );
}
