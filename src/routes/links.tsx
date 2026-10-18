import { createFileRoute, Link } from "@tanstack/react-router";
import linksCsv from "@/data/links.csv?raw";
import { parseDelimited } from "@/lib/csv";
import { SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: `リンク｜${SITE_NAME}` },
      {
        name: "description",
        content: "レビンズの試合へ向かうときに開くサイトです。レビンズ公式と、それ以外に分けています。",
      },
    ],
  }),
  component: LinksPage,
});

type LinkItem = { href: string; label: string; operator: string };

function sheetLinks(): LinkItem[] {
  const rows = parseDelimited(linksCsv);
  if (rows.length < 2) return [];
  const header = rows[0];
  const index = (name: string) => header.indexOf(name);
  const operator = index("運営");
  const label = index("サイト名");
  const url = index("URL");
  return rows.slice(1).flatMap((row) => {
    const href = row[url]?.trim() ?? "";
    const name = row[label]?.trim() ?? "";
    if (!/^https?:\/\//i.test(href) || !name) return [];
    return [{ href, label: name, operator: row[operator]?.trim() ?? "" }];
  });
}

const ITEMS = sheetLinks();
const GROUPS = [
  { title: "レビンズ公式", links: ITEMS.filter((item) => item.operator === "レビンズ公式") },
  { title: "その他", links: ITEMS.filter((item) => item.operator !== "レビンズ公式") },
];

function LinksPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-[11px] tracking-[0.18em] text-accent">LINK</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">リンク</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          会場へ向かうとき、キックオフまでの待ち時間に開く場所です。レビンズ公式と、それ以外に分けています。
        </p>
      </header>

      {GROUPS.map((group) =>
        group.links.length === 0 ? null : (
          <section key={group.title} className="space-y-3">
            <h2 className="font-display text-xl tracking-tight">{group.title}</h2>
            <div className="grid gap-3">
              {group.links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[var(--radius-lg)] bg-card px-4 py-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
                >
                  <p className="text-base text-foreground">
                    {group.title === "その他" ? `${item.operator} ${item.label}` : item.label}
                  </p>
                </a>
              ))}
            </div>
          </section>
        ),
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-tight">このサイト</h2>
        <Link
          to="/matches"
          className="block rounded-[var(--radius-lg)] bg-card px-4 py-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
        >
          <p className="text-base text-foreground">出場メンバーから記事へ</p>
          <p className="mt-1 text-sm text-muted-foreground">名前をタップすると、その選手の掲載記事へ進みます</p>
        </Link>
      </section>
    </div>
  );
}
