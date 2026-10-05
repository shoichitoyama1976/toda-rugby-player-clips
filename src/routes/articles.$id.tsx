import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, ExternalLink } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KIND_LABEL, POSITION_LABEL } from "@/data/types";
import { formatDate, isYoutubeClip } from "@/lib/format";
import { trackReadOriginal } from "@/lib/analytics";
import { catalogFromHeadMatches, SITE_NAME } from "@/lib/seo";
import { useClipStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/articles/$id")({
  component: ArticlePage,
  head: ({ params, matches }) => {
    const { articles } = catalogFromHeadMatches(matches);
    const article = articles.find((item) => item.id === params.id);
    const title = article ? `${article.title}｜${SITE_NAME}` : `記事が見つかりません｜${SITE_NAME}`;
    return {
      meta: [
        { title },
        { name: "robots", content: "noindex, follow" },
        { name: "description", content: "原文への案内です。記事本文は転載しません。" },
      ],
    };
  },
});

function ArticlePage() {
  const { id } = Route.useParams();
  const { articles, players } = useCatalog();
  const article = articles.find((item) => item.id === id);
  const toggle = useClipStore((s) => s.toggleBookmark);
  const bookmarked = useClipStore((s) => s.bookmarks.includes(id));

  if (!article) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl">記事が見つかりません</h1>
        <Link to="/articles" className="text-sm text-accent">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const tagged = players.filter(
    (player) =>
      article.playerSlugs.includes(player.slug) ||
      article.playerNames.includes(player.name),
  );
  const youtube = isYoutubeClip(article.url, article.sourceLabel);
  const related = articles
    .filter((item) => item.id !== article.id)
    .filter((item) => item.playerSlugs.some((slug) => article.playerSlugs.includes(slug)))
    .slice(0, 3);

  return (
    <article className="space-y-8">
      <header className="max-w-2xl space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <time dateTime={article.date} className="tabular-nums">
            {formatDate(article.date)}
          </time>
          <Badge>{article.sourceLabel}</Badge>
          {youtube ? <Badge>YouTube 音あり注意</Badge> : null}
          <Badge tone="accent">{KIND_LABEL[article.kind]}</Badge>
          {article.season ? <Badge>{article.season}</Badge> : null}
        </div>
        <h1 className="font-display text-3xl font-medium leading-snug tracking-tight">
          {article.title}
        </h1>
        {article.excerpt ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {/^https?:\/\//i.test(article.url) ? (
            <Button asChild>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackReadOriginal(article.url, article.title)}
              >
                原文を読む{youtube ? "（音あり注意）" : ""}
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">元記事のリンクは、まだシートに入っていません。</p>
          )}
          <Button variant="outline" onClick={() => toggle(article.id)}>
            <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
            {bookmarked ? "保存済み" : "保存する"}
          </Button>
        </div>
      </header>

      {tagged.length > 0 ? (
        <section>
          <h2 className="font-display text-xl tracking-tight">この記事に出ている人</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {tagged.map((player) => (
              <li key={player.slug}>
                <Link
                  to="/players/$slug"
                  params={{ slug: player.slug }}
                  className="flex h-14 items-center justify-between rounded-[var(--radius-md)] bg-card px-4 shadow-[var(--shadow-border)]"
                >
                  <span>
                    <span className="block text-sm">{player.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {player.role ??
                        (player.category && player.category !== "選手"
                          ? player.category
                          : POSITION_LABEL[player.position])}
                    </span>
                  </span>
                  <span className="text-[11px] text-accent">詳しく見る</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section>
          <h2 className="font-display text-xl tracking-tight">同じ選手の記事</h2>
          <div className="mt-3 grid gap-3">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} compact />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
