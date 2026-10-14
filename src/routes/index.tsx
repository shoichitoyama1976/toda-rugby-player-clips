import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { PlayerCard } from "@/components/player-card";
import { Input } from "@/components/ui/input";
import { comparePlayers, searchPlayers } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { websiteJsonLd } from "@/lib/seo";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "戸田ラグビー選手記事帖｜ヤクルトレビンズ戸田の選手記事" },
      {
        name: "description",
        content:
          "ヤクルトレビンズ戸田の選手が出てきたオンライン記事を、選手や媒体ごとにたどる非公式の一覧です。本文は転載しません。",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { articles, players, usingSheet, configured, sheetError, countBySlug, origin, lineups } =
    useCatalog();
  const [query, setQuery] = useState("");
  const latest = articles.slice(0, 4);
  const sources = new Set(articles.map((a) => a.sourceLabel)).size;
  const siteLd = websiteJsonLd(origin);
  const nextMatch = lineups[0];

  const roster = useMemo(() => {
    return [...searchPlayers(players, query)].sort(comparePlayers);
  }, [players, query]);

  return (
    <div className="space-y-10">
      {siteLd ? <JsonLd data={siteLd} /> : null}
      <section className="max-w-2xl">
        <p className="text-[11px] tracking-[0.22em] text-accent">非公式の選手記事一覧</p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-[1.15] tracking-tight sm:text-5xl">
          選手から、記事をたどる
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          レビンズの試合の行き帰りに、今日出る選手の名前を入れて開いてください。掲載記事へ案内します。本文は転載していません。
          {nextMatch ? (
            <>
              直近の試合の出場選手から探したい場合は、すぐ下の
              <Link
                to="/matches/$id"
                params={{ id: nextMatch.id }}
                className="mx-1 text-accent hover:text-foreground"
              >
                【出場メンバーを見る】
              </Link>
              からもたどれます。
            </>
          ) : null}
          <Link to="/about" hash="purpose" className="ml-1 text-accent hover:text-foreground">
            なぜ集めているか
          </Link>
        </p>
        {!configured ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-muted px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            公開用のシートはまだつながっていません。いまは見本の記事です。つなぎ方は
            <Link to="/source" className="mx-1 text-accent hover:text-foreground">
              使い方
            </Link>
            を見て、シートのURLをこの会話に貼ってください。
          </p>
        ) : usingSheet ? (
          <p className="mt-4 text-xs text-accent">いま {articles.length} 件の記事を載せています。</p>
        ) : (
          <p className="mt-4 rounded-[var(--radius-md)] bg-muted px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            シートに接続できませんでした。{sheetError} いまは見本の記事です。
          </p>
        )}
      </section>

      {nextMatch ? (
        <Link
          to="/matches/$id"
          params={{ id: nextMatch.id }}
          className="block rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
        >
          <p className="text-[11px] tracking-[0.18em] text-accent">試合メンバーから記事へ</p>
          <p className="mt-2 font-display text-2xl leading-tight">vs {nextMatch.opponent}</p>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>
              {formatDate(nextMatch.date)}
              {nextMatch.weekday ? `（${nextMatch.weekday}）` : ""}
            </p>
            <p>{nextMatch.kickoff} K.O.</p>
            <p>{nextMatch.venue}</p>
          </div>
          <p className="mt-3 inline-flex items-center gap-1 text-sm text-foreground">
            出場メンバーを見る
            <ArrowRight className="size-3.5" />
          </p>
        </Link>
      ) : null}

      <section className="grid grid-cols-3 gap-3">
        <Stat label="選手" value={players.length} to="/players" />
        <Stat label="記事" value={articles.length} to="/articles" />
        <Stat label="媒体" value={sources} to="/sources" />
      </section>

      <section>
        <SectionHead title="選手を探す" to="/players" />
        <div className="mt-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="氏名・かな・出身で検索"
            aria-label="選手を検索"
          />
        </div>
        <p className="mt-3 text-xs tabular-nums text-muted-foreground">{roster.length} 人</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {roster.map((player) => (
            <PlayerCard key={player.slug} player={player} count={countBySlug.get(player.slug) ?? 0} />
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="新しい記事" to="/articles" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {latest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  to,
}: {
  label: string;
  value: number;
  to: "/articles" | "/players" | "/sources";
}) {
  return (
    <Link
      to={to}
      className="rounded-[var(--radius-lg)] bg-card px-3 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums leading-none">{value}</p>
    </Link>
  );
}

function SectionHead({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
      <Link
        to={to}
        className="inline-flex h-11 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        もっと見る
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
