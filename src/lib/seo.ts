import { createServerFn } from "@tanstack/react-start";
import { POSITION_LABEL, type Article, type Player } from "@/data/types";
import { articlesForPlayer, resolveCatalog } from "@/lib/catalog";

export const SITE_NAME = "戸田ラグビー選手記事帖";

export function displayPersonName(name: string): string {
  return name.replace(/[ 　]+/g, " ").trim();
}

export function playerSeo(player: Player, count: number): { title: string; description: string } {
  const name = displayPersonName(player.name);
  const title = `${name}の掲載記事｜${SITE_NAME}`;
  const description =
    count > 0
      ? `${name}が出てきたオンライン記事 ${count} 件。${SITE_NAME}（非公式）。本文は転載せず、原文へ案内します。`
      : `${name}の掲載記事一覧。${SITE_NAME}（非公式）。本文は転載しません。`;
  return { title, description };
}

export function catalogFromSheetData(data: unknown): { articles: Article[]; players: Player[] } {
  const sheet = (data as { sheet?: { ok?: boolean; csv?: string; playersCsv?: string | null } } | undefined)
    ?.sheet;
  if (sheet?.ok) return resolveCatalog(sheet.csv ?? null, sheet.playersCsv ?? null);
  return resolveCatalog(null, null);
}

export function catalogFromHeadMatches(
  matches: Array<{ loaderData?: unknown }>,
): { articles: Article[]; players: Player[] } {
  for (const match of matches) {
    if (match.loaderData && typeof match.loaderData === "object" && "sheet" in match.loaderData) {
      return catalogFromSheetData(match.loaderData);
    }
  }
  return resolveCatalog(null, null);
}

export function clipCount(articles: Article[], player: Player): number {
  return articlesForPlayer(articles, player.slug, player).length;
}

const PUBLIC_ORIGIN = "https://toda-rugby-player-clips.grok.me";

function headerHosts(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function requestOrigin(request: Request): string {
  const headers = request.headers;
  const hosts = [...headerHosts(headers.get("x-forwarded-host")), ...headerHosts(headers.get("host"))];
  const grok = hosts.find((host) => host === "grok.me" || host.endsWith(".grok.me"));
  if (grok) return `https://${grok}`;
  const host = hosts[0] ?? "localhost:8080";
  if (host.endsWith(".vercel.app")) return PUBLIC_ORIGIN;
  const forwarded = headers.get("x-forwarded-proto");
  const proto = forwarded?.split(",")[0]?.trim() ?? (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;")
    .replaceAll("'", "&" + "apos;");
}

export const loadRequestOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  try {
    return requestOrigin(getRequest());
  } catch {
    return "";
  }
});

function personJobTitle(player: Player): string | undefined {
  if (player.role) return player.role;
  if (player.category && player.category !== "選手") return player.category;
  return POSITION_LABEL[player.position];
}

export function websiteJsonLd(origin: string) {
  if (!origin) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Lovins Clips Connect With Levins",
    url: origin,
    inLanguage: "ja",
    description:
      "レビンズの選手が出てきたオンライン記事を、選手や媒体ごとにたどる非公式の索引です。本文は転載しません。",
    publisher: {
      "@type": "Person",
      name: "個人運営（非公式）",
    },
  };
}

export function playerJsonLd(origin: string, player: Player, clips: Article[]) {
  if (!origin) return null;
  const name = displayPersonName(player.name);
  const page = `${origin}/players/${player.slug}`;
  const jobTitle = personJobTitle(player);
  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${page}#person`,
    name,
    url: page,
    description: `${name}の掲載記事をたどる非公式の索引。${SITE_NAME}。公式プロフィールではありません。`,
  };
  if (player.nameKana) person.alternateName = player.nameKana;
  if (jobTitle) person.jobTitle = jobTitle;
  const sameAs = [player.xUrl, player.instagramUrl, player.noteUrl].filter((url): url is string => Boolean(url));
  if (sameAs.length > 0) person.sameAs = sameAs;
  if (player.category !== "ホームタウン") {
    person.memberOf = {
      "@type": "SportsTeam",
      name: "ヤクルトレビンズ戸田",
      sport: "Rugby",
    };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "ItemList",
        "@id": `${page}#clips`,
        name: `${name}の掲載記事`,
        description: "原文への案内です。記事本文は転載していません。",
        url: page,
        numberOfItems: clips.length,
        itemListElement: clips.slice(0, 50).map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: article.title,
          url: /^https?:\/\//i.test(article.url) ? article.url : `${origin}/articles/${article.id}`,
        })),
      },
    ],
  };
}
