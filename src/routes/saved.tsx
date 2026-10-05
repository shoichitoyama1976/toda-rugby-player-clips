import { createFileRoute, Link } from "@tanstack/react-router";
import { ArticleCard } from "@/components/article-card";
import { useClipStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/saved")({ component: SavedPage });

function SavedPage() {
  const { articles } = useCatalog();
  const bookmarks = useClipStore((s) => s.bookmarks);
  const saved = articles.filter((article) => bookmarks.includes(article.id));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight">保存した記事</h1>
        <p className="mt-2 text-sm text-muted-foreground">この端末の中だけに残ります。</p>
      </header>
      {saved.length === 0 ? (
        <p className="rounded-[var(--radius-md)] bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          まだありません。記事の右下の印を押すと、ここに溜まります。
          <Link to="/articles" className="mt-2 block text-accent">
            記事一覧へ
          </Link>
        </p>
      ) : (
        <div className="grid gap-3">
          {saved.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
