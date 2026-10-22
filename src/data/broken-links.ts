/** 404 または 410 だけを入れる。到達できないだけのサイトは入れない。2026-10-22 の確認。 */
export const BROKEN_ARTICLE_URLS: string[] = [
  "https://www.bravelupus.com/exclusive/story_91/",
];

function linkKey(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

const BROKEN = new Set(BROKEN_ARTICLE_URLS.map(linkKey));

export function isBrokenArticleUrl(url: string): boolean {
  return BROKEN.has(linkKey(url));
}
