import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PlayerCard } from "@/components/player-card";
import { Input } from "@/components/ui/input";
import { POSITIONS, POSITION_LABEL, POSITION_UNIT, type Player, type Position } from "@/data/types";
import { searchPlayers } from "@/lib/catalog";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/players/")({ component: PlayersPage });

function isRosterPlayer(player: Player): boolean {
  return !player.unlisted && !player.related && (player.category ?? "選手") === "選手";
}

function isStaffOrRelated(player: Player): boolean {
  if (player.unlisted) return false;
  if (player.category && player.category !== "選手") return true;
  return Boolean(player.related);
}

const POSITION_ORDER = new Map(POSITIONS.map((item, index) => [item, index]));

function groupRank(player: Player): number {
  if (isStaffOrRelated(player)) return 2;
  if (!isRosterPlayer(player)) return 3;
  return POSITION_UNIT[player.position] === "BK" ? 1 : 0;
}

function statusRank(player: Player): number {
  return player.status === "former" ? 1 : 0;
}

function positionRank(player: Player): number {
  if (!isRosterPlayer(player)) return POSITION_ORDER.size;
  return POSITION_ORDER.get(player.position) ?? POSITION_ORDER.size;
}

function PlayersPage() {
  const { players, countBySlug } = useCatalog();
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<"all" | "FW" | "BK" | "other">("all");
  const [position, setPosition] = useState<Position | "all">("all");
  const [joined, setJoined] = useState<"all" | string>("all");

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const player of players) {
      if (player.joined) set.add(player.joined);
    }
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [players]);

  const filtered = useMemo(() => {
    return searchPlayers(players, query)
      .filter((player) => {
        if (unit === "all") return true;
        if (unit === "other") return isStaffOrRelated(player);
        return isRosterPlayer(player) && POSITION_UNIT[player.position] === unit;
      })
      .filter((player) =>
        position === "all" ? true : !player.related && !player.unlisted && player.position === position,
      )
      .filter((player) => (joined === "all" ? true : player.joined === joined))
      .sort((a, b) => {
        const byStatus = statusRank(a) - statusRank(b);
        if (byStatus !== 0) return byStatus;
        const byGroup = groupRank(a) - groupRank(b);
        if (byGroup !== 0) return byGroup;
        const byPosition = positionRank(a) - positionRank(b);
        if (byPosition !== 0) return byPosition;
        return a.name.localeCompare(b.name, "ja");
      });
  }, [players, query, unit, position, joined]);

  const positions =
    unit === "FW" || unit === "BK" ? POSITIONS.filter((p) => POSITION_UNIT[p] === unit) : POSITIONS;
  const unitChips = [
    { id: "all", label: "全員" },
    { id: "FW", label: "FW" },
    { id: "BK", label: "BK" },
    { id: "other", label: "スタッフ・関係者" },
  ] as const;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight">選手</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          氏名を入れて、その人の記事へ。記事がない選手も名簿に残しています。スタッフやホームタウンの人も、同じ一覧に出ます。
        </p>
      </header>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="氏名・出身・スクールで検索"
        aria-label="選手を検索"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {unitChips.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setUnit(item.id);
              setPosition("all");
            }}
            className={cn(
              "h-11 shrink-0 rounded-full px-3 text-xs",
              unit === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {unit === "other" ? null : (
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setPosition("all")}
          className={cn(
            "h-11 shrink-0 rounded-full px-3 text-xs",
            position === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          すべてのポジション
        </button>
        {positions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPosition(item)}
            className={cn(
              "h-11 shrink-0 rounded-full px-3 text-xs",
              position === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {item} {POSITION_LABEL[item]}
          </button>
        ))}
      </div>
      )}
      {years.length > 0 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            onClick={() => setJoined("all")}
            className={cn(
              "h-11 shrink-0 rounded-full px-3 text-xs",
              joined === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            すべての入団年
          </button>
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setJoined(year)}
              className={cn(
                "h-11 shrink-0 rounded-full px-3 text-xs",
                joined === year ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {year}年入団
            </button>
          ))}
        </div>
      ) : null}
      <p className="text-xs tabular-nums text-muted-foreground">{filtered.length} 人</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((player) => (
          <PlayerCard
            key={player.slug}
            player={player}
            count={countBySlug.get(player.slug) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
