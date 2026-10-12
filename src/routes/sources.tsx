import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { MediaMark, dominantMediaKind } from "@/components/media-mark";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/sources")({ component: SourcesPage });

function SourcesPage() {
  const { articles } = useCatalog();
  const rows = useMemo(() => {
    const counts = new Map<string, { count: number; urls: string[] }>();
    for (const article of articles) {
      const label = article.sourceLabel.trim() || "その他";
      const row = counts.get(label) ?? { count: 0, urls: [] };
      row.count += 1;
      row.urls.push(article.url);
      counts.set(label, row);
    }
    return [...counts.entries()]
      .map(([label, row]) => ({ label, count: row.count, kind: dominantMediaKind(row.urls) }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));
  }, [articles]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight">媒体</h1>
        <p className="mt-2 text-sm text-muted-foreground">掲載媒体ごとの記事数です。タップすると、その媒体の記事一覧へ進みます。</p>
      </header>
      <p className="text-xs tabular-nums text-muted-foreground">{rows.length} 媒体</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <Link
            key={row.label}
            to="/articles"
            search={{ media: row.label }}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
          >
            <p className="flex min-w-0 items-center gap-2 font-medium">
              <MediaMark kind={row.kind} />
              <span className="truncate">{row.label}</span>
            </p>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg tabular-nums leading-none">{row.count}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">件</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
