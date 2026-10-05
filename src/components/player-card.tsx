import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { POSITION_LABEL, type Player } from "@/data/types";

export function PlayerCard({
  player,
  count,
}: {
  player: Player;
  count: number;
}) {
  return (
    <Link
      to="/players/$slug"
      params={{ slug: player.slug }}
      className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-muted font-display text-sm text-accent">
        {player.unlisted
          ? "—"
          : player.category === "ホームタウン" || player.category === "ホストシティ"
            ? "ホ"
            : player.category === "スタッフ" || player.related
              ? "ス"
              : player.position}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium leading-tight">{player.name}</p>
          {player.category && player.category !== "選手" ? <Badge>{player.category}</Badge> : null}
          {player.captain ? <Badge tone="accent">主将</Badge> : null}
          {player.unlisted ? <Badge>名簿外</Badge> : null}
          {!player.unlisted && !player.related && player.status === "former" ? <Badge>過去所属</Badge> : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {player.unlisted
            ? "シート上の氏名"
            : player.role
              ? player.role
              : player.related
                ? "スタッフ"
                : POSITION_LABEL[player.position]}
          {player.nameKana ? ` · ${player.nameKana}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-lg tabular-nums leading-none">{count}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">件</p>
      </div>
    </Link>
  );
}
