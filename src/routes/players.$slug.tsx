import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { Badge } from "@/components/ui/badge";
import { POSITION_LABEL, POSITION_UNIT } from "@/data/types";
import { articlesForPlayer, instagramHandle, noteHandle, playerCareer, xHandle } from "@/lib/catalog";
import { ageFromBirthday, formatDate, formatTokyoDate, yearsOnRoster } from "@/lib/format";
import { catalogFromHeadMatches, clipCount, playerJsonLd, playerSeo, SITE_NAME } from "@/lib/seo";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/players/$slug")({
  component: PlayerPage,
  head: ({ params, matches }) => {
    const { articles, players } = catalogFromHeadMatches(matches);
    const player = players.find((item) => item.slug === params.slug);
    if (!player) {
      return {
        meta: [{ title: `選手が見つかりません｜${SITE_NAME}` }],
      };
    }
    const { title, description } = playerSeo(player, clipCount(articles, player));
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
});

function PlayerPage() {
  const { slug } = Route.useParams();
  const { articles, players, origin, notices } = useCatalog();
  const player = players.find((item) => item.slug === slug);

  if (!player) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl">選手が見つかりません</h1>
        <Link to="/players" className="text-sm text-accent">
          名簿へ戻る
        </Link>
      </div>
    );
  }

  const clips = articlesForPlayer(articles, player.slug, player);
  const age = ageFromBirthday(player.birthday);
  const tenure = yearsOnRoster(player.joined, player.left);
  const career = playerCareer(player);
  const handle = player.xUrl ? xHandle(player.xUrl) : undefined;
  const ig = player.instagramUrl ? instagramHandle(player.instagramUrl) : undefined;
  const note = player.noteUrl ? noteHandle(player.noteUrl) : undefined;
  const personLd = playerJsonLd(origin, player, clips);
  const notice = notices.find((item) => item.playerSlug === player.slug);

  const glance = [
    player.heightCm ? { label: "身長", value: `${player.heightCm}`, unit: "cm" } : null,
    player.weightKg ? { label: "体重", value: `${player.weightKg}`, unit: "kg" } : null,
    age !== undefined ? { label: "年齢", value: `${age}`, unit: "歳" } : null,
    tenure !== undefined ? { label: "在籍", value: `${tenure}`, unit: "年" } : null,
  ].filter((item): item is { label: string; value: string; unit: string } => Boolean(item));

  const facts = [
    player.birthday ? { label: "生年月日", value: formatDate(player.birthday) } : null,
    player.origin ? { label: "出身", value: player.origin } : null,
    career.rugbySchool ? { label: "ラグビースクール", value: career.rugbySchool } : null,
    career.highSchool ? { label: "高校", value: career.highSchool } : null,
    career.university ? { label: "大学", value: career.university } : null,
    career.previousTeam ? { label: "経歴", value: career.previousTeam } : null,
    player.nickname ? { label: "ニックネーム", value: player.nickname } : null,
    player.sutoCall ? { label: "須藤選手ならこう呼ぶ", value: player.sutoCall } : null,
    player.joined ? { label: "加入", value: `${player.joined}年` } : null,
    player.left ? { label: "退団", value: `${player.left}年` } : null,
    ...(player.extras ?? []).map((fact) => ({ label: fact.label, value: fact.value })),
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const mark = player.unlisted
    ? "—"
    : player.category === "ホームタウン" || player.category === "ホストシティ"
      ? "ホ"
      : player.category === "スタッフ" || player.related
        ? "ス"
        : player.position;

  return (
    <div className="space-y-8">
      {personLd ? <JsonLd data={personLd} /> : null}
      <header className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted font-display text-sm text-accent">
            {mark}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-[0.18em] text-accent">
              {player.role
                ? player.role
                : player.related
                  ? player.category ?? "スタッフ"
                  : player.unlisted
                    ? "名簿外"
                    : `${POSITION_UNIT[player.position]} · ${POSITION_LABEL[player.position]}`}
            </p>
            <h1 className="mt-1 font-display text-4xl font-medium leading-tight tracking-tight">
              {player.name}
            </h1>
            {player.nameKana ? (
              <p className="mt-1 text-sm text-muted-foreground">{player.nameKana}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {player.category && player.category !== "選手" ? <Badge>{player.category}</Badge> : null}
              {player.captain ? <Badge tone="solid">共同キャプテン</Badge> : null}
              {!player.unlisted && !player.related && player.status === "former" ? (
                <Badge>過去所属</Badge>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-muted-foreground">掲載</p>
            <p className="font-display text-3xl tabular-nums leading-none">{clips.length}</p>
          </div>
        </div>

        {glance.length > 0 ? (
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] bg-border sm:grid-cols-4">
            {glance.map((item) => (
              <div key={item.label} className="bg-background px-3 py-3">
                <dt className="text-[11px] text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 font-display text-2xl tabular-nums leading-none">
                  {item.value}
                  <span className="ml-1 text-xs font-sans text-muted-foreground">{item.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {player.profileUrl || player.xUrl || player.instagramUrl || player.noteUrl ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {player.profileUrl ? (
              <ProfileLink href={player.profileUrl} label="公式プロフィール" />
            ) : null}
            {player.xUrl ? (
              <SocialLink href={player.xUrl} label={handle ? `X @${handle}` : "X"}>
                <XLogo />
              </SocialLink>
            ) : null}
            {player.instagramUrl ? (
              <SocialLink href={player.instagramUrl} label={ig ? `Instagram @${ig}` : "Instagram"}>
                <InstagramLogo />
              </SocialLink>
            ) : null}
            {player.noteUrl ? (
              <SocialLink href={player.noteUrl} label={note ? `note ${note}` : "note"}>
                <NoteLogo />
              </SocialLink>
            ) : null}
          </div>
        ) : null}
      </header>

      {notice ? (
        <aside className="rounded-[var(--radius-lg)] bg-muted px-4 py-3 text-sm leading-relaxed">
          <p className="text-[11px] text-muted-foreground">
            {notice.date ? formatTokyoDate(notice.date) : ""}
          </p>
          <p className="mt-1 text-foreground">
            {notice.kind === "pending"
              ? "修正依頼が届いています。選手情報の一部に間違った情報が含まれているかもしれません。"
              : notice.fields.length > 0
                ? `${notice.fields.join("、")}を修正しました。`
                : "選手情報を修正しました。"}
          </p>
        </aside>
      ) : null}

      {facts.length > 0 ? (
        <section>
          <h2 className="font-display text-xl tracking-tight">プロフィール</h2>
          <dl className="mt-4 divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-border)]">
            {facts.map((fact) => (
              <div key={fact.label} className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                <dt className="text-[11px] leading-5 text-muted-foreground">{fact.label}</dt>
                <dd className="text-sm leading-5">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <Link
            to="/corrections"
            search={{ slug: player.slug }}
            className="mt-3 inline-flex h-11 items-center text-sm text-muted-foreground hover:text-foreground"
          >
            プロフィールの修正を依頼する
          </Link>
        </section>
      ) : (
        <Link
          to="/corrections"
          search={{ slug: player.slug }}
          className="inline-flex h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          プロフィールの修正を依頼する
        </Link>
      )}

      <section>
        <h2 className="font-display text-xl tracking-tight">掲載記事</h2>
        <div className="mt-4 grid gap-3">
          {clips.length === 0 ? (
            <p className="rounded-[var(--radius-md)] bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
              まだ掲載記事がありません。シートの Clips に、この人の ID を付けて追加するとここに出ます。
            </p>
          ) : (
            clips.map((article) => <ArticleCard key={article.id} article={article} />)
          )}
        </div>
      </section>
    </div>
  );
}

function ProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-muted px-3 text-sm text-accent hover:text-foreground"
    >
      {label}
      <ExternalLink className="size-3.5" />
    </a>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-foreground hover:text-accent"
    >
      {children}
    </a>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.422-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.85.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.849.079-3.2042.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 7.027 1.44 1.44 0 0 0 16.953 5.5864M12.012 7.0226c-2.7543 0-4.987 2.2317-4.987 4.9868 0 2.7548 2.2327 4.987 4.987 4.987 2.754 0 4.9868-2.2322 4.9868-4.987 0-2.7551-2.2328-4.9868-4.9868-4.9868m0 8.2218c-1.786 0-3.235-1.4486-3.235-3.235 0-1.7864 1.449-3.235 3.235-3.235 1.7862 0 3.2348 1.4486 3.2348 3.235 0 1.7864-1.4486 3.235-3.2348 3.235" />
    </svg>
  );
}

function NoteLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
      <path d="M0 .279c4.623 0 10.953-.235 15.498-.117 6.099.156 8.39 2.813 8.468 9.374.077 3.71 0 14.335 0 14.335h-6.598c0-9.296.04-10.83 0-13.759-.078-2.578-.814-3.807-2.795-4.041-2.097-.235-7.975-.04-7.975-.04v17.84H0Z" />
    </svg>
  );
}
