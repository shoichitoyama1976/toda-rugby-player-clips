import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { Input } from "@/components/ui/input";
import { KIND_LABEL, SOURCE_LABEL, type ArticleKind, type SourceKey } from "@/data/types";
import { searchArticles } from "@/lib/catalog";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

type Search = { media?: string };

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
  const [source, setSource] = useState<SourceKey | "all">("all");
  const [kind, setKind] = useState<ArticleKind | "all">("all");

  const sources = useMemo(() => {
    const keys = [...new Set(articles.map((a) => a.source))];
    return keys;
  }, [articles]);
  const kinds = useMemo(() => [...new Set(articles.map((a) => a.kind))], [articles]);

  const filtered = useMemo(() => {
    return searchArticles(articles, query).filter((article) => {
      if (media && article.sourceLabel !== media) return false;
      if (source !== "all" && article.source !== source) return false;
      if (kind !== "all" && article.kind !== kind) return false;
      return true;
    });
  }, [articles, query, source, kind, media]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight">{media ? media : "記事"}</h1>
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
            value={source}
            onChange={setSource}
            options={sources.map((key) => ({
              value: key,
              label: SOURCE_LABEL[key] ?? key,
            }))}
          />
          <FilterRow
            value={kind}
            onChange={setKind}
            options={kinds.map((key) => ({ value: key, label: KIND_LABEL[key] }))}
          />
        </>
      )}
      <p className="text-xs tabular-nums text-muted-foreground">{filtered.length} 件</p>
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            該当する記事がありません。
          </p>
        ) : (
          filtered.map((article) => <ArticleCard key={article.id} article={article} />)
        )}
      </div>
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
