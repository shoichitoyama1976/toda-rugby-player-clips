import { createFileRoute, Link } from "@tanstack/react-router";
import { lineupById, type LineupSlot, type LineupUnit } from "@/data/lineups";
import { matchPlayerSlug } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { SITE_NAME } from "@/lib/seo";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches/$id")({
  component: MatchPage,
  head: ({ params }) => {
    const lineup = lineupById(params.id);
    const title = lineup
      ? `${formatDate(lineup.date)} vs ${lineup.opponent}｜${SITE_NAME}`
      : `試合が見つかりません｜${SITE_NAME}`;
    return { meta: [{ title }] };
  },
});

const UNITS: Array<{ id: LineupUnit; label: string }> = [
  { id: "FW", label: "FW" },
  { id: "BK", label: "BK" },
  { id: "R", label: "リザーブ" },
];

function MatchPage() {
  const { id } = Route.useParams();
  const lineup = lineupById(id);
  const { players, countBySlug } = useCatalog();

  if (!lineup) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">この試合は見当たりません</h1>
        <Link to="/matches" className="text-sm text-accent">
          試合メンバーへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-[11px] tracking-[0.18em] text-accent">{lineup.label}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          vs {lineup.opponent}
        </h1>
        <p className="mt-3 text-sm text-foreground">
          {formatDate(lineup.date)}（{weekday(lineup.date)}）{lineup.kickoff} K.O.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{lineup.venue}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          名前をタップすると、その選手の記事一覧へ進みます。公式の画像投稿を読み取った一覧で、出場は変わることがあります。
        </p>
        <a
          href={lineup.postUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex h-11 items-center text-sm text-accent hover:text-foreground"
        >
          公式の投稿を見る
        </a>
      </header>

      {UNITS.map((unit) => {
        const slots = lineup.slots.filter((slot) => slot.unit === unit.id);
        if (slots.length === 0) return null;
        return (
          <section key={unit.id}>
            <h2 className="font-display text-xl tracking-tight">{unit.label}</h2>
            <div className="mt-3 grid gap-2">
              {slots.map((slot) => (
                <SlotRow
                  key={`${slot.unit}-${slot.number}-${slot.name}`}
                  slot={slot}
                  players={players}
                  countBySlug={countBySlug}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SlotRow({
  slot,
  players,
  countBySlug,
}: {
  slot: LineupSlot;
  players: ReturnType<typeof useCatalog>["players"];
  countBySlug: Map<string, number>;
}) {
  const slug = matchPlayerSlug(slot.name, players);
  const player = slug ? players.find((item) => item.slug === slug) : undefined;
  const count = player ? (countBySlug.get(player.slug) ?? 0) : 0;
  const reading = nameAside(slot.name, player?.name, player?.nameKana);
  const className = cn(
    "flex min-h-14 items-center gap-3 rounded-[var(--radius-lg)] bg-card px-3 py-2 shadow-[var(--shadow-border)]",
    player && "transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
  );
  const body = (
    <>
      <span className="w-8 shrink-0 text-center font-display text-lg tabular-nums text-accent">
        {slot.number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-snug">
          {slot.name}
          {reading ? <span className="text-muted-foreground"> （{reading}）</span> : null}
        </span>
        {slot.shirt ? (
          <span className="text-[11px] text-muted-foreground">着番号 {slot.shirt}</span>
        ) : (
          <span className="text-[11px] text-muted-foreground">着番号</span>
        )}
      </span>
      <span className="shrink-0 text-right">
        {player ? (
          <>
            <span className="font-display text-lg tabular-nums leading-none">{count}</span>
            <span className="mt-1 block text-[10px] text-muted-foreground">件</span>
          </>
        ) : (
          <span className="text-[11px] text-muted-foreground">名簿にない</span>
        )}
      </span>
    </>
  );

  if (!player) return <div className={className}>{body}</div>;
  return (
    <Link to="/players/$slug" params={{ slug: player.slug }} className={className}>
      {body}
    </Link>
  );
}

function nameAside(shown: string, rosterName?: string, kana?: string): string | null {
  if (/[\u3400-\u9fff]/.test(shown)) return kana?.trim() || null;
  const alphabet = rosterName?.trim();
  if (!alphabet || !/[A-Za-z]/.test(alphabet)) return null;
  if (!/[\u30a0-\u30ff]/.test(shown)) return null;
  return alphabet;
}

function weekday(iso: string): string {
  const date = new Date(`${iso}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}
