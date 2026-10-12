import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { MediaMark, dominantMediaKind } from "@/components/media-mark";
import { Input } from "@/components/ui/input";
import { KIND_LABEL, type Article, type ArticleKind } from "@/data/types";
import { searchArticles } from "@/lib/catalog";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

type Search = { media?: string };

const MEDIA_GROUPS = [
  { id: "official-hp", label: "公式HP" },
  { id: "official-note", label: "公式note" },
  { id: "league-one", label: "リーグワン" },
  { id: "other", label: "その他" },
] as const;

type MediaGroup = (typeof MEDIA_GROUPS)[number]["id"];

function mediaGroup(article: Article): MediaGroup {
  const label = article.sourceLabel.trim();
  const url = article.url;
  if (label.includes("ヤクルトレビンズ戸田公式") || /note\.com\/yakultlevins/i.test(url)) return "official-note";
  if (label.includes("リーグワン") || /league-one\.jp/i.test(url)) return "league-one";
  if (
    label === "ヤクルトレビンズ戸田" ||
    label === "公式HP" ||
    /(?:^|\.)yakult\.co\.jp/i.test(url) ||
    article.source === "official"
  ) {
    return "official-hp";
  }
  return "other";
}

export const Route = createFileRoute("/articles/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    media: typeof search.media === "string" && search.media.trim() ? search.media : undefined,
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const { media } = Route.useSearch();
  const { articles } = useCatalog();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MediaGroup | "all">("all");
  const [kind, setKind] = useState<ArticleKind | "all">("all");

  const mediaKind = useMemo(() => {
    if (!media) return null;
    return dominantMediaKind(articles.filter((article) => article.sourceLabel.trim() === media).map((article) => article.url));
  }, [articles, media]);

  const kinds = useMemo(() => [...new Set(articles.map((a) => a.kind))], [articles]);

  const filtered = useMemo(() => {
    return searchArticles(articles, query).filter((article) => {
      if (media && article.sourceLabel !== media) return false;
      if (group !== "all" && mediaGroup(article) !== group) return false;
      if (kind !== "all" && article.kind !== kind) return false;
      return true;
    });
  }, [articles, query, group, kind, media]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl tracking-tight">
          {mediaKind ? <MediaMark kind={mediaKind} /> : null}
          {media ? media : "記事"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {media ? (
            <>
              この媒体の記事です。
              <Link to="/articles" search={{}} className="ml-2 text-accent hover:text-foreground">
                すべての記事
              </Link>
            </>
          ) : (
            "媒体や種類で絞れます。選手名でも探せます。"
          )}
        </p>
      </header>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="選手名・タイトル・媒体で検索"
        aria-label="記事を検索"
      />
      {media ? null : (
        <>
          <FilterRow
            value={group}
            onChange={setGroup}
            options={MEDIA_GROUPS.map((item) => ({ value: item.id, label: item.label }))}
          />
          <FilterRow
            value={kind}
            onChange={setKind}
            options={kinds.map((key) => ({ value: key, label: KIND_LABEL[key] }))}
          />
        </>
      )}
      <p className="text-xs tabular-nums text-muted-foreground">{filtered.length} 件</p>
      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius-md)] bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          該当する記事がありません。
        </p>
      ) : media || group !== "all" ? (
        <div className="grid gap-3">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {MEDIA_GROUPS.map((item) => {
            const rows = filtered.filter((article) => mediaGroup(article) === item.id);
            if (rows.length === 0) return null;
            return (
              <section key={item.id}>
                <h2 className="font-display text-xl tracking-tight">
                  {item.label}
                  <span className="ml-2 text-sm tabular-nums text-muted-foreground">{rows.length} 件</span>
                </h2>
                <div className="mt-3 grid gap-3">
                  {rows.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterRow<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | "all";
  onChange: (next: T | "all") => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Chip active={value === "all"} onClick={() => onChange("all")}>
        すべて
      </Chip>
      {options.map((option) => (
        <Chip
          key={option.value}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-3 text-xs",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
