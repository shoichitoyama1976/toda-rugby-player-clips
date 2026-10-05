import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { PlayerCard } from "@/components/player-card";
import { Input } from "@/components/ui/input";
import { POSITIONS } from "@/data/types";
import { searchPlayers } from "@/lib/catalog";
import { websiteJsonLd } from "@/lib/seo";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/")({ component: Home });

const POSITION_ORDER = new Map(POSITIONS.map((item, index) => [item, index]));

function Home() {
  const { articles, players, usingSheet, configured, sheetError, countBySlug, origin } = useCatalog();
  const [query, setQuery] = useState("");
  const latest = articles.slice(0, 4);
  const coveredAll = [...players]
    .map((player) => ({ player, count: countBySlug.get(player.slug) ?? 0 }))
    .filter((row) => row.count > 0);
  const sources = new Set(articles.map((a) => a.sourceLabel)).size;
  const siteLd = websiteJsonLd(origin);

  const roster = useMemo(() => {
    const current = players.filter(
      (player) =>
        !player.unlisted &&
        !player.related &&
        player.status === "current" &&
        (!player.category || player.category === "選手"),
    );
    const list = query.trim() ? searchPlayers(players, query) : current;
    return [...list].sort((a, b) => {
      const byPos =
        (POSITION_ORDER.get(a.position) ?? 99) - (POSITION_ORDER.get(b.position) ?? 99);
      if (byPos !== 0 && !query.trim()) return byPos;
      return a.name.localeCompare(b.name, "ja");
    });
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
          試合の行き帰りに、今日出る選手の名前を入れて開いてください。掲載記事へ案内します。本文は転載しません。
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

      <section className="grid grid-cols-3 gap-3">
        <Stat label="選手" value={coveredAll.length} to="/players" />
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
        <p className="mt-3 text-xs tabular-nums text-muted-foreground">
          {query.trim() ? `${roster.length} 人` : "いまの名簿（ポジション順）"}
        </p>
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
