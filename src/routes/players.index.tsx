import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PlayerCard } from "@/components/player-card";
import { Input } from "@/components/ui/input";
import { POSITIONS, POSITION_LABEL, POSITION_UNIT, type Player, type Position } from "@/data/types";
import { comparePlayers, searchPlayers } from "@/lib/catalog";
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
      .sort(comparePlayers);
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
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPosition("all")}
            className={cn(
              "col-span-2 min-h-14 rounded-[var(--radius-lg)] px-3 text-base",
              position === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
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
                "flex min-h-16 flex-col items-center justify-center rounded-[var(--radius-lg)] px-2",
                position === item ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-[var(--shadow-border)]",
              )}
            >
              <span className="font-display text-lg leading-none">{item}</span>
              <span className="mt-1 text-sm">{POSITION_LABEL[item]}</span>
            </button>
          ))}
        </div>
      )}
      {years.length > 0 ? (
        <select
          value={joined}
          onChange={(e) => setJoined(e.target.value)}
          aria-label="入団年"
          className="h-14 w-full rounded-[var(--radius-lg)] bg-card px-3 text-base text-foreground shadow-[var(--shadow-border)] outline-none"
        >
          <option value="all">すべての入団年</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}年入団
            </option>
          ))}
        </select>
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
