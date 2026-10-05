import { PLAYERS } from "@/data/players";
import { formatProposed, type ProfileFieldKey } from "@/data/profile-fields";

export type CheckSource = {
  label: string;
  url: string;
  found: boolean;
};

export type ProfileCheck = {
  verdict: "supports" | "conflicts" | "unclear";
  summary: string;
  sources: CheckSource[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 20_000);
}

async function fetchPlain(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, {
      headers: { accept: "text/html,text/plain,*/*", "user-agent": "TodaPressBot/1.0" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return stripHtml(await res.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function mentions(text: string, value: string): boolean {
  const needle = value.replace(/\s+/g, "").toLowerCase();
  if (needle.length < 2) return false;
  const hay = text.replace(/\s+/g, "").toLowerCase();
  if (hay.includes(needle)) return true;
  const digits = value.match(/\d+/g);
  if (digits && digits.some((d) => d.length >= 2 && hay.includes(d))) return true;
  return false;
}

export async function verifyProfileClaim(input: {
  playerSlug: string;
  playerName: string;
  fieldKey: ProfileFieldKey;
  currentValue: string;
  proposedValue: string;
}): Promise<ProfileCheck> {
  const player = PLAYERS.find((item) => item.slug === input.playerSlug);
  const encodedName = encodeURIComponent(input.playerName.replace(/\s/g, ""));
  const candidates: Array<{ label: string; url: string }> = [
    player?.profileUrl ? { label: "公式プロフィール", url: player.profileUrl } : null,
    { label: "Wikipedia", url: `https://ja.wikipedia.org/wiki/${encodedName}` },
    {
      label: "リーグワン選手検索",
      url: `https://league-one.jp/?s=${encodedName}`,
    },
    {
      label: "チーム公式メンバー",
      url: "https://www.yakult.co.jp/sports/rugby/member/",
    },
  ].filter((item): item is { label: string; url: string } => Boolean(item));

  const sources: CheckSource[] = await Promise.all(
    candidates.slice(0, 3).map(async (candidate) => {
      const text = await fetchPlain(candidate.url);
      return {
        label: candidate.label,
        url: candidate.url,
        found: Boolean(text && mentions(text, input.proposedValue)),
      };
    }),
  );

  const valueHits = sources.filter((item) => item.found);
  const proposed = formatProposed(input.fieldKey, input.proposedValue);
  const current = input.currentValue || "（空）";

  if (valueHits.length > 0) {
    return {
      verdict: "supports",
      summary: `${valueHits.map((item) => item.label).join("、")} に「${proposed}」に近い記述がありました。現在値は ${current}。最終判断は運営者の承認です。`,
      sources,
    };
  }

  return {
    verdict: "unclear",
    summary: `公開ページから「${proposed}」を自動では確認できませんでした。現在値は ${current}。公式プロフィールや記事と目視で照合してください。`,
    sources,
  };
}
