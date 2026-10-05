import { Link } from "@tanstack/react-router";
import { Bookmark, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/data/types";
import { formatDate, isYoutubeClip } from "@/lib/format";
import { trackReadOriginal } from "@/lib/analytics";
import { useClipStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ArticleCard({
  article,
  compact = false,
}: {
  article: Article;
  compact?: boolean;
}) {
  const bookmarked = useClipStore((s) => s.bookmarks.includes(article.id));
  const toggle = useClipStore((s) => s.toggleBookmark);
  const hasLink = /^https?:\/\//i.test(article.url);
  const youtube = isYoutubeClip(article.url, article.sourceLabel);

  return (
    <article
      className={cn(
        "group relative rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
        "pl-5 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-px before:bg-accent/70",
      )}
    >
      {article.playerNames.length > 0 ? (
        <p
          className={cn(
            "font-display font-medium leading-snug tracking-tight text-foreground",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          {article.playerNames.join(" / ")}
        </p>
      ) : null}

      <h3
        className={cn(
          "font-medium leading-snug text-foreground",
          article.playerNames.length > 0 ? "mt-2" : "",
          compact ? "text-sm" : "text-base",
        )}
      >
        <Link to="/articles/$id" params={{ id: article.id }} className="hover:text-accent">
          {article.title}
        </Link>
      </h3>

      {youtube ? (
        <p className="mt-2">
          <Badge>YouTube 音あり注意</Badge>
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        {hasLink ? (
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackReadOriginal(article.url, article.title)}
            className="inline-flex h-11 items-center gap-1.5 pr-2 text-sm text-accent hover:text-foreground"
          >
            原文を読む{youtube ? "（音あり注意）" : ""}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">リンクがまだありません</span>
        )}
        <div className="flex items-center gap-1">
          <time dateTime={article.date} className="text-[11px] tabular-nums text-muted-foreground">
            {formatDate(article.date)}
            {article.sourceLabel ? ` · ${article.sourceLabel}` : ""}
          </time>
          <button
            type="button"
            aria-label={bookmarked ? "保存を解除" : "記事を保存"}
            onClick={() => toggle(article.id)}
            className={cn(
              "flex size-11 items-center justify-center",
              bookmarked ? "text-accent" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
          </button>
        </div>
      </div>
    </article>
  );
}
