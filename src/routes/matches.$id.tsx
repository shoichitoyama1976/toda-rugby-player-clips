import { createFileRoute, Link } from "@tanstack/react-router";
import type { LineupSlot, LineupUnit } from "@/data/lineups";
import { matchPlayerSlug } from "@/lib/catalog";
import { MatchHeading, ReportLink } from "@/components/match-heading";
import { formatMonthDay } from "@/lib/format";
import { catalogFromHeadMatches, SITE_NAME } from "@/lib/seo";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches/$id")({
  component: MatchPage,
  head: ({ params, matches }) => {
    const { lineups } = catalogFromHeadMatches(matches);
    const lineup = lineups.find((item) => item.id === params.id);
    const title = lineup
      ? `${formatMonthDay(lineup.date)} ヤクルトレビンズ戸田 vs ${lineup.opponent}`
      : `試合が見つかりません｜${SITE_NAME}`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: lineup
            ? `ヤクルトレビンズ戸田の出場メンバーです。名前をタップすると、掲載記事へ進みます。`
            : "試合が見つかりません。",
        },
      ],
    };
  },
});

const UNITS: Array<{ id: LineupUnit; label: string; note?: string }> = [
  { id: "FW", label: "FW" },
  { id: "BK", label: "BK" },
  { id: "R", label: "リザーブ" },
  { id: "P", label: "変更前", note: "最初に発表されていた人です。" },
];

function MatchPage() {
  const { id } = Route.useParams();
  const { players, countBySlug, lineups, teams } = useCatalog();
  const lineup = lineups.find((item) => item.id === id);

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

  const sourceUrl = lineup.postUrl;

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <MatchHeading lineup={lineup} teams={teams} titleAs="h1" />
        {lineup.reportUrl ? (
          <p className="mt-3">
            <ReportLink href={lineup.reportUrl} />
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          名前をタップすると、その選手の記事一覧へ進みます。下の参照元が、このメンバーの元の投稿です。
        </p>
        <p className="mt-4 text-[11px] tracking-[0.18em] text-muted-foreground">参照元</p>
        <div className="mt-1 flex flex-col items-start">
          <XLink href={sourceUrl} label="レビンズの公式Xの投稿を開く" />
          {lineup.opponentUrl ? (
            <XLink href={lineup.opponentUrl} label={`${lineup.opponent}の公式Xの投稿を開く`} />
          ) : null}
        </div>
      </header>

      {UNITS.map((unit) => {
        const slots = lineup.slots.filter((slot) => slot.unit === unit.id);
        if (slots.length === 0) return null;
        return (
          <section key={unit.id}>
            <h2 className="font-display text-xl tracking-tight">{unit.label}</h2>
            {unit.note ? <p className="mt-1 text-sm text-muted-foreground">{unit.note}</p> : null}
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

function XLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:text-foreground"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
        <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
      </svg>
      {label}
    </a>
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
  const player =
    (slot.playerId ? players.find((item) => item.sheetId === slot.playerId) : undefined) ??
    (slug ? players.find((item) => item.slug === slug) : undefined);
  const count = player ? (countBySlug.get(player.slug) ?? 0) : 0;
  const label = player?.name || slot.name;
  const reading = player?.nameKana?.trim();
  const aside = reading && reading !== label ? reading : "";
  const position = slot.position?.trim() || player?.position || "";
  const className = cn(
    "flex min-h-14 items-center gap-3 rounded-[var(--radius-lg)] bg-card px-3 py-2 shadow-[var(--shadow-border)]",
    player && "transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
  );
  const body = (
    <>
      <span className="w-8 shrink-0 text-center font-display text-lg tabular-nums text-accent">
        {slot.number}
      </span>
      <span className="w-10 shrink-0 text-center text-xs tracking-wide text-muted-foreground">
        {position}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-snug">
          {label}
          {slot.captain ? <span className="text-accent">（C）</span> : null}
          {aside ? <span className="text-muted-foreground"> （{aside}）</span> : null}
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
