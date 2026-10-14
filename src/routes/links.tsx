import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: `リンク｜${SITE_NAME}` },
      {
        name: "description",
        content: "レビンズの試合へ向かうとき、キックオフまでに開く公式サイトの一覧です。",
      },
    ],
  }),
  component: LinksPage,
});

const GROUPS = [
  {
    title: "試合の前に",
    links: [
      {
        href: "https://www.yakult.co.jp/sports/rugby/",
        label: "レビンズ公式サイト",
        note: "お知らせと日程",
      },
      {
        href: "https://www.yakult.co.jp/sports/rugby/member/",
        label: "公式の選手一覧",
        note: "クラブが発表しているプロフィール",
      },
      {
        href: "https://x.com/yakultlevins",
        label: "レビンズ公式X",
        note: "出場メンバーはここに出ます",
      },
      {
        href: "https://note.com/yakultlevins",
        label: "レビンズ公式note",
        note: "選手の文章",
      },
      {
        href: "https://league-one.jp/",
        label: "リーグワン",
        note: "順位と試合",
      },
    ],
  },
] as const;

function LinksPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-[11px] tracking-[0.18em] text-accent">LINK</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">リンク</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          会場へ向かうとき、キックオフまでの待ち時間に開く場所です。公式のサイトと、このサイトの出場メンバーです。
        </p>
      </header>

      {GROUPS.map((group) => (
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
                <p className="text-base text-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
              </a>
            ))}
          </div>
        </section>
      ))}

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
